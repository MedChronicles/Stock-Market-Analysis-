import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft, Search, TrendingUp, ChevronRight, Sparkles, DollarSign, ShoppingCart, Zap, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import OrderMatchingPreview from '../components/OrderMatchingPreview';
import OrderExecutionSummary from '../components/OrderExecutionSummary';

export default function BuyStock() {
  const navigate = useNavigate();
  const { currentUser, stocks, buyStock, getOrderBook } = useTrading();
  
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<string>('');
  const [isIcebergOrder, setIsIcebergOrder] = useState(false);
  const [icebergChunkSize, setIcebergChunkSize] = useState('');
  const [isPendingOrder, setIsPendingOrder] = useState(false);
  const [executionSummary, setExecutionSummary] = useState<{
    fills: Array<{ price: number; quantity: number; priority: number }>;
    weightedAvgPrice: number;
  } | null>(null);

  const stock = stocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  
  const pricePerShare = useCustomPrice && customPrice ? parseFloat(customPrice) : (stock?.bestAsk || 0);
  const qty = parseInt(quantity || '0');
  const estimatedCost = pricePerShare && qty > 0 ? pricePerShare * qty : 0;
  const remainingBalance = (currentUser?.balance || 0) - estimatedCost;
  const canAfford = remainingBalance >= 0 && estimatedCost > 0;

  // Calculate VWAP (Volume Weighted Average Price)
  const vwap = useMemo(() => {
    if (!stock) return 0;
    // Simulated VWAP based on current price and some variance
    const basePrice = stock.bestAsk || 0;
    const vwapPrice = basePrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% variance
    return vwapPrice;
  }, [stock]);

  // Smart Price Suggestion: Check if custom price is below market
  useEffect(() => {
    setPriceSuggestion('');
    setIsPendingOrder(false);
    
    if (stock && useCustomPrice && customPrice) {
      const userPrice = parseFloat(customPrice);
      const marketPrice = stock.bestAsk || 0;
      
      if (userPrice > 0 && marketPrice > 0) {
        const percentageBelow = ((marketPrice - userPrice) / marketPrice) * 100;
        
        // If price is below market, it becomes a pending limit order
        if (userPrice < marketPrice) {
          setIsPendingOrder(true);
          setPriceSuggestion(`📋 Your price ($${userPrice.toFixed(2)}) is ${percentageBelow.toFixed(1)}% below market ($${marketPrice.toFixed(2)}). This will be a LIMIT ORDER - we'll execute when price drops to your level.`);
        }
      }
    }
  }, [stock, customPrice, useCustomPrice]);

  // Auto-fill custom price when market price is selected
  useEffect(() => {
    if (stock && !useCustomPrice && stock.bestAsk) {
      setCustomPrice(stock.bestAsk.toFixed(2));
    }
  }, [stock, useCustomPrice]);

  // Filter stocks based on search
  const filteredStocks = useMemo(() => {
    if (!symbol || symbol.length < 1) return stocks.filter(s => s.bestAsk > 0).slice(0, 20);
    const term = symbol.toLowerCase();
    return stocks.filter(s => 
      s.bestAsk > 0 && (
        s.symbol.toLowerCase().includes(term) || 
        s.name.toLowerCase().includes(term)
      )
    ).slice(0, 20);
  }, [symbol, stocks]);

  // Top movers
  const topGainers = useMemo(() => 
    [...stocks]
      .filter(s => s.bestAsk > 0 && s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 6),
    [stocks]
  );

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setExecutionSummary(null);
    setIsPurchasing(true);

    try {
      // Validation
      if (!stock) {
        setError('Invalid stock symbol');
        return;
      }

      if (isNaN(qty) || qty <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      if (qty > 10000) {
        setError('Maximum quantity per order is 10,000 shares');
        return;
      }

      if (useCustomPrice && (isNaN(pricePerShare) || pricePerShare <= 0)) {
        setError('Please enter a valid price per share');
        return;
      }

      if (useCustomPrice && pricePerShare < 0.01) {
        setError('Price per share cannot be less than $0.01');
        return;
      }

      if (useCustomPrice && pricePerShare > 1000000) {
        setError('Price per share cannot exceed $1,000,000');
        return;
      }

      // Check if price is too high above market (more than 50% above)
      if (useCustomPrice && pricePerShare > (stock.bestAsk * 1.5)) {
        setError(`Price is too high! Maximum allowed is $${(stock.bestAsk * 1.5).toFixed(2)} (50% above market price of $${stock.bestAsk.toFixed(2)})`);
        return;
      }

      if (!currentUser) {
        setError('Please login first');
        return;
      }

      if (!canAfford) {
        setError(`Insufficient balance. You need $${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} but only have $${currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        return;
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Pass custom price to buyStock function
      const customPriceToUse = useCustomPrice ? pricePerShare : undefined;

      // For market orders, calculate the actual execution breakdown
      let fills: Array<{ price: number; quantity: number; priority: number }> = [];
      let weightedAvgPrice = 0;

      if (!useCustomPrice) {
        const orderBook = getOrderBook(stock.symbol);
        const sellOrders = orderBook.sellOrders;
        let remainingQty = qty;
        let totalCost = 0;

        for (let i = 0; i < sellOrders.length && remainingQty > 0; i++) {
          const order = sellOrders[i];
          const fillQty = Math.min(remainingQty, order.quantity);
          const fillCost = fillQty * order.price;
          totalCost += fillCost;
          remainingQty -= fillQty;
          fills.push({
            price: order.price,
            quantity: fillQty,
            priority: i + 1,
          });
        }

        weightedAvgPrice = totalCost / (qty - remainingQty);
      }

      if (buyStock(stock.symbol, qty, customPriceToUse)) {
        const priceUsed = useCustomPrice ? pricePerShare : stock.bestAsk;

        // Check if this is a limit order (price below market)
        if (isPendingOrder && useCustomPrice && priceUsed < (stock.bestAsk || 0)) {
          setSuccess(`📋 Limit Order placed! We've added your request to buy ${qty} ${qty === 1 ? 'share' : 'shares'} of ${stock.symbol} at $${priceUsed.toFixed(2)}. We'll execute when the market price drops to your level. Check Portfolio > Pending Orders.`);
        } else {
          if (!useCustomPrice && fills.length > 0) {
            setExecutionSummary({ fills, weightedAvgPrice });
          } else {
            setSuccess(`🎉 Successfully purchased ${qty} ${qty === 1 ? 'share' : 'shares'} of ${stock.symbol} at $${priceUsed.toFixed(2)}!`);
          }
        }

        setSymbol('');
        setQuantity('');
        setCustomPrice('');
        setUseCustomPrice(false);
        setIsIcebergOrder(false);
        setIcebergChunkSize('');
        setTimeout(() => {
          setSuccess('');
          setExecutionSummary(null);
        }, 10000);
      } else {
        setError('Transaction failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSelectStock = (stockSymbol: string) => {
    setSymbol(stockSymbol);
    setShowStockDropdown(false);
    setError('');
    setSuccess('');
  };

  const handleQuickQuantity = (amount: string) => {
    setQuantity(amount);
  };

  const maxAffordableShares = stock && pricePerShare > 0 ? Math.floor((currentUser?.balance || 0) / pricePerShare) : 0;

  const handleSetMarketPrice = () => {
    if (stock && stock.bestAsk) {
      setCustomPrice(stock.bestAsk.toFixed(2));
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#00c853] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00c853] to-[#00a844] flex items-center justify-center shadow-lg shadow-[#00c853]/50">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00c853] via-[#00e676] to-[#00c853] bg-clip-text text-transparent animate-gradient">
                  Buy Stocks
                </h1>
                <p className="text-sm text-[#888888] mt-0.5">
                  Purchase at Market or Custom Price
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Buy Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card with Glow Effect */}
            <div className="relative bg-gradient-to-br from-[#00c853]/20 via-[#00a844]/10 to-[#0d0d0d] border border-[#00c853]/50 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c853]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#888888] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Available Balance
                    </p>
                    <p className="text-4xl font-mono font-bold text-[#00c853] mb-1">
                      ${(currentUser?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[#888888]">Ready to invest</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00c853]/30 rounded-full blur-xl"></div>
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00c853] to-[#00a844] flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buy Form with Enhanced Design */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl">
              <form onSubmit={handleBuy} className="space-y-6">
                {/* Stock Symbol with Autocomplete */}
                <div className="space-y-3">
                  <Label htmlFor="symbol" className="text-white text-sm font-semibold uppercase tracking-wide">
                    Select Company
                  </Label>
                  <div className="relative">
                    <Input
                      id="symbol"
                      type="text"
                      value={symbol}
                      onChange={(e) => {
                        setSymbol(e.target.value.toUpperCase());
                        setShowStockDropdown(true);
                      }}
                      onFocus={() => setShowStockDropdown(true)}
                      placeholder="Type company name or symbol (e.g., Apple, TSLA)"
                      className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#00c853] text-white font-mono pr-10 h-14 text-lg rounded-xl transition-all"
                      autoComplete="off"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                    
                    {/* Autocomplete Dropdown */}
                    {showStockDropdown && filteredStocks.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-[#1a1a2e] border-2 border-[#2a2a2a] rounded-xl shadow-2xl max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredStocks.map((s) => (
                          <button
                            key={s.symbol}
                            type="button"
                            onClick={() => handleSelectStock(s.symbol)}
                            className="w-full flex items-center justify-between p-3 hover:bg-[#00c853]/10 border-b border-[#2a2a2a] last:border-b-0 transition-all text-left"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00c853] to-[#00a844] flex items-center justify-center text-xs font-mono font-bold text-white shadow-lg">
                                {s.symbol.substring(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                                <p className="text-xs text-[#888888] font-mono">{s.symbol}</p>
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-sm font-mono font-semibold text-white">${(s.bestAsk || 0).toFixed(2)}</p>
                              <p className={`text-xs font-mono font-bold ${(s.changePercent || 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                                {(s.changePercent || 0) >= 0 ? '+' : ''}{(s.changePercent || 0).toFixed(2)}%
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Stock Found */}
                  {stock && (
                    <>
                      <div className="relative overflow-hidden flex items-center gap-3 p-4 bg-gradient-to-r from-[#00c853]/20 to-[#00c853]/5 border-2 border-[#00c853]/40 rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00c853]/10 to-transparent opacity-50"></div>
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#00c853] to-[#00a844] flex items-center justify-center font-mono font-bold text-white text-lg shadow-lg">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div className="flex-1 relative">
                          <p className="text-white font-semibold text-lg">{stock.name}</p>
                          <p className="text-sm text-[#888888] font-mono">{stock.symbol}</p>
                        </div>
                        <div className="text-right relative">
                          <p className="text-xl font-mono text-white font-bold">${(stock.bestAsk || 0).toFixed(2)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            {(stock.changePercent || 0) >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-[#00c853]" />
                            ) : (
                              <TrendingUp className="w-3 h-3 text-[#ff1744] rotate-180" />
                            )}
                            <p className={`text-xs font-mono font-semibold ${(stock.changePercent || 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                              {(stock.changePercent || 0) >= 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* VWAP Display */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#2979ff]/10 border border-[#2979ff]/30 rounded-xl">
                          <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">VWAP</p>
                          <p className="text-lg font-mono font-bold text-[#2979ff]">${vwap.toFixed(2)}</p>
                          <p className="text-xs text-[#888888] mt-1">Volume Weighted Avg</p>
                        </div>
                        <div className="p-3 bg-[#00c853]/10 border border-[#00c853]/30 rounded-xl">
                          <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Best Ask</p>
                          <p className="text-lg font-mono font-bold text-[#00c853]">${(stock.bestAsk || 0).toFixed(2)}</p>
                          <p className="text-xs text-[#888888] mt-1">Current Market Price</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Stock Not Found */}
                  {symbol && !stock && !showStockDropdown && (
                    <div className="flex items-center gap-3 p-4 bg-[#ff1744]/10 border-2 border-[#ff1744]/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-[#ff1744]/20 flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#ff1744]" />
                      </div>
                      <p className="text-[#ff1744] text-sm font-medium">Stock symbol "{symbol}" not found. Please select from the dropdown.</p>
                    </div>
                  )}
                </div>

                {/* Price Selection Toggle */}
                {stock && (
                  <div className="space-y-3">
                    <Label className="text-white text-sm font-semibold uppercase tracking-wide">
                      Select Price Type
                    </Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setUseCustomPrice(false)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          !useCustomPrice
                            ? 'bg-[#00c853]/20 border-[#00c853] text-white'
                            : 'bg-[#0d0d0d] border-[#2a2a2a] text-[#888888] hover:border-[#3a3a3a]'
                        }`}
                      >
                        <p className="font-semibold mb-1">Market Price</p>
                        <p className="text-lg font-mono font-bold">${(stock.bestAsk || 0).toFixed(2)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomPrice(true)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          useCustomPrice
                            ? 'bg-[#2979ff]/20 border-[#2979ff] text-white'
                            : 'bg-[#0d0d0d] border-[#2a2a2a] text-[#888888] hover:border-[#3a3a3a]'
                        }`}
                      >
                        <p className="font-semibold mb-1">Custom Price</p>
                        <p className="text-xs">Set your own price</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Price Input */}
                {stock && useCustomPrice && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customPrice" className="text-white text-sm font-semibold uppercase tracking-wide">
                        Enter Your Price Per Share
                      </Label>
                      <button
                        type="button"
                        onClick={handleSetMarketPrice}
                        className="text-xs text-[#2979ff] hover:text-[#1e5dd8] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Use Market Price
                      </button>
                    </div>
                    <Input
                      id="customPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="Enter price per share (e.g., 150.00)"
                      className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#2979ff] text-white font-mono h-14 text-lg rounded-xl transition-all"
                      required
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">Market: ${(stock?.bestAsk || 0).toFixed(2)}</span>
                      <span className="text-[#2979ff] font-semibold">Your Price: ${parseFloat(customPrice || '0').toFixed(2)}</span>
                    </div>
                    {priceSuggestion && (() => {
                      const marketPrice = stock?.bestAsk || 0;
                      const suggestedPrice = (marketPrice * 0.93).toFixed(2);
                      return (
                        <div className="p-3 bg-gradient-to-r from-[#ff9800]/20 to-[#ff9800]/5 border-2 border-[#ff9800] rounded-xl">
                          <p className="text-[#ff9800] text-sm font-semibold mb-2">{priceSuggestion}</p>
                          <button
                            type="button"
                            onClick={() => setCustomPrice(suggestedPrice)}
                            className="w-full px-4 py-2 bg-[#ff9800] hover:bg-[#f57c00] text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Use Suggested Price ${suggestedPrice}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Order Matching Preview - Show which orders will be filled */}
                {stock && qty > 0 && !useCustomPrice && (() => {
                  const orderBook = getOrderBook(stock.symbol);
                  return (
                    <OrderMatchingPreview 
                      requestedQuantity={qty}
                      availableOrders={orderBook.sellOrders}
                      type="buy"
                      stockSymbol={stock.symbol}
                    />
                  );
                })()}

                {/* Quantity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quantity" className="text-white text-sm font-semibold uppercase tracking-wide">
                      Quantity (Shares)
                    </Label>
                    {stock && maxAffordableShares > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickQuantity(Math.min(maxAffordableShares, 10000).toString())}
                        className="text-xs text-[#2979ff] hover:text-[#1e5dd8] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        Max: {Math.min(maxAffordableShares, 10000).toLocaleString()}
                      </button>
                    )}
                  </div>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter number of shares (1-10,000)"
                    className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#00c853] text-white font-mono h-14 text-lg rounded-xl transition-all"
                    required
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['10', '50', '100', '500', '1000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickQuantity(amt)}
                        className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#00c853] hover:border-[#00c853] border border-[#2a2a2a] rounded-lg text-sm font-mono font-semibold transition-all transform hover:scale-105"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Iceberg Order (for large orders) */}
                {stock && qty >= 100 && (
                  <div className="bg-gradient-to-r from-[#2979ff]/10 to-[#2979ff]/5 border border-[#2979ff]/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#2979ff]/20 flex items-center justify-center">
                          <span className="text-lg">🧊</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">Iceberg Order</p>
                          <p className="text-xs text-[#888888]">Hide large order size</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsIcebergOrder(!isIcebergOrder)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          isIcebergOrder ? 'bg-[#2979ff]' : 'bg-[#2a2a2a]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            isIcebergOrder ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {isIcebergOrder && (
                      <div className="space-y-2">
                        <Label htmlFor="icebergChunk" className="text-white text-xs uppercase tracking-wide">
                          Display Quantity (Chunk Size)
                        </Label>
                        <Input
                          id="icebergChunk"
                          type="number"
                          min="1"
                          max={qty}
                          value={icebergChunkSize}
                          onChange={(e) => setIcebergChunkSize(e.target.value)}
                          placeholder={`e.g., ${Math.min(50, Math.floor(qty / 2))}`}
                          className="bg-[#0d0d0d] border border-[#2979ff]/30 focus:border-[#2979ff] text-white font-mono text-sm rounded-lg h-10 transition-all"
                        />
                        <p className="text-xs text-[#888888]">
                          💡 Total: {qty} shares • Visible: {icebergChunkSize || '0'} shares at a time
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                {stock && quantity && qty > 0 && pricePerShare > 0 && (
                  <div className="bg-[#0d0d0d] border-2 border-[#2a2a2a] rounded-xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Order Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                        <span className="text-[#888888] text-sm">Company</span>
                        <span className="font-semibold text-white">{stock.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                        <span className="text-[#888888] text-sm">Stock Symbol</span>
                        <span className="font-mono text-white font-semibold">{stock.symbol}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                        <span className="text-[#888888] text-sm">{useCustomPrice ? 'Your Price' : 'Market Price'}</span>
                        <span className="font-mono text-[#2979ff] font-semibold">${pricePerShare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                        <span className="text-[#888888] text-sm">Quantity</span>
                        <span className="font-mono text-white font-semibold">{quantity} shares</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-[#1a1a2e] -mx-5 px-5 rounded-lg">
                        <span className="text-white font-bold">Total Cost</span>
                        <span className="font-mono text-2xl text-[#00c853] font-bold">
                          ${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[#888888] text-sm">Remaining Balance</span>
                        <span className={`font-mono font-semibold ${canAfford ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                          ${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {error && (
                  <div className="p-4 bg-[#ff1744]/10 border-2 border-[#ff1744] rounded-xl animate-shake">
                    <p className="text-[#ff1744] text-sm font-semibold">{error}</p>
                  </div>
                )}
                {executionSummary && stock && (
                  <OrderExecutionSummary
                    type="buy"
                    symbol={stock.symbol}
                    totalQuantity={executionSummary.fills.reduce((sum, f) => sum + f.quantity, 0)}
                    fills={executionSummary.fills}
                    weightedAvgPrice={executionSummary.weightedAvgPrice}
                  />
                )}
                {success && (
                  <div className="p-4 bg-[#00c853]/10 border-2 border-[#00c853] rounded-xl">
                    <p className="text-[#00c853] text-sm font-semibold whitespace-pre-line">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00c853] via-[#00e676] to-[#00c853] hover:from-[#00a844] hover:via-[#00c853] hover:to-[#00a844] text-white h-16 text-lg font-bold shadow-lg shadow-[#00c853]/50 hover:shadow-[#00c853]/80 transition-all rounded-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={!stock || !quantity || qty <= 0 || isPurchasing || !canAfford || (useCustomPrice && (!customPrice || parseFloat(customPrice) <= 0)) || pricePerShare <= 0}
                >
                  {isPurchasing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Confirm Purchase - ${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Market Info */}
          <div className="space-y-6">
            {/* Top Gainers */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#00c853]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Top Gainers</h3>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {topGainers.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock.symbol)}
                    className="w-full flex items-center justify-between p-3 bg-[#0d0d0d] hover:bg-gradient-to-r hover:from-[#00c853]/10 hover:to-transparent border border-transparent hover:border-[#00c853]/30 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00c853] to-[#00a844] flex items-center justify-center text-xs font-mono font-bold text-white shadow-lg">
                        {stock.symbol.substring(0, 2)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-mono font-semibold text-white">{stock.symbol}</p>
                        <p className="text-xs text-[#888888] truncate max-w-[100px]">{stock.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-mono font-semibold text-white">${(stock.bestAsk || 0).toFixed(2)}</p>
                        <p className="text-xs font-mono font-bold text-[#00c853]">+{(stock.changePercent || 0).toFixed(2)}%</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-[#00c853] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0d0d0d;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a3a3a;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
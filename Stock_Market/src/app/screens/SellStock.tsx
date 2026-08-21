import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft, Search, TrendingDown, ChevronRight, Wallet, DollarSign, TrendingUp, Zap, BadgeDollarSign, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import OrderExecutionSummary from '../components/OrderExecutionSummary';

export default function SellStock() {
  const navigate = useNavigate();
  const { currentUser, stocks, sellStock, getOrderBook } = useTrading();
  
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelling, setIsSelling] = useState(false);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<string>('');
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [isPendingOrder, setIsPendingOrder] = useState(false);
  const [executionSummary, setExecutionSummary] = useState<{
    fills: Array<{ price: number; quantity: number; priority: number }>;
    weightedAvgPrice: number;
  } | null>(null);

  const stock = stocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  
  // Get owned shares from portfolio
  const holding = currentUser?.portfolio.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
  const ownedShares = holding?.quantity || 0;
  
  const pricePerShare = useCustomPrice && customPrice ? parseFloat(customPrice) : (stock?.bestBid || 0);
  const qty = parseInt(quantity || '0');
  const estimatedProceeds = pricePerShare && qty > 0 ? pricePerShare * qty : 0;
  const newBalance = (currentUser?.balance || 0) + estimatedProceeds;

  // Smart Price Suggestion: Check if custom price is above market
  useEffect(() => {
    setPriceSuggestion('');
    setSuggestedPrice(0);
    setIsPendingOrder(false);
    
    if (stock && useCustomPrice && customPrice) {
      const userPrice = parseFloat(customPrice);
      const marketPrice = stock.bestBid || 0;
      
      if (userPrice > 0 && marketPrice > 0) {
        const percentageAbove = ((userPrice - marketPrice) / marketPrice) * 100;
        
        // If user tries to sell more than 10% above market
        if (percentageAbove > 10) {
          const betterPrice = marketPrice * 1.07; // 7% above market is reasonable
          setSuggestedPrice(betterPrice);
          setPriceSuggestion(`⚠️ Your price ($${userPrice.toFixed(2)}) is ${percentageAbove.toFixed(1)}% above market ($${marketPrice.toFixed(2)}). Best achievable price: ~$${betterPrice.toFixed(2)} (+7%)`);
        }
        // If price is above market but reasonable (1-10%)
        else if (userPrice > marketPrice) {
          setIsPendingOrder(true);
          setPriceSuggestion(`📋 Your price ($${userPrice.toFixed(2)}) is ${percentageAbove.toFixed(1)}% above market ($${marketPrice.toFixed(2)}). This will be a LIMIT ORDER - we'll execute when price rises to your level.`);
        }
      }
    }
  }, [stock, customPrice, useCustomPrice]);

  // Filter stocks based on search
  const filteredStocks = useMemo(() => {
    if (!searchTerm) return stocks.filter(s => s.bestBid > 0).slice(0, 15);
    const term = searchTerm.toLowerCase();
    return stocks.filter(s => 
      s.bestBid > 0 && (
        s.symbol.toLowerCase().includes(term) || 
        s.name.toLowerCase().includes(term)
      )
    ).slice(0, 15);
  }, [searchTerm, stocks]);

  // Portfolio stocks
  const portfolioStocks = useMemo(() => {
    if (!currentUser || !currentUser.portfolio) return [];
    return currentUser.portfolio
      .filter(item => item.quantity > 0)
      .map(item => {
        const stockData = stocks.find(s => s.symbol === item.symbol);
        return {
          symbol: item.symbol,
          quantity: item.quantity,
          name: item.name,
          price: stockData?.bestBid || item.currentPrice,
          changePercent: stockData?.changePercent || 0,
          value: (stockData?.bestBid || item.currentPrice) * item.quantity
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [currentUser, stocks]);

  // Top losers
  const topLosers = useMemo(() => 
    [...stocks]
      .filter(s => (s.bestBid || 0) > 0 && (s.changePercent || 0) < 0)
      .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
      .slice(0, 6),
    [stocks]
  );

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setExecutionSummary(null);
    setIsSelling(true);

    try {
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
      if (useCustomPrice && pricePerShare > (stock.bestBid * 1.5)) {
        setError(`Price is too high! Maximum allowed is $${(stock.bestBid * 1.5).toFixed(2)} (50% above market price of $${stock.bestBid.toFixed(2)})`);
        return;
      }

      if (!currentUser) {
        setError('Please login first');
        return;
      }

      if (qty > ownedShares) {
        setError(`Insufficient shares. You only own ${ownedShares} ${ownedShares === 1 ? 'share' : 'shares'} of ${stock.symbol}`);
        return;
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Pass custom price to sellStock function
      const customPriceToUse = useCustomPrice ? pricePerShare : undefined;

      // For market orders, calculate the actual execution breakdown
      let fills: Array<{ price: number; quantity: number; priority: number }> = [];
      let weightedAvgPrice = 0;

      if (!useCustomPrice) {
        const orderBook = getOrderBook(stock.symbol);
        const buyOrders = orderBook.buyOrders;
        let remainingQty = qty;
        let totalRevenue = 0;

        for (let i = 0; i < buyOrders.length && remainingQty > 0; i++) {
          const order = buyOrders[i];
          const fillQty = Math.min(remainingQty, order.quantity);
          const fillRevenue = fillQty * order.price;
          totalRevenue += fillRevenue;
          remainingQty -= fillQty;
          fills.push({
            price: order.price,
            quantity: fillQty,
            priority: i + 1,
          });
        }

        weightedAvgPrice = totalRevenue / (qty - remainingQty);
      }

      if (sellStock(stock.symbol, qty, customPriceToUse)) {
        const priceUsed = useCustomPrice ? pricePerShare : stock.bestBid;

        // Check if this is a limit order (price above market)
        if (isPendingOrder && useCustomPrice && priceUsed > (stock.bestBid || 0)) {
          setSuccess(`📋 Limit Order placed! We've added your request to sell ${qty} ${qty === 1 ? 'share' : 'shares'} of ${stock.symbol} at $${priceUsed.toFixed(2)}. We'll execute when the market price rises to your level. Check Portfolio > Pending Orders.`);
        } else {
          if (!useCustomPrice && fills.length > 0) {
            setExecutionSummary({ fills, weightedAvgPrice });
          } else {
            setSuccess(`🎉 Successfully sold ${qty} ${qty === 1 ? 'share' : 'shares'} of ${stock.symbol} at $${priceUsed.toFixed(2)}!`);
          }
        }

        setSymbol('');
        setQuantity('');
        setCustomPrice('');
        setUseCustomPrice(false);
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
      setIsSelling(false);
    }
  };

  const handleSelectStock = (stockSymbol: string) => {
    setSymbol(stockSymbol);
    setSearchTerm('');
    setError('');
    setSuccess('');
  };

  const handleQuickQuantity = (amount: string) => {
    setQuantity(amount);
  };

  const handleSellAll = () => {
    if (ownedShares > 0) {
      setQuantity(Math.min(ownedShares, 10000).toString());
    }
  };

  const handleSetMarketPrice = () => {
    if (stock && stock.bestBid) {
      setCustomPrice(stock.bestBid.toFixed(2));
    }
  };

  const totalPortfolioValue = portfolioStocks.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#ff1744] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d81434] flex items-center justify-center shadow-lg shadow-[#ff1744]/50">
                <BadgeDollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff1744] via-[#ff5252] to-[#ff1744] bg-clip-text text-transparent animate-gradient">
                  Sell Stocks
                </h1>
                <p className="text-sm text-[#888888] mt-0.5">
                  Sell at Market or Custom Price
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sell Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Value Card with Glow Effect */}
            <div className="relative bg-gradient-to-br from-[#ff1744]/20 via-[#d81434]/10 to-[#0d0d0d] border border-[#ff1744]/50 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#888888] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Wallet className="w-3 h-3" />
                      Total Portfolio Value
                    </p>
                    <p className="text-4xl font-mono font-bold text-[#ff1744] mb-1">
                      ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[#888888]">{portfolioStocks.length} positions</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#ff1744]/30 rounded-full blur-xl"></div>
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d81434] flex items-center justify-center">
                      <Wallet className="w-10 h-10 text-white animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sell Form with Enhanced Design */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl">
              <form onSubmit={handleSell} className="space-y-6">
                {/* Stock Symbol */}
                <div className="space-y-3">
                  <Label htmlFor="symbol" className="text-white text-sm font-semibold uppercase tracking-wide">
                    Select Stock to Sell
                  </Label>
                  <div className="relative">
                    <Input
                      id="symbol"
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="Enter ticker symbol (e.g., AAPL, TSLA, NVDA)"
                      className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#ff1744] text-white font-mono pr-10 h-14 text-lg rounded-xl transition-all"
                      required
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                  </div>
                  
                  {/* Stock Found */}
                  {stock && (
                    <div className="relative overflow-hidden flex items-center gap-3 p-4 bg-gradient-to-r from-[#ff1744]/20 to-[#ff1744]/5 border-2 border-[#ff1744]/40 rounded-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff1744]/10 to-transparent opacity-50"></div>
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d81434] flex items-center justify-center font-mono font-bold text-white text-lg shadow-lg">
                        {stock.symbol.substring(0, 2)}
                      </div>
                      <div className="flex-1 relative">
                        <p className="text-white font-semibold text-lg">{stock.name}</p>
                        <p className="text-sm text-[#888888] font-mono">
                          {stock.symbol} • You own: <span className="text-[#ff1744] font-bold">{ownedShares}</span> shares
                        </p>
                      </div>
                      <div className="text-right relative">
                        <p className="text-xl font-mono text-white font-bold">${(stock?.bestBid || 0).toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          {(stock?.changePercent || 0) >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-[#00c853]" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-[#ff1744]" />
                          )}
                          <p className={`text-xs font-mono font-semibold ${(stock?.changePercent || 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                            {(stock?.changePercent || 0) >= 0 ? '+' : ''}{(stock?.changePercent || 0).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Stock Not Found */}
                  {symbol && !stock && (
                    <div className="flex items-center gap-3 p-4 bg-[#ff1744]/10 border-2 border-[#ff1744]/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-[#ff1744]/20 flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#ff1744]" />
                      </div>
                      <p className="text-[#ff1744] text-sm font-medium">Stock symbol "{symbol}" not found. Please check and try again.</p>
                    </div>
                  )}
                  
                  {/* No Shares Warning */}
                  {stock && ownedShares === 0 && (
                    <div className="flex items-center gap-3 p-4 bg-[#ff1744]/10 border-2 border-[#ff1744]/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-[#ff1744]/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-[#ff1744]" />
                      </div>
                      <p className="text-[#ff1744] text-sm font-medium">You don't own any shares of {stock.symbol}.</p>
                    </div>
                  )}
                </div>

                {/* Price Selection Toggle */}
                {stock && ownedShares > 0 && (
                  <div className="space-y-3">
                    <Label className="text-white text-sm font-semibold uppercase tracking-wide">
                      Order Type
                    </Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setUseCustomPrice(false)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          !useCustomPrice
                            ? 'bg-[#ff1744]/20 border-[#ff1744] text-white'
                            : 'bg-[#0d0d0d] border-[#2a2a2a] text-[#888888] hover:border-[#3a3a3a]'
                        }`}
                      >
                        <p className="font-semibold mb-1">Market Order</p>
                        <p className="text-xs">Sell at ${(stock?.bestBid || 0).toFixed(2)}</p>
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
                {stock && useCustomPrice && ownedShares > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customPrice" className="text-white text-sm font-semibold uppercase tracking-wide">
                        Price Per Share
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
                      placeholder="Enter price per share"
                      className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#2979ff] text-white font-mono h-14 text-lg rounded-xl transition-all"
                      required
                    />
                    <p className="text-xs text-[#888888]">
                      Market price: ${stock?.bestBid?.toFixed(2) || '0.00'} • Your price: ${parseFloat(customPrice || '0').toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quantity" className="text-white text-sm font-semibold uppercase tracking-wide">
                      Quantity
                    </Label>
                    {ownedShares > 0 && (
                      <button
                        type="button"
                        onClick={handleSellAll}
                        className="text-xs text-[#2979ff] hover:text-[#1e5dd8] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        Sell All ({Math.min(ownedShares, 10000).toLocaleString()})
                      </button>
                    )}
                  </div>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={Math.min(ownedShares, 10000)}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={`Enter shares to sell (Max ${Math.min(ownedShares, 10000).toLocaleString()})`}
                    className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#ff1744] text-white font-mono h-14 text-lg rounded-xl transition-all"
                    disabled={ownedShares === 0}
                    required
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['10', '50', '100', '500', '1000'].map((amt) => {
                      const numAmt = parseInt(amt);
                      if (numAmt <= ownedShares) {
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleQuickQuantity(amt)}
                            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#ff1744] hover:border-[#ff1744] border border-[#2a2a2a] rounded-lg text-sm font-mono font-semibold transition-all transform hover:scale-105"
                          >
                            {amt}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                {stock && quantity && ownedShares > 0 && qty > 0 && (
                  <div className="bg-[#0d0d0d] border-2 border-[#2a2a2a] rounded-xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Order Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                        <span className="text-[#888888] text-sm">Stock</span>
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
                        <span className="text-white font-bold">Total Proceeds</span>
                        <span className="font-mono text-2xl text-[#ff1744] font-bold">
                          ${estimatedProceeds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[#888888] text-sm">New Balance</span>
                        <span className="font-mono text-[#00c853] font-semibold">
                          ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[#888888] text-sm">Remaining Shares</span>
                        <span className="font-mono text-white font-semibold">
                          {ownedShares - qty} shares
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
                    type="sell"
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
                {priceSuggestion && (
                  <div className="p-4 bg-[#ff1744]/10 border-2 border-[#ff1744] rounded-xl animate-shake">
                    <p className="text-[#ff1744] text-sm font-semibold">{priceSuggestion}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff1744] via-[#ff5252] to-[#ff1744] hover:from-[#d81434] hover:via-[#ff1744] hover:to-[#d81434] text-white h-16 text-lg font-bold shadow-lg shadow-[#ff1744]/50 hover:shadow-[#ff1744]/80 transition-all rounded-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={!stock || !quantity || qty <= 0 || ownedShares === 0 || isSelling || (useCustomPrice && (!customPrice || parseFloat(customPrice) <= 0))}
                >
                  {isSelling ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BadgeDollarSign className="w-5 h-5" />
                      Confirm Sale
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Market Info */}
          <div className="space-y-6">
            {/* Your Portfolio */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-[#2979ff]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Your Holdings</h3>
              </div>
              {portfolioStocks.length > 0 ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {portfolioStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock.symbol)}
                      className="w-full flex items-center justify-between p-3 bg-[#0d0d0d] hover:bg-gradient-to-r hover:from-[#2979ff]/10 hover:to-transparent border border-transparent hover:border-[#2979ff]/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2979ff] to-[#1e5dd8] flex items-center justify-center text-xs font-mono font-bold text-white shadow-lg">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-mono font-semibold text-white">{stock.symbol}</p>
                          <p className="text-xs text-[#888888]">{stock.quantity} shares</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-white">${(stock?.value || 0).toFixed(2)}</p>
                          <p className={`text-xs font-mono font-bold ${(stock?.changePercent || 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                            {(stock?.changePercent || 0) >= 0 ? '+' : ''}{(stock?.changePercent || 0).toFixed(2)}%
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-[#2979ff] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-8 h-8 text-[#888888]" />
                  </div>
                  <p className="text-[#888888] text-sm">No holdings to display</p>
                  <p className="text-[#666] text-xs mt-1">Buy some stocks to get started!</p>
                </div>
              )}
            </div>

            {/* Top Losers */}
            {topLosers.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-[#ff1744]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Top Losers</h3>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {topLosers.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock.symbol)}
                      className="w-full flex items-center justify-between p-3 bg-[#0d0d0d] hover:bg-gradient-to-r hover:from-[#ff1744]/10 hover:to-transparent border border-transparent hover:border-[#ff1744]/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff1744] to-[#d81434] flex items-center justify-center text-xs font-mono font-bold text-white shadow-lg">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-mono font-semibold text-white">{stock.symbol}</p>
                          <p className="text-xs text-[#888888] truncate max-w-[100px]">{stock.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-white">${(stock?.bestBid || 0).toFixed(2)}</p>
                          <p className="text-xs font-mono font-bold text-[#ff1744]">{(stock?.changePercent || 0).toFixed(2)}%</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-[#ff1744] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Stocks */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Browse Stocks</h3>
              <div className="relative mb-4">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by symbol or name..."
                  className="bg-[#0d0d0d] border-2 border-[#2a2a2a] focus:border-[#2979ff] text-white pr-10 rounded-xl transition-all"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock.symbol)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#0d0d0d] hover:bg-[#2a2a2a] border border-transparent hover:border-[#2979ff]/30 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#2979ff]/20 flex items-center justify-center text-xs font-mono font-bold text-[#2979ff]">
                        {stock.symbol.substring(0, 2)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-mono font-semibold text-white">{stock.symbol}</p>
                        <p className="text-xs text-[#888888] truncate max-w-[120px]">{stock.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-semibold text-white">${(stock?.bestBid || 0).toFixed(2)}</p>
                      <ChevronRight className="w-3 h-3 text-[#888888] group-hover:text-[#2979ff] transition-colors" />
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
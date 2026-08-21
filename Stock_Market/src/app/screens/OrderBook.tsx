import { useNavigate, useSearchParams } from 'react-router';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft, Bookmark, TrendingUp, TrendingDown, X, BarChart3, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useEffect, useState } from 'react';
import HeapVisualization from '../components/HeapVisualization';

// Company logo/brand mapping with real logo URLs
const companyBranding: Record<string, { logo: string; domain: string; gradient: string; brandColor: string }> = {
  'AAPL': { logo: 'https://logo.clearbit.com/apple.com', domain: 'apple.com', gradient: 'from-[#a3aaae] via-[#555555] to-[#000000]', brandColor: '#555555' },
  'MSFT': { logo: 'https://logo.clearbit.com/microsoft.com', domain: 'microsoft.com', gradient: 'from-[#00a4ef] via-[#7fba00] to-[#ffb900]', brandColor: '#00a4ef' },
  'GOOGL': { logo: 'https://logo.clearbit.com/google.com', domain: 'google.com', gradient: 'from-[#4285F4] via-[#EA4335] to-[#FBBC05]', brandColor: '#4285F4' },
  'AMZN': { logo: 'https://logo.clearbit.com/amazon.com', domain: 'amazon.com', gradient: 'from-[#ff9900] to-[#146eb4]', brandColor: '#ff9900' },
  'TSLA': { logo: 'https://logo.clearbit.com/tesla.com', domain: 'tesla.com', gradient: 'from-[#e82127] to-[#cc0000]', brandColor: '#e82127' },
  'META': { logo: 'https://logo.clearbit.com/meta.com', domain: 'meta.com', gradient: 'from-[#0081fb] to-[#0668e1]', brandColor: '#0081fb' },
  'NVDA': { logo: 'https://logo.clearbit.com/nvidia.com', domain: 'nvidia.com', gradient: 'from-[#76b900] to-[#578a00]', brandColor: '#76b900' },
  'NFLX': { logo: 'https://logo.clearbit.com/netflix.com', domain: 'netflix.com', gradient: 'from-[#e50914] to-[#b20710]', brandColor: '#e50914' },
  'DIS': { logo: 'https://logo.clearbit.com/disney.com', domain: 'disney.com', gradient: 'from-[#0063e5] to-[#0045a0]', brandColor: '#0063e5' },
  'INTC': { logo: 'https://logo.clearbit.com/intel.com', domain: 'intel.com', gradient: 'from-[#0071c5] to-[#005999]', brandColor: '#0071c5' },
  'AMD': { logo: 'https://logo.clearbit.com/amd.com', domain: 'amd.com', gradient: 'from-[#ed1c24] to-[#000000]', brandColor: '#ed1c24' },
  'ADBE': { logo: 'https://logo.clearbit.com/adobe.com', domain: 'adobe.com', gradient: 'from-[#ff0000] to-[#c70000]', brandColor: '#ff0000' },
  'ORCL': { logo: 'https://logo.clearbit.com/oracle.com', domain: 'oracle.com', gradient: 'from-[#f80000] to-[#c20000]', brandColor: '#f80000' },
  'PYPL': { logo: 'https://logo.clearbit.com/paypal.com', domain: 'paypal.com', gradient: 'from-[#0070ba] to-[#003087]', brandColor: '#0070ba' },
  'NKE': { logo: 'https://logo.clearbit.com/nike.com', domain: 'nike.com', gradient: 'from-[#000000] to-[#ff6b00]', brandColor: '#000000' },
  'SBUX': { logo: 'https://logo.clearbit.com/starbucks.com', domain: 'starbucks.com', gradient: 'from-[#00704a] to-[#004d33]', brandColor: '#00704a' },
  'MCD': { logo: 'https://logo.clearbit.com/mcdonalds.com', domain: 'mcdonalds.com', gradient: 'from-[#ffc72c] to-[#da291c]', brandColor: '#ffc72c' },
  'KO': { logo: 'https://logo.clearbit.com/coca-cola.com', domain: 'coca-cola.com', gradient: 'from-[#f40009] to-[#c10007]', brandColor: '#f40009' },
  'BA': { logo: 'https://logo.clearbit.com/boeing.com', domain: 'boeing.com', gradient: 'from-[#0033a0] to-[#002a85]', brandColor: '#0033a0' },
  'V': { logo: 'https://logo.clearbit.com/visa.com', domain: 'visa.com', gradient: 'from-[#1a1f71] to-[#f7b600]', brandColor: '#1a1f71' },
  'JPM': { logo: 'https://logo.clearbit.com/jpmorganchase.com', domain: 'jpmorganchase.com', gradient: 'from-[#0070ad] to-[#005a8d]', brandColor: '#0070ad' },
  'WMT': { logo: 'https://logo.clearbit.com/walmart.com', domain: 'walmart.com', gradient: 'from-[#0071ce] to-[#ffc220]', brandColor: '#0071ce' },
  'BABA': { logo: 'https://logo.clearbit.com/alibaba.com', domain: 'alibaba.com', gradient: 'from-[#ff6a00] to-[#ff4500]', brandColor: '#ff6a00' },
  'CRM': { logo: 'https://logo.clearbit.com/salesforce.com', domain: 'salesforce.com', gradient: 'from-[#00a1e0] to-[#0085ca]', brandColor: '#00a1e0' },
  'CSCO': { logo: 'https://logo.clearbit.com/cisco.com', domain: 'cisco.com', gradient: 'from-[#049fd9] to-[#0370a0]', brandColor: '#049fd9' },
  'PFE': { logo: 'https://logo.clearbit.com/pfizer.com', domain: 'pfizer.com', gradient: 'from-[#0093d0] to-[#0076b3]', brandColor: '#0093d0' },
  'JNJ': { logo: 'https://logo.clearbit.com/jnj.com', domain: 'jnj.com', gradient: 'from-[#d51900] to-[#b01500]', brandColor: '#d51900' },
  'T': { logo: 'https://logo.clearbit.com/att.com', domain: 'att.com', gradient: 'from-[#00a8e0] to-[#007fba]', brandColor: '#00a8e0' },
  'VZ': { logo: 'https://logo.clearbit.com/verizon.com', domain: 'verizon.com', gradient: 'from-[#ee0000] to-[#000000]', brandColor: '#ee0000' },
  'MA': { logo: 'https://logo.clearbit.com/mastercard.com', domain: 'mastercard.com', gradient: 'from-[#eb001b] to-[#f79e1b]', brandColor: '#eb001b' },
  'HD': { logo: 'https://logo.clearbit.com/homedepot.com', domain: 'homedepot.com', gradient: 'from-[#f96302] to-[#000000]', brandColor: '#f96302' },
  'COST': { logo: 'https://logo.clearbit.com/costco.com', domain: 'costco.com', gradient: 'from-[#0063b1] to-[#e31837]', brandColor: '#0063b1' },
  'PEP': { logo: 'https://logo.clearbit.com/pepsi.com', domain: 'pepsi.com', gradient: 'from-[#004b93] to-[#e32934]', brandColor: '#004b93' },
  'UNH': { logo: 'https://logo.clearbit.com/unitedhealthgroup.com', domain: 'unitedhealthgroup.com', gradient: 'from-[#002677] to-[#0091da]', brandColor: '#002677' },
  'CVX': { logo: 'https://logo.clearbit.com/chevron.com', domain: 'chevron.com', gradient: 'from-[#005eb8] to-[#da1f26]', brandColor: '#005eb8' },
  'XOM': { logo: 'https://logo.clearbit.com/exxonmobil.com', domain: 'exxonmobil.com', gradient: 'from-[#ed0000] to-[#000000]', brandColor: '#ed0000' },
  'CMCSA': { logo: 'https://logo.clearbit.com/comcast.com', domain: 'comcast.com', gradient: 'from-[#000000] to-[#0089cf]', brandColor: '#000000' },
};

const getCompanyBranding = (symbol: string) => {
  return companyBranding[symbol] || { 
    logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`, 
    domain: `${symbol.toLowerCase()}.com`,
    gradient: 'from-[#2979ff] to-[#1e5dd8]', 
    brandColor: '#2979ff' 
  };
};

export default function OrderBook() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { stocks, getOrderBook, currentUser } = useTrading();

  const symbolParam = searchParams.get('symbol') || 'TSLA';
  const [selectedSymbol, setSelectedSymbol] = useState(symbolParam);
  const [bookmarkedStocks, setBookmarkedStocks] = useState<string[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsStock, setDetailsStock] = useState<string | null>(null);

  const stock = stocks.find(s => s.symbol === selectedSymbol);
  const orderBook = getOrderBook(selectedSymbol);

  useEffect(() => {
    if (searchParams.get('symbol')) {
      setSelectedSymbol(searchParams.get('symbol')!);
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('bookmarkedStocks');
    if (saved) {
      setBookmarkedStocks(JSON.parse(saved));
    }
  }, []);

  const toggleBookmark = (symbol: string) => {
    const newBookmarks = bookmarkedStocks.includes(symbol)
      ? bookmarkedStocks.filter(s => s !== symbol)
      : [...bookmarkedStocks, symbol];
    setBookmarkedStocks(newBookmarks);
    localStorage.setItem('bookmarkedStocks', JSON.stringify(newBookmarks));
  };

  const handleStockDoubleClick = (symbol: string) => {
    setDetailsStock(symbol);
    setShowDetailsModal(true);
  };

  if (!stock) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="sm"
              className="border-[#2a2a2a] hover:bg-[#2a2a2a]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2979ff] to-[#1e5dd8] flex items-center justify-center shadow-lg shadow-[#2979ff]/50">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] bg-clip-text text-transparent">
                    Order Book
                  </h1>
                  <p className="text-sm text-[#888888] mt-0.5">
                    Live market depth & bookmarks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookmarked Stocks - Glassmorphism Cards */}
        {bookmarkedStocks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#2979ff]" />
              Bookmarked Stocks ({bookmarkedStocks.length})
            </h2>
            <div className="grid grid-cols-5 gap-5">
              {bookmarkedStocks.map(symbol => {
                const bookmarkedStock = stocks.find(s => s.symbol === symbol);
                if (!bookmarkedStock) return null;
                const branding = getCompanyBranding(symbol);
                return (
                  <div
                    key={symbol}
                    onDoubleClick={() => handleStockDoubleClick(symbol)}
                    className="relative group cursor-pointer transform hover:scale-[1.08] transition-all duration-500"
                  >
                    {/* Outer Glow Effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-br ${branding.gradient} rounded-3xl blur-2xl opacity-50 group-hover:opacity-90 group-hover:blur-3xl transition-all duration-500`}></div>
                    
                    {/* Card */}
                    <div className="relative bg-gradient-to-br from-[#1a1a2e]/80 via-[#0d0d0d]/70 to-[#1a1a2e]/80 backdrop-blur-3xl border-2 border-white/20 rounded-3xl p-7 overflow-hidden group-hover:border-white/40 transition-all duration-500 shadow-2xl">
                      {/* Giant Background Logo with Better Visibility */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-10 group-hover:opacity-25 transition-all duration-500 pointer-events-none group-hover:scale-125 group-hover:rotate-6">
                        <img 
                          src={branding.logo} 
                          alt={symbol}
                          className="w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Secondary Background Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${branding.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`}></div>
                      
                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(symbol);
                        }}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl flex items-center justify-center transition-all duration-300 z-20 group-hover:scale-125 shadow-lg"
                      >
                        <Bookmark className="w-4 h-4 text-white fill-white drop-shadow-lg" />
                      </button>
                      
                      <div
                        onClick={() => {
                          setSelectedSymbol(symbol);
                          window.scrollTo({ top: 700, behavior: 'smooth' });
                        }}
                        className="cursor-pointer relative z-10"
                      >
                        {/* Logo Badge */}
                        <div className={`w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center p-3 shadow-2xl mb-5 group-hover:shadow-[0_25px_70px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:scale-110 border-2 border-white/30`}>
                          <img 
                            src={branding.logo} 
                            alt={symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" font-size="40" fill="white" text-anchor="middle" dy=".3em">' + symbol.substring(0,2) + '</text></svg>';
                            }}
                          />
                        </div>
                        
                        {/* Company Info */}
                        <div className="mb-4">
                          <p className="text-xl font-mono font-bold text-white mb-2 tracking-wide drop-shadow-lg">{symbol}</p>
                          <p className="text-xs text-[#bbbbbb] line-clamp-2 leading-relaxed font-medium">{bookmarkedStock.name}</p>
                        </div>
                        
                        {/* Price Section */}
                        <div className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <p className="text-3xl font-mono font-bold text-white drop-shadow-lg">${bookmarkedStock.bestBid.toFixed(2)}</p>
                          </div>
                          
                          <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl ${
                            bookmarkedStock.changePercent >= 0 
                              ? 'bg-[#00c853]/30 border border-[#00c853]/50' 
                              : 'bg-[#ff1744]/30 border border-[#ff1744]/50'
                          } shadow-lg`}>
                            {bookmarkedStock.changePercent >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-[#00c853]" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-[#ff1744]" />
                            )}
                            <span className={`text-sm font-mono font-bold ${
                              bookmarkedStock.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'
                            }`}>
                              {bookmarkedStock.changePercent >= 0 ? '+' : ''}{bookmarkedStock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Volume */}
                        <div className="flex items-center justify-between text-xs mt-4 pt-4 border-t border-white/10">
                          <span className="text-[#888888] font-medium">Volume</span>
                          <span className="text-white font-mono font-bold">{(bookmarkedStock.volume / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                      
                      {/* Shine Effect on Hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Stocks - Glassmorphism Grid */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#888888]" />
            All Companies
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stocks.map(s => {
              const isBookmarked = bookmarkedStocks.includes(s.symbol);
              return (
                <div
                  key={s.symbol}
                  onDoubleClick={() => handleStockDoubleClick(s.symbol)}
                  className="relative group cursor-pointer"
                >
                  <div className={`absolute inset-0 rounded-xl blur-xl group-hover:blur-2xl transition-all ${
                    isBookmarked 
                      ? 'bg-gradient-to-br from-[#2979ff]/30 to-[#1e5dd8]/10' 
                      : 'bg-gradient-to-br from-[#2a2a2a]/20 to-transparent'
                  }`}></div>
                  <div className={`relative bg-[#1a1a2e]/40 backdrop-blur-xl border rounded-xl p-4 transition-all ${
                    isBookmarked 
                      ? 'border-[#2979ff]/30 hover:border-[#2979ff]' 
                      : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(s.symbol);
                      }}
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isBookmarked 
                          ? 'bg-[#2979ff]/20 hover:bg-[#2979ff]' 
                          : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                      }`}
                    >
                      <Bookmark className={`w-3 h-3 ${isBookmarked ? 'text-[#2979ff] fill-[#2979ff]' : 'text-[#888888]'}`} />
                    </button>
                    <div
                      onClick={() => {
                        setSelectedSymbol(s.symbol);
                        window.scrollTo({ top: 600, behavior: 'smooth' });
                      }}
                      className="cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-white text-lg shadow-lg mb-2 ${
                        isBookmarked 
                          ? 'bg-gradient-to-br from-[#2979ff] to-[#1e5dd8]' 
                          : 'bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a]'
                      }`}>
                        {s.symbol.substring(0, 2)}
                      </div>
                      <p className="text-xs font-mono font-bold text-white mb-1">{s.symbol}</p>
                      <p className="text-[10px] text-[#888888] truncate mb-2">{s.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-mono font-bold text-white">${s.bestBid.toFixed(2)}</p>
                        <div className={`flex items-center gap-0.5 text-[10px] font-mono font-bold ${s.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                          {s.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Stock Order Book */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2979ff] to-[#1e5dd8] flex items-center justify-center font-mono font-bold text-white text-2xl shadow-lg shadow-[#2979ff]/50">
                {stock.symbol.substring(0, 2)}
              </div>
              <div>
                <h2 className="text-2xl font-mono font-bold text-white">
                  {stock.symbol}
                </h2>
                <p className="text-sm text-[#888888]">{stock.name}</p>
              </div>
            </div>
            <button
              onClick={() => toggleBookmark(stock.symbol)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                bookmarkedStocks.includes(stock.symbol) 
                  ? 'bg-[#2979ff]/20 hover:bg-[#2979ff] border border-[#2979ff]' 
                  : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#2a2a2a]'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarkedStocks.includes(stock.symbol) ? 'text-[#2979ff] fill-[#2979ff]' : 'text-[#888888]'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#ff1744]/10 border border-[#ff1744]/30 rounded-xl p-4">
              <p className="text-xs text-[#888888] mb-1">Best Ask (Sell)</p>
              <p className="text-2xl font-mono font-bold text-[#ff1744]">${stock.bestAsk.toFixed(2)}</p>
            </div>
            <div className="bg-[#00c853]/10 border border-[#00c853]/30 rounded-xl p-4">
              <p className="text-xs text-[#888888] mb-1">Best Bid (Buy)</p>
              <p className="text-2xl font-mono font-bold text-[#00c853]">${stock.bestBid.toFixed(2)}</p>
            </div>
          </div>

          {/* Heap Tree Visualizations */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Min-Heap Visualization */}
            <div className="bg-[#0d0d0d] border-2 border-[#ff1744] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#ff1744] uppercase tracking-wide flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Min-Heap Tree Structure
                </h3>
                <span className="text-sm text-[#888888] font-mono">{orderBook.sellOrders.length} orders</span>
              </div>
              <HeapVisualization 
                orders={orderBook.sellOrders} 
                type="min" 
                currentUserId={currentUser?.username}
              />
            </div>

            {/* Max-Heap Visualization */}
            <div className="bg-[#0d0d0d] border-2 border-[#00c853] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#00c853] uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Max-Heap Tree Structure
                </h3>
                <span className="text-sm text-[#888888] font-mono">{orderBook.buyOrders.length} orders</span>
              </div>
              <HeapVisualization 
                orders={orderBook.buyOrders} 
                type="max" 
                currentUserId={currentUser?.username}
              />
            </div>
          </div>

          {/* Order Book Split Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* SELL Orders (Min-Heap) */}
            <div className="bg-[#0d0d0d] border border-[#ff1744] rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#ff1744] to-[#d81434] p-4">
                <h3 className="font-mono font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  SELL Orders — Min-Heap
                </h3>
                <p className="text-sm text-white/80 mt-1">Cheapest Ask on Top ⬆️</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                    <TableHead className="text-[#888888]">Priority</TableHead>
                    <TableHead className="text-[#888888]">Price $</TableHead>
                    <TableHead className="text-[#888888]">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook.sellOrders.map((order, index) => {
                    const isUserOrder = order.userId !== undefined;
                    const isCurrentUserOrder = order.userId === currentUser?.username;
                    const isCompleted = order.completed;
                    return (
                      <TableRow
                        key={order.id}
                        className={`border-[#2a2a2a] hover:bg-[#1a1a2e] ${
                          isCompleted 
                            ? 'bg-[#ff9800]/20' 
                            : isCurrentUserOrder 
                              ? 'bg-[#ff9800]/10' 
                              : isUserOrder 
                                ? 'bg-[#2979ff]/5' 
                                : ''
                        }`}
                      >
                        <TableCell className="text-[#888888] font-mono">
                          #{index + 1}
                        </TableCell>
                        <TableCell className={`font-mono font-bold ${isCompleted ? 'text-white line-through' : 'text-[#ff1744]'}`}>
                          ${order.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-white">
                          {isCompleted ? (
                            <span className="text-[#ff9800] font-bold uppercase text-xs">COMPLETED</span>
                          ) : (
                            order.quantity
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* BUY Orders (Max-Heap) */}
            <div className="bg-[#0d0d0d] border border-[#00c853] rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#00c853] to-[#00a844] p-4">
                <h3 className="font-mono font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  BUY Orders — Max-Heap
                </h3>
                <p className="text-sm text-white/80 mt-1">Highest Bid on Top ⬆️</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                    <TableHead className="text-[#888888]">Priority</TableHead>
                    <TableHead className="text-[#888888]">Price $</TableHead>
                    <TableHead className="text-[#888888]">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook.buyOrders.map((order, index) => {
                    const isUserOrder = order.userId !== undefined;
                    const isCurrentUserOrder = order.userId === currentUser?.username;
                    const isCompleted = order.completed;
                    return (
                      <TableRow
                        key={order.id}
                        className={`border-[#2a2a2a] hover:bg-[#1a1a2e] ${
                          isCompleted 
                            ? 'bg-[#ff9800]/20' 
                            : isCurrentUserOrder 
                              ? 'bg-[#ff9800]/10' 
                              : isUserOrder 
                                ? 'bg-[#2979ff]/5' 
                                : ''
                        }`}
                      >
                        <TableCell className="text-[#888888] font-mono">
                          #{index + 1}
                        </TableCell>
                        <TableCell className={`font-mono font-bold ${isCompleted ? 'text-white line-through' : 'text-[#00c853]'}`}>
                          ${order.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-white">
                          {isCompleted ? (
                            <span className="text-[#ff9800] font-bold uppercase text-xs">COMPLETED</span>
                          ) : (
                            order.quantity
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details Modal */}
      {showDetailsModal && detailsStock && (() => {
        const modalStock = stocks.find(s => s.symbol === detailsStock);
        const modalOrderBook = getOrderBook(detailsStock);
        if (!modalStock) return null;
        
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2979ff] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] p-6 flex items-center justify-between border-b border-[#2979ff]/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center font-mono font-bold text-white text-2xl shadow-lg">
                    {modalStock.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{modalStock.symbol}</h2>
                    <p className="text-sm text-white/80">{modalStock.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Price Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                    <p className="text-xs text-[#888888] mb-1">Current Price</p>
                    <p className="text-xl font-mono font-bold text-white">${modalStock.bestBid.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#0d0d0d] border border-[#ff1744]/30 rounded-xl p-4">
                    <p className="text-xs text-[#888888] mb-1">Best Ask</p>
                    <p className="text-xl font-mono font-bold text-[#ff1744]">${modalStock.bestAsk.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#0d0d0d] border border-[#00c853]/30 rounded-xl p-4">
                    <p className="text-xs text-[#888888] mb-1">Best Bid</p>
                    <p className="text-xl font-mono font-bold text-[#00c853]">${modalStock.bestBid.toFixed(2)}</p>
                  </div>
                </div>

                {/* Heap Visualization */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Min Heap */}
                  <div className="bg-[#0d0d0d] border border-[#ff1744] rounded-xl p-5">
                    <h3 className="text-sm font-bold text-[#ff1744] uppercase tracking-wide mb-4 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Sell Orders (Min-Heap)
                    </h3>
                    <div className="space-y-2">
                      {modalOrderBook.sellOrders.map((order, index) => {
                        const isUserOrder = order.userId !== undefined;
                        const isCurrentUserOrder = order.userId === currentUser?.username;
                        return (
                          <div key={order.id} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                              index === 0 ? 'bg-[#ff1744] text-white' : 'bg-[#ff1744]/20 text-[#ff1744]'
                            }`}>
                              {index + 1}
                            </div>
                            <div className={`flex-1 border rounded-lg p-2 ${
                              isCurrentUserOrder ? 'bg-[#ff9800]/20 border-[#ff9800]' : 'bg-[#1a1a2e] border-[#2a2a2a]'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-[#ff1744]">${order.price.toFixed(2)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-[#888888]">{order.quantity} shares</span>
                                  {isCurrentUserOrder && <span className="text-xs text-[#ff9800] font-bold">YOU</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Max Heap */}
                  <div className="bg-[#0d0d0d] border border-[#00c853] rounded-xl p-5">
                    <h3 className="text-sm font-bold text-[#00c853] uppercase tracking-wide mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Buy Orders (Max-Heap)
                    </h3>
                    <div className="space-y-2">
                      {modalOrderBook.buyOrders.map((order, index) => {
                        const isUserOrder = order.userId !== undefined;
                        const isCurrentUserOrder = order.userId === currentUser?.username;
                        return (
                          <div key={order.id} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                              index === 0 ? 'bg-[#00c853] text-white' : 'bg-[#00c853]/20 text-[#00c853]'
                            }`}>
                              {index + 1}
                            </div>
                            <div className={`flex-1 border rounded-lg p-2 ${
                              isCurrentUserOrder ? 'bg-[#ff9800]/20 border-[#ff9800]' : 'bg-[#1a1a2e] border-[#2a2a2a]'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-[#00c853]">${order.price.toFixed(2)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-[#888888]">{order.quantity} shares</span>
                                  {isCurrentUserOrder && <span className="text-xs text-[#ff9800] font-bold">YOU</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Market Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#888888] mb-1">Change</p>
                      <p className={`text-sm font-mono font-bold ${modalStock.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                        {modalStock.changePercent >= 0 ? '+' : ''}{modalStock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888888] mb-1">Volume</p>
                      <p className="text-sm font-mono font-bold text-white">{(modalStock.volume / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888888] mb-1">Spread</p>
                      <p className="text-sm font-mono font-bold text-white">${(modalStock.bestAsk - modalStock.bestBid).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888888] mb-1">Spread %</p>
                      <p className="text-sm font-mono font-bold text-white">
                        {(((modalStock.bestAsk - modalStock.bestBid) / modalStock.bestBid) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
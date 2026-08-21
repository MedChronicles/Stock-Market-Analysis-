import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Filter, X, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import HeapVisualization from '../components/HeapVisualization';

export default function BrowseCompanies() {
  const navigate = useNavigate();
  const { stocks, getOrderBook, currentUser } = useTrading();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'ask' | 'bid' | 'change'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    let filtered = [...stocks];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(term) ||
          stock.name.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'ask':
          comparison = a.bestAsk - b.bestAsk;
          break;
        case 'bid':
          comparison = a.bestBid - b.bestBid;
          break;
        case 'change':
          comparison = a.changePercent - b.changePercent;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [stocks, searchTerm, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleRowClick = (symbol: string) => {
    setSelectedCompany(symbol);
  };

  const selectedStock = selectedCompany ? stocks.find(s => s.symbol === selectedCompany) : null;
  const selectedOrderBook = selectedCompany ? getOrderBook(selectedCompany) : null;

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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] bg-clip-text text-transparent">
                Browse All Companies
              </h1>
              <p className="text-sm text-[#888888] mt-1">
                Live prices from {stocks.length} companies
              </p>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by symbol or company name..."
              className="bg-[#1a1a2e] border-[#2a2a2a] text-white pr-10 h-12"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
          </div>

          {/* Stats Cards */}
          <div className="bg-gradient-to-br from-[#00c853]/10 to-[#00a844]/10 border border-[#00c853]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#00c853]" />
              <span className="text-xs text-[#888888]">Top Gainer</span>
            </div>
            <p className="text-sm font-mono text-[#00c853] font-bold">
              +{Math.max(...stocks.map(s => s.changePercent)).toFixed(2)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#ff1744]/10 to-[#d81434]/10 border border-[#ff1744]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#ff1744]" />
              <span className="text-xs text-[#888888]">Top Loser</span>
            </div>
            <p className="text-sm font-mono text-[#ff1744] font-bold">
              {Math.min(...stocks.map(s => s.changePercent)).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-[#1a1a2e] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                  <TableHead className="text-[#888888] font-semibold">#</TableHead>
                  <TableHead 
                    className="text-[#888888] font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center gap-1">
                      Symbol
                      {sortBy === 'symbol' && (
                        <span className="text-[#2979ff]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-[#888888] font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Company Name
                      {sortBy === 'name' && (
                        <span className="text-[#2979ff]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-[#888888] font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('ask')}
                  >
                    <div className="flex items-center gap-1">
                      Best Ask (Min-Heap)
                      {sortBy === 'ask' && (
                        <span className="text-[#2979ff]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-[#888888] font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('bid')}
                  >
                    <div className="flex items-center gap-1">
                      Best Bid (Max-Heap)
                      {sortBy === 'bid' && (
                        <span className="text-[#2979ff]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-[#888888] font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('change')}
                  >
                    <div className="flex items-center gap-1">
                      Change %
                      {sortBy === 'change' && (
                        <span className="text-[#2979ff]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-[#888888] font-semibold">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock, index) => (
                    <TableRow
                      key={stock.symbol}
                      className="border-[#2a2a2a] hover:bg-[#0d0d0d] cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(stock.symbol)}
                    >
                      <TableCell className="text-[#888888] font-mono text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2979ff]/20 flex items-center justify-center text-xs font-mono font-bold text-[#2979ff]">
                            {stock.symbol.substring(0, 2)}
                          </div>
                          <span className="text-[#2979ff] font-mono font-semibold group-hover:text-[#1e5dd8]">
                            {stock.symbol}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{stock.name}</TableCell>
                      <TableCell>
                        <span className="text-[#ff1744] font-mono font-semibold">
                          ${stock.bestAsk.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[#00c853] font-mono font-semibold">
                          ${stock.bestBid.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-[#00c853]" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-[#ff1744]" />
                          )}
                          <span
                            className={`font-mono font-semibold ${
                              stock.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'
                            }`}
                          >
                            {stock.changePercent >= 0 ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#888888] font-mono text-sm">
                        {(stock.volume / 1000).toFixed(1)}K
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[#888888]">
                      No companies found matching "{searchTerm}"
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#ff1744]"></div>
              <h3 className="text-sm font-semibold text-white">Best Ask (Sell Price)</h3>
            </div>
            <p className="text-xs text-[#888888]">
              The lowest price at which sellers are willing to sell (Min-Heap top)
            </p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#00c853]"></div>
              <h3 className="text-sm font-semibold text-white">Best Bid (Buy Price)</h3>
            </div>
            <p className="text-xs text-[#888888]">
              The highest price at which buyers are willing to buy (Max-Heap top)
            </p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-[#2979ff]" />
              <h3 className="text-sm font-semibold text-white">Showing {filteredStocks.length} of {stocks.length}</h3>
            </div>
            <p className="text-xs text-[#888888]">
              Click on any company to view detailed order book
            </p>
          </div>
        </div>

        {/* Company Details Modal (Popup) */}
        {selectedCompany && selectedStock && selectedOrderBook && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setSelectedCompany(null)}>
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border-2 border-[#2979ff] rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] p-6 flex items-center justify-between border-b border-[#2979ff]/50 rounded-t-3xl z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center font-mono font-bold text-white text-2xl shadow-lg">
                    {selectedCompany.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-mono font-bold text-white">{selectedCompany}</h2>
                    <p className="text-sm text-white/90">{selectedStock.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                {/* Price Info Cards */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-6">
                    <p className="text-xs text-[#888888] mb-2 uppercase tracking-wide">Current Price</p>
                    <p className="text-3xl font-mono font-bold text-white">${selectedStock.bestBid.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {selectedStock.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-[#00c853]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#ff1744]" />
                      )}
                      <span className={`text-sm font-mono font-bold ${selectedStock.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                        {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#ff1744]/10 border border-[#ff1744]/30 rounded-2xl p-6">
                    <p className="text-xs text-[#888888] mb-2 uppercase tracking-wide">Best Ask (Sell)</p>
                    <p className="text-3xl font-mono font-bold text-[#ff1744]">${selectedStock.bestAsk.toFixed(2)}</p>
                    <p className="text-xs text-[#888888] mt-3">Min-Heap Root</p>
                  </div>

                  <div className="bg-[#00c853]/10 border border-[#00c853]/30 rounded-2xl p-6">
                    <p className="text-xs text-[#888888] mb-2 uppercase tracking-wide">Best Bid (Buy)</p>
                    <p className="text-3xl font-mono font-bold text-[#00c853]">${selectedStock.bestBid.toFixed(2)}</p>
                    <p className="text-xs text-[#888888] mt-3">Max-Heap Root</p>
                  </div>
                </div>

                {/* Heap Visualizations */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Min-Heap (Sell Orders) */}
                  <div className="bg-[#0d0d0d] border-2 border-[#ff1744] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-[#ff1744] uppercase tracking-wide flex items-center gap-2">
                        <TrendingDown className="w-5 h-5" />
                        Sell Orders - Min-Heap
                      </h3>
                      <span className="text-sm text-[#888888] font-mono">{selectedOrderBook.sellOrders.length} orders</span>
                    </div>
                    <HeapVisualization 
                      orders={selectedOrderBook.sellOrders} 
                      type="min" 
                      currentUserId={currentUser?.username}
                    />
                  </div>

                  {/* Max-Heap (Buy Orders) */}
                  <div className="bg-[#0d0d0d] border-2 border-[#00c853] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-[#00c853] uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Buy Orders - Max-Heap
                      </h3>
                      <span className="text-sm text-[#888888] font-mono">{selectedOrderBook.buyOrders.length} orders</span>
                    </div>
                    <HeapVisualization 
                      orders={selectedOrderBook.buyOrders} 
                      type="max" 
                      currentUserId={currentUser?.username}
                    />
                  </div>
                </div>

                {/* Order Book Tables */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-[#0d0d0d] border border-[#ff1744]/30 rounded-2xl overflow-hidden">
                    <div className="bg-[#ff1744]/20 p-4 border-b border-[#ff1744]/30">
                      <h4 className="text-sm font-bold text-[#ff1744] uppercase tracking-wide">All Sell Orders</h4>
                    </div>
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                      <div className="space-y-2">
                        {selectedOrderBook.sellOrders.map((order, index) => (
                          <div key={order.id} className={`flex justify-between items-center p-3 rounded-lg ${order.userId === currentUser?.username ? 'bg-[#ff9800]/20 border border-[#ff9800]' : 'bg-[#1a1a2e] border border-[#2a2a2a]'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#888888] font-mono">#{index + 1}</span>
                              <span className="text-sm font-mono font-bold text-[#ff1744]">${order.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#888888] font-mono">{order.quantity} shares</span>
                              {order.userId === currentUser?.username && (
                                <span className="text-xs text-[#ff9800] font-bold">YOU</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0d0d0d] border border-[#00c853]/30 rounded-2xl overflow-hidden">
                    <div className="bg-[#00c853]/20 p-4 border-b border-[#00c853]/30">
                      <h4 className="text-sm font-bold text-[#00c853] uppercase tracking-wide">All Buy Orders</h4>
                    </div>
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                      <div className="space-y-2">
                        {selectedOrderBook.buyOrders.map((order, index) => (
                          <div key={order.id} className={`flex justify-between items-center p-3 rounded-lg ${order.userId === currentUser?.username ? 'bg-[#ff9800]/20 border border-[#ff9800]' : 'bg-[#1a1a2e] border border-[#2a2a2a]'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#888888] font-mono">#{index + 1}</span>
                              <span className="text-sm font-mono font-bold text-[#00c853]">${order.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#888888] font-mono">{order.quantity} shares</span>
                              {order.userId === currentUser?.username && (
                                <span className="text-xs text-[#ff9800] font-bold">YOU</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4">
                  <Button
                    onClick={() => {
                      navigate(`/buy?symbol=${selectedCompany}`);
                    }}
                    className="bg-[#00c853] hover:bg-[#00a844] text-white px-6 py-3 rounded-xl font-bold"
                  >
                    Buy {selectedCompany}
                  </Button>
                  <Button
                    onClick={() => {
                      navigate(`/sell?symbol=${selectedCompany}`);
                    }}
                    className="bg-[#ff1744] hover:bg-[#d81434] text-white px-6 py-3 rounded-xl font-bold"
                  >
                    Sell {selectedCompany}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
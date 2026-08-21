import { useNavigate } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { LogOut, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout, stocks, addFunds } = useTrading();
  const [timeRange, setTimeRange] = useState('1 Day');

  // Calculate realistic portfolio performance based on actual trades
  const portfolioData = useMemo(() => {
    if (!currentUser) return [];

    // Get all completed trades sorted by timestamp
    const completedTrades = currentUser.trades
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (completedTrades.length === 0) {
      // If no trades, show starting balance
      return [
        { id: 'port-start', time: 'Start', value: currentUser.balance }
      ];
    }

    // Build portfolio value over time based on actual trades
    const dataPoints: Array<{ id: string; time: string; value: number }> = [];
    let runningBalance = 500000; // Starting balance for new users
    const holdings: Map<string, { quantity: number; avgPrice: number }> = new Map();

    // Add starting point
    dataPoints.push({
      id: 'port-start',
      time: 'Start',
      value: runningBalance
    });

    // Process each trade
    completedTrades.forEach((trade, index) => {
      if (trade.type === 'BUY') {
        runningBalance -= trade.price * trade.quantity;
        
        // Update holdings
        const existing = holdings.get(trade.symbol);
        if (existing) {
          const totalQty = existing.quantity + trade.quantity;
          const newAvgPrice = ((existing.avgPrice * existing.quantity) + (trade.price * trade.quantity)) / totalQty;
          holdings.set(trade.symbol, { quantity: totalQty, avgPrice: newAvgPrice });
        } else {
          holdings.set(trade.symbol, { quantity: trade.quantity, avgPrice: trade.price });
        }
      } else if (trade.type === 'SELL') {
        runningBalance += trade.price * trade.quantity;
        
        // Update holdings
        const existing = holdings.get(trade.symbol);
        if (existing) {
          const newQty = existing.quantity - trade.quantity;
          if (newQty <= 0) {
            holdings.delete(trade.symbol);
          } else {
            holdings.set(trade.symbol, { ...existing, quantity: newQty });
          }
        }
      }

      // Calculate current portfolio value (cash + holdings at current market price)
      let holdingsValue = 0;
      holdings.forEach((holding, symbol) => {
        const stock = stocks.find(s => s.symbol === symbol);
        if (stock) {
          holdingsValue += holding.quantity * stock.bestBid;
        }
      });

      const portfolioValue = runningBalance + holdingsValue;
      const date = new Date(trade.timestamp);
      const timeLabel = `${date.getMonth() + 1}/${date.getDate()}`;

      dataPoints.push({
        id: `port-${index}`,
        time: timeLabel,
        value: portfolioValue
      });
    });

    // Add current point
    const currentPortfolioValue = currentUser.balance + 
      currentUser.portfolio.reduce((sum, item) => {
        const stock = stocks.find(s => s.symbol === item.symbol);
        return sum + (stock ? item.quantity * stock.bestBid : 0);
      }, 0);

    dataPoints.push({
      id: 'port-current',
      time: 'Now',
      value: currentPortfolioValue
    });

    // Keep only last 8 data points for clean visualization
    return dataPoints.slice(-8);
  }, [currentUser, stocks]);

  // Mock chart data (static to prevent recharts duplicate key warnings)
  const chartData = useMemo(() => {
    const baseData = [
      95.2, 94.8, 95.5, 96.1, 95.8, 96.4, 97.0, 96.5, 97.2, 97.8,
      97.5, 98.1, 98.5, 98.2, 97.9, 98.3, 98.7, 99.2, 98.8, 99.5,
      99.1, 98.6, 98.9, 99.3, 98.7, 98.4, 98.8, 99.0, 98.5, 98.2,
      98.6, 99.1, 98.8, 99.4, 99.0, 98.5, 98.9, 99.2, 98.7, 99.3,
      99.5, 99.1, 98.8, 99.0, 99.4, 99.7, 99.3, 99.6, 99.9, 99.5
    ];
    return baseData.map((price, i) => ({
      id: `chart-${i}`,
      time: i,
      price: price,
    }));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  // Mock positions
  const positions = [
    { symbol: 'DAL', name: 'Delta Airline', qty: 1000, lastPrice: 41.32, bid: 30.55, ask: 30.51, costBasis: 27200, todayGL: 130.95, totalGL: 91300, value: 91300, chart: 'up' },
    { symbol: 'NKE', name: 'Nike Inc', qty: 1500, lastPrice: 97.54, bid: 97.50, ask: 97.53, costBasis: 144967, todayGL: 134.01, totalGL: 148310, value: 148310, chart: 'up' },
    { symbol: 'MCD', name: 'McDonald\'s', qty: 2000, lastPrice: 188.07, bid: 188.10, ask: 188.03, costBasis: 27200, todayGL: -12408, totalGL: 376140, value: 376140, chart: 'down' },
    { symbol: 'ERIC', name: 'Ericsson', qty: 500, lastPrice: 9.07, bid: 9.08, ask: 9.06, costBasis: 4500, todayGL: -537.63, totalGL: 4537, value: 4537, chart: 'down' },
    { symbol: 'ZM', name: 'Zoom', qty: 1000, lastPrice: 243.57, bid: 243.03, ask: 242.70, costBasis: 200570, todayGL: 43783, totalGL: 243537, value: 243537, chart: 'up' },
  ];

  // Indices
  const indices = [
    { symbol: 'DLX', price: 285.90, change: -66.21, changePercent: -18.80, volume: 95864488 },
    { symbol: 'NKE-IDX', price: 97.54, change: -4.31, changePercent: -4.23, volume: 0 },
    { symbol: 'RUT', price: 1488.22, change: -88.68, changePercent: -5.62, volume: 0 },
    { symbol: 'SPX', price: 5111.21, change: -161.88, changePercent: -3.07, volume: 0 },
    { symbol: 'VIX', price: 18.20, change: -0.75, changePercent: -3.96, volume: 1486477 },
  ];

  // Watchlist
  const watchlist = [
    { symbol: 'AAL', price: 11.02, change: -0.05, changePercent: -0.45, volume: 844158 },
    { symbol: 'DIS', price: 180.01, change: -2.63, changePercent: -1.44, volume: 14854488 },
    { symbol: 'FE', price: 40.28, change: -0.21, changePercent: -0.52, volume: 2388634 },
    { symbol: 'LHX', price: 197.18, change: -3.20, changePercent: -1.60, volume: 486449 },
  ];

  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
  const totalGL = positions.reduce((sum, p) => sum + p.todayGL, 0);
  const marketValue = currentUser.balance + totalValue;
  const todayGLPercent = (totalGL / totalValue) * 100;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFund = () => {
    addFunds(1000000); // Add $1,000,000
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Stock Trading Dashboard</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-[#ff1744] text-[#ff1744] hover:bg-[#ff1744] hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Left Column - Account Overview */}
          <div className="lg:col-span-3 bg-[#1a1a2e] rounded-lg p-5">
            <h2 className="text-sm text-[#888888] mb-4">Account Overview</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888888]">Full Portfolio</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Account Value</span>
                <span className="font-mono">$ {marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Market Value</span>
                <span className="font-mono text-[#2979ff]">$ {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Total Gain/Loss</span>
                <span className={`font-mono ${totalGL >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                  $ {Math.abs(totalGL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Today's Gain/Loss</span>
                <span className={`font-mono ${totalGL >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                  $ {Math.abs(totalGL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Cash Buying Power</span>
                <span className="font-mono">$ {currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Total Positions</span>
                <span className="font-mono">{positions.length}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleFund}
                className="flex-1 bg-[#2979ff] hover:bg-[#1e5dd8] px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Fund
              </button>
              <button 
                onClick={() => navigate('/buy')}
                className="flex-1 bg-[#00c853] hover:bg-[#00a844] px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Trade
              </button>
              <button className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] px-3 py-2 rounded text-sm font-medium transition-colors">
                Balance
              </button>
            </div>
          </div>

          {/* Middle Column - Portfolio Performance */}
          <div className="lg:col-span-6 bg-[#1a1a2e] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-[#888888]">Portfolio Performance</h2>
              <div className="flex gap-2 text-xs">
                {['Day', '1 Month', '3 Months', '1 Year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded ${
                      timeRange === range ? 'bg-[#2979ff]' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                    } transition-colors`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220} key="portfolio-chart">
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2979ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2979ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" key="grid-1" />
                <XAxis dataKey="time" stroke="#888888" style={{ fontSize: '10px' }} key="xaxis-1" />
                <YAxis stroke="#888888" style={{ fontSize: '10px' }} key="yaxis-1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', borderRadius: '6px' }}
                  labelStyle={{ color: '#ffffff' }}
                  isAnimationActive={false}
                />
                <Area type="monotone" dataKey="value" stroke="#2979ff" fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} key="area-1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right Column - Market View */}
          <div className="lg:col-span-3 bg-[#1a1a2e] rounded-lg p-5">
            <h2 className="text-sm text-[#888888] mb-4">Market View</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#888888] mb-2">Indices</div>
                {indices.map((index) => (
                  <div key={index.symbol} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${index.changePercent >= 0 ? 'bg-[#00c853]' : 'bg-[#ff1744]'}`}></span>
                      <span className="text-sm font-mono">{index.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">{index.price.toFixed(2)}</div>
                      <div className={`text-xs font-mono ${index.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                        {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <div className="text-xs text-[#888888] mb-2">Watchlist</div>
                {watchlist.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stock.changePercent >= 0 ? 'bg-[#00c853]' : 'bg-[#ff1744]'}`}></span>
                      <span className="text-sm font-mono">{stock.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">{stock.price.toFixed(2)}</div>
                      <div className={`text-xs font-mono ${stock.changePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Positions Table */}
          <div className="lg:col-span-2 bg-[#1a1a2e] rounded-lg p-5">
            <h2 className="text-sm text-[#888888] mb-4">Positions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#888888] text-xs border-b border-[#2a2a2a]">
                    <th className="text-left pb-3 font-normal">Symbol</th>
                    <th className="text-right pb-3 font-normal">QTY</th>
                    <th className="text-right pb-3 font-normal">Last Price</th>
                    <th className="text-right pb-3 font-normal">Bid</th>
                    <th className="text-right pb-3 font-normal">Ask</th>
                    <th className="text-right pb-3 font-normal">Cost Basis</th>
                    <th className="text-right pb-3 font-normal">Today's G/L</th>
                    <th className="text-right pb-3 font-normal">Total G/L</th>
                    <th className="text-right pb-3 font-normal">Mkt Value</th>
                    <th className="text-right pb-3 font-normal">Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.symbol} className="border-b border-[#2a2a2a]/50 hover:bg-[#2a2a2a]/30">
                      <td className="py-3">
                        <div className="font-mono text-[#2979ff]">{pos.symbol}</div>
                        <div className="text-xs text-[#888888]">{pos.name}</div>
                      </td>
                      <td className="text-right font-mono">{pos.qty.toLocaleString()}</td>
                      <td className="text-right font-mono">{pos.lastPrice.toFixed(2)}</td>
                      <td className="text-right font-mono text-[#888888]">{pos.bid.toFixed(2)}</td>
                      <td className="text-right font-mono text-[#888888]">{pos.ask.toFixed(2)}</td>
                      <td className="text-right font-mono">{pos.costBasis.toLocaleString()}</td>
                      <td className={`text-right font-mono ${pos.todayGL >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                        ${Math.abs(pos.todayGL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`text-right font-mono ${pos.totalGL >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}`}>
                        ${pos.totalGL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right font-mono">{pos.value.toLocaleString()}</td>
                      <td className="text-right">
                        {pos.chart === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-[#00c853] inline" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-[#ff1744] inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#1a1a2e] rounded-lg p-5">
            <h2 className="text-sm text-[#888888] mb-4">Chart</h2>
            <div className="space-y-3">
              <div className="flex gap-2 text-xs">
                <button className="px-2 py-1 bg-[#2979ff] rounded">Delta Airline</button>
              </div>
              <ResponsiveContainer width="100%" height={200} key="line-chart">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" key="grid-2" />
                  <XAxis dataKey="time" stroke="#888888" style={{ fontSize: '10px' }} key="xaxis-2" />
                  <YAxis stroke="#888888" style={{ fontSize: '10px' }} domain={[85, 100]} key="yaxis-2" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', borderRadius: '6px' }}
                    isAnimationActive={false}
                  />
                  <Line type="monotone" dataKey="price" stroke="#00c853" strokeWidth={2} dot={false} isAnimationActive={false} key="line-1" />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <div className="text-[#888888]">Open:</div>
                  <div>96.01</div>
                </div>
                <div>
                  <div className="text-[#888888]">High:</div>
                  <div>99.99</div>
                </div>
                <div>
                  <div className="text-[#888888]">Low:</div>
                  <div>79.99</div>
                </div>
                <div>
                  <div className="text-[#888888]">Close:</div>
                  <div>97.98</div>
                </div>
              </div>
              <div className="text-xs font-mono">
                <div className="text-[#888888]">Volume:</div>
                <div>25.41M</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => navigate('/buy')} className="px-4 py-2 bg-[#00c853] hover:bg-[#00a844] rounded font-medium transition-colors">
            Buy Stock
          </button>
          <button onClick={() => navigate('/sell')} className="px-4 py-2 bg-[#ff1744] hover:bg-[#d81434] rounded font-medium transition-colors">
            Sell Stock
          </button>
          <button onClick={() => navigate('/portfolio')} className="px-4 py-2 bg-[#2979ff] hover:bg-[#1e5dd8] rounded font-medium transition-colors">
            My Portfolio
          </button>
          <button onClick={() => navigate('/history')} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded font-medium transition-colors">
            Trade History
          </button>
          <button onClick={() => navigate('/companies')} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded font-medium transition-colors">
            Browse Companies
          </button>
          <button onClick={() => navigate('/orderbook')} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded font-medium transition-colors">
            Order Book
          </button>
          {currentUser.isAdmin && (
            <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-[#2979ff] hover:bg-[#1e5dd8] rounded font-medium transition-colors">
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
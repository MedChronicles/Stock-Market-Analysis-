import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft, Clock, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// Company logo mapping - using logo.dev which is more reliable
const getCompanyLogo = (symbol: string) => {
  const logoMap: Record<string, string> = {
    'AAPL': 'https://logo.clearbit.com/apple.com',
    'MSFT': 'https://logo.clearbit.com/microsoft.com',
    'GOOGL': 'https://logo.clearbit.com/google.com',
    'AMZN': 'https://logo.clearbit.com/amazon.com',
    'TSLA': 'https://logo.clearbit.com/tesla.com',
    'META': 'https://logo.clearbit.com/meta.com',
    'NVDA': 'https://logo.clearbit.com/nvidia.com',
    'NFLX': 'https://logo.clearbit.com/netflix.com',
    'DIS': 'https://logo.clearbit.com/disney.com',
    'INTC': 'https://logo.clearbit.com/intel.com',
    'AMD': 'https://logo.clearbit.com/amd.com',
    'ADBE': 'https://logo.clearbit.com/adobe.com',
    'ORCL': 'https://logo.clearbit.com/oracle.com',
    'PYPL': 'https://logo.clearbit.com/paypal.com',
    'NKE': 'https://logo.clearbit.com/nike.com',
    'SBUX': 'https://logo.clearbit.com/starbucks.com',
    'MCD': 'https://logo.clearbit.com/mcdonalds.com',
    'KO': 'https://logo.clearbit.com/coca-cola.com',
    'BA': 'https://logo.clearbit.com/boeing.com',
    'V': 'https://logo.clearbit.com/visa.com',
    'JPM': 'https://logo.clearbit.com/jpmorganchase.com',
    'WMT': 'https://logo.clearbit.com/walmart.com',
    'BABA': 'https://logo.clearbit.com/alibaba.com',
    'CRM': 'https://logo.clearbit.com/salesforce.com',
    'CSCO': 'https://logo.clearbit.com/cisco.com',
    'PFE': 'https://logo.clearbit.com/pfizer.com',
    'JNJ': 'https://logo.clearbit.com/jnj.com',
    'T': 'https://logo.clearbit.com/att.com',
    'VZ': 'https://logo.clearbit.com/verizon.com',
    'MA': 'https://logo.clearbit.com/mastercard.com',
    'HD': 'https://logo.clearbit.com/homedepot.com',
    'COST': 'https://logo.clearbit.com/costco.com',
    'PEP': 'https://logo.clearbit.com/pepsi.com',
    'UNH': 'https://logo.clearbit.com/unitedhealthgroup.com',
    'CVX': 'https://logo.clearbit.com/chevron.com',
    'XOM': 'https://logo.clearbit.com/exxonmobil.com',
    'CMCSA': 'https://logo.clearbit.com/comcast.com',
  };
  
  return logoMap[symbol] || `https://logo.clearbit.com/${symbol.toLowerCase()}.com`;
};

export default function Portfolio() {
  const navigate = useNavigate();
  const { currentUser, stocks } = useTrading();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  // Update current prices
  const portfolio = currentUser.portfolio.map(item => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    return {
      ...item,
      currentPrice: stock?.bestBid || item.currentPrice,
    };
  });

  const totalValue = portfolio.reduce(
    (sum, item) => sum + (item.currentPrice * item.quantity),
    0
  );

  // Get pending orders
  const pendingOrders = currentUser.pendingOrders || [];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] bg-clip-text text-transparent">
                  My Portfolio
                </h1>
                <p className="text-sm text-[#888888] mt-0.5">
                  Track your holdings & pending orders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#00c853]/20 to-[#00a844]/10 border border-[#00c853]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-[#00c853]" />
              <p className="text-xs text-[#888888] uppercase tracking-wider">Account Balance</p>
            </div>
            <p className="text-3xl font-mono font-bold text-[#00c853]">
              ${currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#2979ff]/20 to-[#1e5dd8]/10 border border-[#2979ff]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#2979ff]" />
              <p className="text-xs text-[#888888] uppercase tracking-wider">Holdings Value</p>
            </div>
            <p className="text-3xl font-mono font-bold text-[#2979ff]">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#ff9800]/20 to-[#f57c00]/10 border border-[#ff9800]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#ff9800]" />
              <p className="text-xs text-[#888888] uppercase tracking-wider">Pending Orders</p>
            </div>
            <p className="text-3xl font-mono font-bold text-[#ff9800]">
              {pendingOrders.length}
            </p>
          </div>
        </div>

        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#ff9800] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#ff9800]" />
              <h2 className="text-xl font-bold text-white">Pending Orders</h2>
              <span className="ml-auto text-xs text-[#888888] uppercase tracking-wider">Waiting for Execution</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                    <TableHead className="text-[#888888]">Symbol</TableHead>
                    <TableHead className="text-[#888888]">Company</TableHead>
                    <TableHead className="text-[#888888]">Type</TableHead>
                    <TableHead className="text-[#888888]">Price</TableHead>
                    <TableHead className="text-[#888888]">Quantity</TableHead>
                    <TableHead className="text-[#888888]">Total</TableHead>
                    <TableHead className="text-[#888888]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id} className="border-[#2a2a2a] hover:bg-[#0d0d0d] bg-[#ff9800]/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-[#ff9800]/30 flex items-center justify-center p-2">
                            <img 
                              src={getCompanyLogo(order.symbol)} 
                              alt={order.symbol}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.parentElement?.querySelector('.fallback-text');
                                if (fallback) (fallback as HTMLElement).style.display = 'block';
                              }}
                            />
                            <span className="fallback-text hidden text-xs font-mono font-bold text-[#ff9800]">
                              {order.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#ff9800]">{order.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{order.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          order.type === 'BUY' 
                            ? 'bg-[#00c853]/20 text-[#00c853]' 
                            : 'bg-[#ff1744]/20 text-[#ff1744]'
                        }`}>
                          {order.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-white">${order.price.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-white">{order.quantity}</TableCell>
                      <TableCell className="font-mono text-white font-bold">
                        ${(order.price * order.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#ff9800] animate-pulse"></div>
                          <span className="text-[#ff9800] text-xs font-bold">PENDING</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Active Holdings */}
        {portfolio.length > 0 ? (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#2979ff]" />
              <h2 className="text-xl font-bold text-white">Active Holdings</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                    <TableHead className="text-[#888888]">Symbol</TableHead>
                    <TableHead className="text-[#888888]">Company</TableHead>
                    <TableHead className="text-[#888888]">Quantity</TableHead>
                    <TableHead className="text-[#888888]">Avg Buy Price</TableHead>
                    <TableHead className="text-[#888888]">Current Price</TableHead>
                    <TableHead className="text-[#888888]">Total Value</TableHead>
                    <TableHead className="text-[#888888]">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.map((item) => {
                    const totalCost = item.avgBuyPrice * item.quantity;
                    const currentValue = item.currentPrice * item.quantity;
                    const profitLoss = currentValue - totalCost;
                    const profitLossPercent = ((profitLoss / totalCost) * 100);

                    return (
                      <TableRow key={item.symbol} className="border-[#2a2a2a] hover:bg-[#0d0d0d]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-[#2979ff]/30 flex items-center justify-center p-2">
                              <img 
                                src={getCompanyLogo(item.symbol)} 
                                alt={item.symbol}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.fallback-text');
                                  if (fallback) (fallback as HTMLElement).style.display = 'block';
                                }}
                              />
                              <span className="fallback-text hidden text-xs font-mono font-bold text-[#2979ff]">
                                {item.symbol.substring(0, 2)}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-[#2979ff]">{item.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{item.name}</TableCell>
                        <TableCell className="font-mono text-white">{item.quantity}</TableCell>
                        <TableCell className="font-mono text-white">${item.avgBuyPrice.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-white">${item.currentPrice.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-white font-bold">
                          ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {profitLoss >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-[#00c853]" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-[#ff1744]" />
                            )}
                            <div className="text-right">
                              <p className={`font-mono font-bold text-sm ${
                                profitLoss >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'
                              }`}>
                                {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                              </p>
                              <p className={`font-mono text-xs ${
                                profitLoss >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'
                              }`}>
                                ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          !pendingOrders.length && (
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#2a2a2a] rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-[#888888]" />
              </div>
              <p className="text-[#888888] text-lg mb-2">No holdings yet</p>
              <p className="text-[#666] text-sm mb-6">Start trading to build your portfolio!</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/buy')}
                  className="bg-gradient-to-r from-[#00c853] to-[#00a844] hover:from-[#00a844] hover:to-[#00c853] text-white"
                >
                  Buy Stocks
                </Button>
                <Button
                  onClick={() => navigate('/browse')}
                  className="bg-gradient-to-r from-[#2979ff] to-[#1e5dd8] hover:from-[#1e5dd8] hover:to-[#2979ff] text-white"
                >
                  Browse Companies
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
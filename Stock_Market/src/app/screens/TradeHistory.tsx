import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function TradeHistory() {
  const navigate = useNavigate();
  const { currentUser } = useTrading();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const trades = [...currentUser.trades].reverse(); // Most recent first

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="border-[#2a2a2a]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-mono text-[#2979ff]">TRADE HISTORY</h1>
        </div>

        {/* Trade History Table */}
        {trades.length > 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                  <TableHead className="text-[#888888]">Order ID</TableHead>
                  <TableHead className="text-[#888888]">Date & Time</TableHead>
                  <TableHead className="text-[#888888]">Symbol</TableHead>
                  <TableHead className="text-[#888888]">Type</TableHead>
                  <TableHead className="text-[#888888]">Exec Price $</TableHead>
                  <TableHead className="text-[#888888]">Qty</TableHead>
                  <TableHead className="text-[#888888]">Total $</TableHead>
                  <TableHead className="text-[#888888]">Status</TableHead>
                  <TableHead className="text-[#888888]">P&L $</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => {
                  const total = trade.price * trade.quantity;
                  const isPending = trade.status === 'PENDING';

                  return (
                    <TableRow
                      key={trade.id}
                      className={`border-[#2a2a2a] hover:bg-[#0d0d0d] ${
                        isPending
                          ? 'bg-[#ff9800]/5'
                          : trade.type === 'BUY'
                          ? 'bg-[#00c853]/5'
                          : 'bg-[#ff1744]/5'
                      }`}
                    >
                      <TableCell className="font-mono text-[#888888]">{trade.id}</TableCell>
                      <TableCell className="text-sm">
                        {trade.timestamp.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' '}
                        {trade.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-[#2979ff] font-mono">{trade.symbol}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            trade.type === 'BUY'
                              ? 'bg-[#00c853] text-white'
                              : 'bg-[#ff1744] text-white'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">${trade.price.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{trade.quantity}</TableCell>
                      <TableCell className="font-mono">${total.toFixed(2)}</TableCell>
                      <TableCell>
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#ff9800] animate-pulse"></div>
                            <span className="text-[#ff9800] text-xs font-bold">PENDING</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00c853]"></div>
                            <span className="text-[#00c853] text-xs font-bold">COMPLETED</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className={`font-mono ${
                          trade.profitLoss === undefined || trade.profitLoss === 0
                            ? 'text-[#888888]'
                            : trade.profitLoss > 0
                            ? 'text-[#00c853]'
                            : 'text-[#ff1744]'
                        }`}
                      >
                        {trade.profitLoss === undefined || trade.profitLoss === 0
                          ? '—'
                          : `${trade.profitLoss > 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-12 text-center">
            <p className="text-[#888888]">No trade history yet</p>
            <p className="text-sm text-[#888888] mt-2">Make your first trade to see it here</p>
            <Button
              onClick={() => navigate('/buy')}
              className="mt-6 bg-[#00c853] hover:bg-[#00a844]"
            >
              Start Trading
            </Button>
          </div>
        )}

        {/* Summary */}
        {trades.length > 0 && (
          <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
            <div className="flex justify-between items-center">
              <span className="text-[#888888]">Total Trades:</span>
              <span className="text-xl font-mono text-white">{trades.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
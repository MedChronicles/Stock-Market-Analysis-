import { CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface ExecutionFill {
  price: number;
  quantity: number;
  priority: number;
}

interface OrderExecutionSummaryProps {
  type: 'buy' | 'sell';
  symbol: string;
  totalQuantity: number;
  fills: ExecutionFill[];
  weightedAvgPrice: number;
}

export default function OrderExecutionSummary({
  type,
  symbol,
  totalQuantity,
  fills,
  weightedAvgPrice,
}: OrderExecutionSummaryProps) {
  const totalCost = weightedAvgPrice * totalQuantity;
  const isBuy = type === 'buy';

  return (
    <div className="bg-gradient-to-br from-[#00c853]/10 to-[#00c853]/5 border-2 border-[#00c853] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#00c853] flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">
            Order Executed Successfully!
          </p>
          <p className="text-[#888888] text-sm">
            {isBuy ? 'Bought' : 'Sold'} {totalQuantity} shares of {symbol}
          </p>
        </div>
      </div>

      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          {isBuy ? (
            <TrendingUp className="w-4 h-4 text-[#00c853]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#ff1744]" />
          )}
          <p className="text-white text-sm font-semibold uppercase tracking-wide">
            Execution Breakdown
          </p>
        </div>

        <div className="space-y-2">
          {fills.map((fill, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 bg-[#1a1a2e] rounded-lg border border-[#2a2a2a]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00c853] to-[#00a844] flex items-center justify-center text-xs font-mono font-bold text-white">
                  #{fill.priority}
                </div>
                <div>
                  <p className="text-white text-sm font-mono">
                    {fill.quantity} shares
                  </p>
                  <p className="text-[#888888] text-xs">
                    Priority Order #{fill.priority}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#00c853] text-sm font-mono font-bold">
                  ${fill.price.toFixed(2)}
                </p>
                <p className="text-[#888888] text-xs">
                  ${(fill.price * fill.quantity).toFixed(2)} total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#00c853]/20 to-[#00c853]/10 border border-[#00c853]/40 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[#888888] text-xs uppercase tracking-wide mb-1">
              Weighted Avg Price
            </p>
            <p className="text-white text-xl font-mono font-bold">
              ${weightedAvgPrice.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#888888] text-xs uppercase tracking-wide mb-1">
              Total {isBuy ? 'Cost' : 'Revenue'}
            </p>
            <p className="text-[#00c853] text-xl font-mono font-bold">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

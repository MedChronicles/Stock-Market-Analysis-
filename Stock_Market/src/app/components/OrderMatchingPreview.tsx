import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Layers } from 'lucide-react';

interface Order {
  id: string;
  price: number;
  quantity: number;
  userId?: string;
}

interface OrderMatchingPreviewProps {
  requestedQuantity: number;
  availableOrders: Order[];
  type: 'buy' | 'sell';
  stockSymbol: string;
}

interface MatchedOrder {
  order: Order;
  quantityToFill: number;
  priority: number;
}

export default function OrderMatchingPreview({
  requestedQuantity,
  availableOrders,
  type,
  stockSymbol
}: OrderMatchingPreviewProps) {
  // Calculate which orders will be filled
  const calculateMatching = (): {
    matchedOrders: MatchedOrder[];
    totalQuantity: number;
    totalCost: number;
    averagePrice: number;
    canFulfill: boolean;
  } => {
    const matched: MatchedOrder[] = [];
    let remainingQuantity = requestedQuantity;
    let totalCost = 0;
    let totalQuantity = 0;

    for (let i = 0; i < availableOrders.length && remainingQuantity > 0; i++) {
      const order = availableOrders[i];
      const quantityToFill = Math.min(remainingQuantity, order.quantity);
      
      matched.push({
        order,
        quantityToFill,
        priority: i + 1
      });

      totalCost += quantityToFill * order.price;
      totalQuantity += quantityToFill;
      remainingQuantity -= quantityToFill;
    }

    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const canFulfill = remainingQuantity === 0;

    return {
      matchedOrders: matched,
      totalQuantity,
      totalCost,
      averagePrice,
      canFulfill
    };
  };

  const matching = calculateMatching();

  if (requestedQuantity <= 0 || availableOrders.length === 0) {
    return null;
  }

  const color = type === 'buy' ? '#ff1744' : '#00c853';
  const bgColor = type === 'buy' ? 'bg-[#ff1744]' : 'bg-[#00c853]';
  const borderColor = type === 'buy' ? 'border-[#ff1744]' : 'border-[#00c853]';
  const textColor = type === 'buy' ? 'text-[#ff1744]' : 'text-[#00c853]';

  return (
    <div className={`bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border-2 ${borderColor} rounded-2xl p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
            {type === 'buy' ? (
              <TrendingDown className="w-6 h-6 text-white" />
            ) : (
              <TrendingUp className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Order Matching Preview</h3>
            <p className="text-xs text-[#888888]">
              {type === 'buy' ? 'Matching against SELL orders (Min-Heap)' : 'Matching against BUY orders (Max-Heap)'}
            </p>
          </div>
        </div>
        <Layers className={`w-6 h-6 ${textColor}`} />
      </div>

      {/* Status Banner */}
      {matching.canFulfill ? (
        <div className="bg-[#00c853]/10 border border-[#00c853]/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-[#00c853] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#00c853] mb-1">
              ✅ Order can be fully filled
            </p>
            <p className="text-xs text-[#888888]">
              Your request for {requestedQuantity} shares of {stockSymbol} will be filled from {matching.matchedOrders.length} order{matching.matchedOrders.length > 1 ? 's' : ''} at an average price of ${matching.averagePrice.toFixed(2)}/share
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#ff9800]/10 border border-[#ff9800]/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#ff9800] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#ff9800] mb-1">
              ⚠️ Partial fill only
            </p>
            <p className="text-xs text-[#888888]">
              Only {matching.totalQuantity} of {requestedQuantity} shares available in the order book. {requestedQuantity - matching.totalQuantity} shares cannot be filled.
            </p>
          </div>
        </div>
      )}

      {/* Matched Orders Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wide flex items-center gap-2">
          <span>Orders to be filled ({matching.matchedOrders.length})</span>
        </h4>
        
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {matching.matchedOrders.map((matched, index) => {
            const percentage = (matched.quantityToFill / requestedQuantity) * 100;
            
            return (
              <div
                key={matched.order.id}
                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${index === 0 ? bgColor : 'bg-[#2a2a2a]'} flex items-center justify-center`}>
                      <span className={`text-sm font-mono font-bold ${index === 0 ? 'text-white' : textColor}`}>
                        #{matched.priority}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm font-mono font-bold ${textColor}`}>
                        ${matched.order.price.toFixed(2)}/share
                      </p>
                      <p className="text-xs text-[#888888]">
                        {index === 0 ? (type === 'buy' ? 'Best Ask (Min-Heap Root)' : 'Best Bid (Max-Heap Root)') : `Priority ${matched.priority}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-white">
                      {matched.quantityToFill} shares
                    </p>
                    <p className="text-xs text-[#888888]">
                      ${(matched.quantityToFill * matched.order.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full ${bgColor} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888]">
                    {matched.quantityToFill} of {matched.order.quantity} available
                  </span>
                  <span className={textColor + ' font-bold'}>
                    {percentage.toFixed(1)}% of total
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wide">
          Transaction Summary
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#888888] mb-1">Total Shares</p>
            <p className="text-lg font-mono font-bold text-white">
              {matching.totalQuantity}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#888888] mb-1">Average Price</p>
            <p className="text-lg font-mono font-bold text-white">
              ${matching.averagePrice.toFixed(2)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-[#888888] mb-1">Total Cost</p>
            <p className="text-2xl font-mono font-bold text-white">
              ${matching.totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {!matching.canFulfill && (
        <div className="text-xs text-[#888888] text-center pt-2 border-t border-[#2a2a2a]">
          💡 Tip: Consider placing a limit order for the remaining shares or check other stocks
        </div>
      )}
    </div>
  );
}

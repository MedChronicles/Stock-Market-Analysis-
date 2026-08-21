import { TrendingUp, TrendingDown } from 'lucide-react';

interface HeapNode {
  id: string;
  price: number;
  quantity: number;
  userId?: string;
  isPending?: boolean;
  completed?: boolean; // Add completed field
}

interface HeapVisualizationProps {
  orders: HeapNode[];
  type: 'min' | 'max';
  currentUserId?: string;
}

export default function HeapVisualization({ orders, type, currentUserId }: HeapVisualizationProps) {
  const color = type === 'min' ? '#ff1744' : '#00c853';
  const bgColor = type === 'min' ? 'bg-[#ff1744]' : 'bg-[#00c853]';
  const bgColorLight = type === 'min' ? 'bg-[#ff1744]/20' : 'bg-[#00c853]/20';
  const textColor = type === 'min' ? 'text-[#ff1744]' : 'text-[#00c853]';
  const borderColor = type === 'min' ? 'border-[#ff1744]' : 'border-[#00c853]';

  // Create heap tree levels (binary heap visualization)
  const createHeapLevels = () => {
    const levels: HeapNode[][] = [];
    let currentIndex = 0;
    let levelSize = 1;

    while (currentIndex < orders.length) {
      const level = orders.slice(currentIndex, currentIndex + levelSize);
      levels.push(level);
      currentIndex += levelSize;
      levelSize *= 2;
    }

    return levels;
  };

  const heapLevels = createHeapLevels();

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-4">
        <div className={`${bgColor} text-white px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-2 text-sm`}>
          {type === 'min' ? (
            <>
              <TrendingDown className="w-4 h-4" />
              Min-Heap (Lowest First)
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Max-Heap (Highest First)
            </>
          )}
        </div>
      </div>

      {/* Heap Tree Visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-max flex flex-col items-center gap-6 p-2">
          {heapLevels.map((level, levelIndex) => {
            const nodeWidth = 60;
            const nodeGap = Math.max(30, 150 / Math.pow(2, levelIndex));
            const totalWidth = level.length * (nodeWidth + nodeGap);

            return (
              <div key={levelIndex} className="relative" style={{ width: `${totalWidth}px` }}>
                {/* Connection Lines */}
                {levelIndex > 0 && (
                  <svg className="absolute -top-6 left-0 w-full h-6" style={{ overflow: 'visible' }}>
                    {level.map((node, nodeIndex) => {
                      const parentIndex = Math.floor(nodeIndex / 2);
                      const parentX = (heapLevels[levelIndex - 1].length * (nodeWidth + nodeGap)) / (heapLevels[levelIndex - 1].length * 2) + parentIndex * (nodeWidth + nodeGap) + nodeWidth / 2;
                      const childX = (level.length * (nodeWidth + nodeGap)) / (level.length * 2) + nodeIndex * (nodeWidth + nodeGap) + nodeWidth / 2;
                      
                      return (
                        <line
                          key={`line-${levelIndex}-${nodeIndex}`}
                          x1={parentX}
                          y1={0}
                          x2={childX}
                          y2={24}
                          stroke={color}
                          strokeWidth="1.5"
                          opacity="0.4"
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Nodes */}
                <div className="flex items-center justify-center gap-3" style={{ gap: `${nodeGap}px` }}>
                  {level.map((node, nodeIndex) => {
                    const isUserOrder = node.userId === currentUserId;
                    const isCompleted = node.completed;
                    const globalIndex = Math.pow(2, levelIndex) - 1 + nodeIndex;
                    const isRoot = globalIndex === 0;

                    return (
                      <div key={node.id} className="flex flex-col items-center">
                        {/* Priority Number */}
                        <div className="text-[10px] text-[#888888] font-mono mb-0.5">
                          #{globalIndex + 1}
                        </div>

                        {/* Node */}
                        <div
                          className={`relative ${isUserOrder ? 'ring-2 ring-[#ff9800] ring-offset-1 ring-offset-[#0d0d0d]' : ''}`}
                        >
                          <div
                            className={`w-15 h-15 rounded-xl flex flex-col items-center justify-center shadow-lg transform hover:scale-110 transition-all cursor-pointer relative ${
                              isCompleted 
                                ? 'bg-[#ff9800] border-2 border-[#ff9800]' 
                                : isRoot 
                                  ? bgColor 
                                  : `${bgColorLight} ${borderColor} border-2`
                            }`}
                          >
                            <div className={`text-xs font-mono font-bold ${
                              isCompleted 
                                ? 'text-white line-through' 
                                : isRoot 
                                  ? 'text-white' 
                                  : textColor
                            }`}>
                              ${node.price.toFixed(2)}
                            </div>
                            <div className={`text-[10px] font-mono ${
                              isCompleted 
                                ? 'text-white/90' 
                                : isRoot 
                                  ? 'text-white/80' 
                                  : 'text-[#888888]'
                            }`}>
                              {isCompleted ? '0' : node.quantity}
                            </div>
                            {isRoot && !isCompleted && (
                              <div className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[9px] ${textColor} font-bold uppercase tracking-wide whitespace-nowrap`}>
                                ROOT
                              </div>
                            )}
                            {isCompleted && (
                              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[9px] text-[#ff9800] font-bold uppercase tracking-wide whitespace-nowrap">
                                DONE
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order List Summary */}
      <div className="mt-4 bg-[#0d0d0d] rounded-xl p-3 max-h-48 overflow-y-auto">
        <h4 className="text-[10px] font-bold text-[#888888] uppercase tracking-wide mb-2">
          All {orders.length} Orders
        </h4>
        <div className="space-y-1.5">
          {orders.map((order, index) => {
            const isUserOrder = order.userId === currentUserId;
            return (
              <div
                key={order.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isUserOrder ? 'bg-[#ff9800]/20 border border-[#ff9800]' : 'bg-[#1a1a2e] border border-[#2a2a2a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${index === 0 ? bgColor : bgColorLight} flex items-center justify-center`}>
                    <span className={`text-[10px] font-mono font-bold ${index === 0 ? 'text-white' : textColor}`}>
                      {index + 1}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${textColor}`}>
                    ${order.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#888888] font-mono">
                    {order.quantity} sh
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
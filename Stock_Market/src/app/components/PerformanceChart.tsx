import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { id: 'point-1', orders: 100, naive: 50, heap: 2 },
  { id: 'point-2', orders: 200, naive: 180, heap: 4 },
  { id: 'point-3', orders: 500, naive: 1100, heap: 8 },
  { id: 'point-4', orders: 1000, naive: 4500, heap: 12 },
  { id: 'point-5', orders: 2000, naive: 18000, heap: 16 },
  { id: 'point-6', orders: 5000, naive: 112000, heap: 22 },
];

export default function PerformanceChart() {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-6">
      <h3 className="text-lg font-mono text-[#2979ff] mb-2">Why Heaps Win</h3>
      <p className="text-sm text-[#888888] mb-6">
        Order Matching: Naive O(n²) vs Heap O(log n)
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="orders"
            stroke="#888888"
            label={{ value: 'Number of Orders', position: 'insideBottom', offset: -5, fill: '#888888' }}
          />
          <YAxis
            stroke="#888888"
            label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft', fill: '#888888' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              color: '#ffffff',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="naive"
            stroke="#ff1744"
            strokeWidth={2}
            name="Naive O(n²)"
            dot={{ fill: '#ff1744', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="heap"
            stroke="#2979ff"
            strokeWidth={2}
            name="Heap O(log n)"
            dot={{ fill: '#2979ff', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md">
        <p className="text-xs text-[#888888] font-mono">
          Min-Heap: Best SELL order in O(1) · Max-Heap: Best BUY order in O(1) · Insert/Delete: O(log n)
        </p>
      </div>
    </div>
  );
}
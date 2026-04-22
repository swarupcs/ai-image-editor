'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export function AnalyticsCharts({
  data,
}: {
  data: { date: string; images: number; users: number }[];
}) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#a1a1aa" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            stroke="#a1a1aa" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#f4f4f5' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="images" 
            name="Images Generated"
            stroke="#a855f7" 
            strokeWidth={2} 
            dot={{ r: 4, strokeWidth: 2 }} 
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            name="New Users"
            stroke="#10b981" 
            strokeWidth={2} 
            dot={{ r: 4, strokeWidth: 2 }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ResponseTimeChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 w-full flex flex-col items-center justify-center bg-[#0B0F19]/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
        <span className="animate-pulse mb-1">⚡ Collecting initial ping metrics...</span>
        <span>Data will populate automatically as background checks run.</span>
      </div>
    );
  }

  // If only 1 data point exists, duplicate it so Area has a line segment to render smoothly
  const chartData = data.length === 1
    ? [
        { time: 'Start', responseTime: data[0].responseTime, fullDate: data[0].fullDate },
        { ...data[0] }
      ]
    : data;

  return (
    <div className="h-60 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 15, bottom: 0, left: 5 }}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            width={48}
            allowDecimals={false}
            domain={[0, (dataMax) => (dataMax < 10 ? 10 : Math.ceil(dataMax * 1.25))]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}ms`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            formatter={(value, name, item) => {
              const status = item?.payload?.status;
              const statusLabel = status ? ` (${status === 'UP' ? 'OPERATIONAL' : 'OUTAGE'})` : '';
              return [`${value} ms${statusLabel}`, 'Check Latency'];
            }}
          />
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#latencyGradient)"
            dot={{ r: 3.5, fill: '#3b82f6', stroke: '#0B0F19', strokeWidth: 1.5 }}
            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#ffffff', strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;

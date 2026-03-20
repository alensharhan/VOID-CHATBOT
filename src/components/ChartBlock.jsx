import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Premium chart color palette tuned for both light and dark modes
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const ChartBlock = ({ config }) => {
  const [error, setError] = useState(null);

  const parsed = useMemo(() => {
    try {
      if (typeof config === 'string') {
        return JSON.parse(config);
      }
      return config;
    } catch (e) {
      setError('Invalid Chart JSON. Check that the AI output is valid JSON inside the recharts block.');
      return null;
    }
  }, [config]);

  if (error || !parsed) {
    return (
      <div className="my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
        ⚠ Chart Rendering Error: {error || 'No data provided.'}
      </div>
    );
  }

  const { type = 'bar', data = [], xKey, title, height = 300 } = parsed;

  // Auto-detect numeric keys from the first data row to use as value fields
  const valueKeys = data.length > 0
    ? Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number')
    : [];

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 0, bottom: 5 }
  };

  const tooltipStyle = {
    backgroundColor: '#1f1f1f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#d4d4d4',
    fontSize: '12px',
  };

  const renderChart = () => {
    if (type === 'pie') {
      const pieKey = valueKeys[0] || 'value';
      return (
        <PieChart>
          <Pie data={data} dataKey={pieKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      );
    }

    if (type === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xKey} tick={{ fill: '#71717a', fontSize: 12 }} />
          <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {valueKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />)}
        </LineChart>
      );
    }

    if (type === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            {valueKeys.map((key, i) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xKey} tick={{ fill: '#71717a', fontSize: 12 }} />
          <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {valueKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={`url(#grad-${key})`} strokeWidth={2} />
          ))}
        </AreaChart>
      );
    }

    // Default: Bar chart
    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} tick={{ fill: '#71717a', fontSize: 12 }} />
        <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend />
        {valueKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    );
  };

  return (
    <div className="my-6 w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-[#1f1f1f] border border-zinc-200 dark:border-white/[0.06] p-4 shadow-sm">
      {title && (
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 tracking-wide">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartBlock;

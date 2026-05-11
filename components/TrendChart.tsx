'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: '#1a1f2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 180,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {label}
      </Typography>
      {payload.map((entry, idx) => (
        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.3 }}>
          <Typography variant="caption" sx={{ color: entry.color }}>
            {entry.name}
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            {entry.value?.toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

interface TrendChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  title: string;
  height?: number;
}

export default function TrendChart({ data, title, height = 320 }: TrendChartProps) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>{title}</Typography>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradSuggested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c4dff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9aa0a6', fontSize: 11 }}
              tickFormatter={(v: string) => v?.slice(5) || v}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fill: '#9aa0a6', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" />
            <Area
              type="monotone"
              dataKey="lines_suggested"
              name="Lines Suggested"
              stroke="#7c4dff"
              fill="url(#gradSuggested)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="lines_accepted"
              name="Lines Accepted"
              stroke="#00d4ff"
              fill="url(#gradAccepted)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

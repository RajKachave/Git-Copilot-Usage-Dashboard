'use client';

import { Card, CardContent, Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { ReactNode, KeyboardEvent } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number;
  color?: string;
  onClick?: () => void;
}

export default function KPICard({ title, value, subtitle, icon, trend, color = 'primary.main', onClick }: KPICardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const interactive = typeof onClick === 'function';
  const hexColor = typeof color === 'string' && color.startsWith('#') ? color : '#00d4ff';

  const handleKeyDown = (e: KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick!();
    }
  };

  return (
    <Card
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : 'default',
        transition: interactive ? 'transform 120ms ease, box-shadow 120ms ease' : undefined,
        '&:hover': interactive ? { transform: 'translateY(-1px)', boxShadow: 5 } : undefined,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${hexColor}, transparent)`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1, color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ p: 1.5, borderRadius: 3, background: `linear-gradient(135deg, ${hexColor}22, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </Box>
          )}
        </Box>

        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
            {isPositive
              ? <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              : <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />}
            <Typography variant="caption" sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 600 }}>
              {isPositive ? '+' : ''}{trend}%
            </Typography>
            <Typography variant="caption" color="text.secondary">vs last period</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

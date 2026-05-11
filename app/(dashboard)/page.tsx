'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, CircularProgress, Alert, Chip, Card, CardContent,
  Dialog, DialogTitle, DialogContent, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatIcon from '@mui/icons-material/Chat';
import StorageIcon from '@mui/icons-material/Storage';
import MergeIcon from '@mui/icons-material/CallMerge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import KPICard from '@/components/KPICard';
import TrendChart from '@/components/TrendChart';
import PieBreakdown from '@/components/PieBreakdown';
import { getDashboardSummary, getDashboardTrends } from '@/lib/api-client';
import type { DashboardSummary, DashboardTrends } from '@/types';

function fmt(n: number | undefined): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

interface DrilldownDetail {
  label: string;
  value: string | number;
  source: string;
}

interface DrilldownEntry {
  title: string;
  description: string;
  details: DrilldownDetail[];
}

interface DrilldownRows {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  totalLabel: string;
  totalValue: string | number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getDashboardTrends()])
      .then(([sumRes, trendRes]) => {
        setSummary(sumRes);
        setTrends(trendRes);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>Failed to load dashboard: {error}</Alert>;
  }

  const pieData = [
    { name: 'Copilot Accepted', value: summary?.total_lines_accepted || 0 },
    { name: 'Human Written', value: summary?.estimated_human_lines || 0 },
  ];

  const langData = (trends?.languages || []).slice(0, 8).map((l) => ({
    name: l.name,
    suggested: l.total_lines_suggested,
    accepted: l.total_lines_accepted,
  }));

  const editorData = (trends?.editors || []).map((e) => ({
    name: e.name,
    value: e.total_engaged_users,
  }));

  const drilldownByKey: Record<string, DrilldownEntry> = {
    repo: {
      title: 'Repository Context',
      description: 'Repository associated with the current executive dashboard data.',
      details: [
        { label: 'Repository Name', value: summary?.primary_repo_name || 'N/A', source: 'repositories.name (latest synced)' },
        { label: 'Tracked Repository Count', value: summary?.total_repos || 0, source: 'COUNT(repositories)' },
      ],
    },
    contributors: {
      title: 'Contributors (Copilot-based)',
      description: 'Contributors are derived from Copilot usage users, not commit authors.',
      details: [
        { label: 'Contributors', value: summary?.active_contributors || 0, source: 'COUNT(DISTINCT copilot_user_metrics.user_login)' },
        { label: 'Latest Engaged Users', value: summary?.total_engaged_users || 0, source: 'copilot_metrics.total_engaged_users (latest day)' },
        { label: 'Latest Active Users', value: summary?.total_active_users || 0, source: 'copilot_metrics.total_active_users (latest day)' },
      ],
    },
    linesSuggested: {
      title: 'Lines Suggested',
      description: 'Total Copilot-suggested lines aggregated across imported periods.',
      details: [
        { label: 'Displayed Value', value: summary?.total_lines_suggested || 0, source: 'SUM(copilot_metrics.total_lines_suggested)' },
      ],
    },
    linesAccepted: {
      title: 'Lines Accepted',
      description: 'Total accepted Copilot lines derived by backend ingestion logic.',
      details: [
        { label: 'Displayed Value', value: summary?.total_lines_accepted || 0, source: 'SUM(copilot_metrics.total_lines_accepted)' },
      ],
    },
    acceptanceRate: {
      title: 'Acceptance Rate',
      description: 'Computed as accepted lines divided by suggested lines.',
      details: [
        { label: 'Suggested Lines', value: summary?.total_lines_suggested || 0, source: 'SUM(copilot_metrics.total_lines_suggested)' },
        { label: 'Accepted Lines', value: summary?.total_lines_accepted || 0, source: 'SUM(copilot_metrics.total_lines_accepted)' },
        { label: 'Displayed Value', value: `${summary?.acceptance_rate || 0}%`, source: '(accepted_lines / suggested_lines) * 100' },
      ],
    },
    activeUsers: {
      title: 'Active Users',
      description: 'Latest daily active and engaged users from Copilot metrics.',
      details: [
        { label: 'Active Users', value: summary?.total_active_users || 0, source: 'copilot_metrics.total_active_users (latest day)' },
        { label: 'Engaged Users', value: summary?.total_engaged_users || 0, source: 'copilot_metrics.total_engaged_users (latest day)' },
      ],
    },
    commits: {
      title: 'Total Commits',
      description: 'Total commit records synced into the dashboard database.',
      details: [
        { label: 'Displayed Value', value: summary?.total_commits || 0, source: 'COUNT(commits)' },
      ],
    },
    prs: {
      title: 'Total PRs',
      description: 'Total pull request records synced into the dashboard database.',
      details: [
        { label: 'Displayed Value', value: summary?.total_prs || 0, source: 'COUNT(pull_requests)' },
      ],
    },
    chats: {
      title: 'Copilot Chats',
      description: 'Sum of Copilot chat interactions from organization metrics.',
      details: [
        { label: 'Displayed Value', value: summary?.total_chats || 0, source: 'SUM(copilot_metrics.total_chats)' },
      ],
    },
    suggestions: {
      title: 'Code Suggestions',
      description: 'Sum of Copilot code generation events from organization metrics.',
      details: [
        { label: 'Displayed Value', value: summary?.total_suggestions || 0, source: 'SUM(copilot_metrics.total_code_suggestions)' },
      ],
    },
  };

  const selectedDetail = selectedMetric ? drilldownByKey[selectedMetric] : null;

  const daily = trends?.trends || [];

  const drilldownRows = ((): DrilldownRows | null => {
    switch (selectedMetric) {
      case 'linesAccepted':
        return {
          title: 'Raw Rows (by Date) used for SUM(total_lines_accepted)',
          columns: ['Date', 'Lines Accepted'],
          rows: daily.map((d) => [d.date, d.lines_accepted || 0]),
          totalLabel: 'Total Lines Accepted',
          totalValue: daily.reduce((acc, d) => acc + (d.lines_accepted || 0), 0),
        };
      case 'linesSuggested':
        return {
          title: 'Raw Rows (by Date) used for SUM(total_lines_suggested)',
          columns: ['Date', 'Lines Suggested'],
          rows: daily.map((d) => [d.date, d.lines_suggested || 0]),
          totalLabel: 'Total Lines Suggested',
          totalValue: daily.reduce((acc, d) => acc + (d.lines_suggested || 0), 0),
        };
      case 'acceptanceRate':
        return {
          title: 'Raw Rows (by Date) used for weighted acceptance rate',
          columns: ['Date', 'Lines Suggested', 'Lines Accepted', 'Daily Acceptance Rate'],
          rows: daily.map((d) => [d.date, d.lines_suggested || 0, d.lines_accepted || 0, `${d.acceptance_rate || 0}%`]),
          totalLabel: 'Weighted Overall Rate',
          totalValue: `${(
            (daily.reduce((acc, d) => acc + (d.lines_accepted || 0), 0)
              / Math.max(1, daily.reduce((acc, d) => acc + (d.lines_suggested || 0), 0)))
            * 100
          ).toFixed(2)}%`,
        };
      case 'suggestions':
        return {
          title: 'Raw Rows (by Date) used for SUM(total_code_suggestions)',
          columns: ['Date', 'Code Suggestions'],
          rows: daily.map((d) => [d.date, d.suggestions_count || 0]),
          totalLabel: 'Total Code Suggestions',
          totalValue: daily.reduce((acc, d) => acc + (d.suggestions_count || 0), 0),
        };
      case 'activeUsers':
        return {
          title: 'Raw Rows (by Date) for active users',
          columns: ['Date', 'Active Users'],
          rows: daily.map((d) => [d.date, d.active_users || 0]),
          totalLabel: 'Latest Active Users',
          totalValue: daily.length ? (daily[daily.length - 1].active_users || 0) : 0,
        };
      case 'chats':
        return {
          title: 'Raw Rows (by Date) used for SUM(total_chats)',
          columns: ['Date', 'Chats'],
          rows: daily.map((d) => [d.date, d.chats_count || 0]),
          totalLabel: 'Total Chats',
          totalValue: daily.reduce((acc, d) => acc + (d.chats_count || 0), 0),
        };
      default:
        return null;
    }
  })();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Executive Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Organization-wide GitHub Copilot usage analytics
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip
            label={summary?.primary_repo_name || `${summary?.total_repos || 0} Repos`}
            size="small" variant="outlined" clickable
            onClick={() => setSelectedMetric('repo')}
          />
          <Chip
            label={`${summary?.active_contributors || 0} Contributors`}
            size="small" variant="outlined" clickable
            onClick={() => setSelectedMetric('contributors')}
          />
        </Box>
      </Box>

      {/* KPI Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Lines Suggested" value={fmt(summary?.total_lines_suggested)} subtitle="Total Copilot suggestions"
            icon={<CodeIcon sx={{ fontSize: 28, color: '#7c4dff' }} />} color="#7c4dff" trend={12.5}
            onClick={() => setSelectedMetric('linesSuggested')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Lines Accepted" value={fmt(summary?.total_lines_accepted)} subtitle="Adopted by developers"
            icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#00d4ff' }} />} color="#00d4ff" trend={8.3}
            onClick={() => setSelectedMetric('linesAccepted')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Acceptance Rate" value={`${summary?.acceptance_rate || 0}%`} subtitle="Suggestions accepted"
            icon={<TrendingUpIcon sx={{ fontSize: 28, color: '#00e676' }} />} color="#00e676"
            onClick={() => setSelectedMetric('acceptanceRate')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Active Users" value={summary?.total_active_users || 0} subtitle={`${summary?.total_engaged_users || 0} engaged`}
            icon={<PeopleIcon sx={{ fontSize: 28, color: '#ffab40' }} />} color="#ffab40"
            onClick={() => setSelectedMetric('activeUsers')} />
        </Grid>
      </Grid>

      {/* KPI Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Total Commits" value={fmt(summary?.total_commits)}
            icon={<StorageIcon sx={{ fontSize: 28, color: '#ff5252' }} />} color="#ff5252"
            onClick={() => setSelectedMetric('commits')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Total PRs" value={fmt(summary?.total_prs)}
            icon={<MergeIcon sx={{ fontSize: 28, color: '#e040fb' }} />} color="#e040fb"
            onClick={() => setSelectedMetric('prs')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Copilot Chats" value={fmt(summary?.total_chats)}
            icon={<ChatIcon sx={{ fontSize: 28, color: '#64ffda' }} />} color="#64ffda"
            onClick={() => setSelectedMetric('chats')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Code Suggestions" value={fmt(summary?.total_suggestions)}
            icon={<SmartToyIcon sx={{ fontSize: 28, color: '#ffd740' }} />} color="#ffd740"
            onClick={() => setSelectedMetric('suggestions')} />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TrendChart data={trends?.trends || []} title="Copilot Usage Trends" />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <PieBreakdown data={pieData} title="Copilot vs Human Code" />
        </Grid>
      </Grid>

      {/* Language & Editor Row */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Language Breakdown</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={langData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: unknown) => (v as number)?.toLocaleString()}
                  />
                  <Bar dataKey="suggested" name="Lines Suggested" fill="#7c4dff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name="Lines Accepted" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <PieBreakdown data={editorData} title="Editor Distribution" height={300} />
        </Grid>
      </Grid>

      {/* Drilldown Dialog */}
      <Dialog open={Boolean(selectedDetail)} onClose={() => setSelectedMetric(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{selectedDetail?.title || 'Metric Details'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedDetail?.description}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Field</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Value</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Source / Formula</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedDetail?.details || []).map((detail) => (
                  <TableRow key={detail.label}>
                    <TableCell>{detail.label}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {typeof detail.value === 'number' ? detail.value.toLocaleString() : detail.value}
                    </TableCell>
                    <TableCell>{detail.source || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {drilldownRows && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{drilldownRows.title}</Typography>
              <TableContainer sx={{ maxHeight: 320, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {drilldownRows.columns.map((col) => (
                        <TableCell key={col} sx={{ fontWeight: 700 }}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drilldownRows.rows.map((row, idx) => (
                      <TableRow key={`${row[0]}-${idx}`}>
                        {row.map((cell, cellIdx) => (
                          <TableCell key={`${cellIdx}-${String(cell)}`} align={cellIdx === 0 ? 'left' : 'right'}>
                            {typeof cell === 'number' ? cell.toLocaleString() : cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>{drilldownRows.totalLabel}</TableCell>
                      {drilldownRows.columns.slice(1, -1).map((_, idx) => (
                        <TableCell key={`spacer-${idx}`} />
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {typeof drilldownRows.totalValue === 'number'
                          ? drilldownRows.totalValue.toLocaleString()
                          : drilldownRows.totalValue}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

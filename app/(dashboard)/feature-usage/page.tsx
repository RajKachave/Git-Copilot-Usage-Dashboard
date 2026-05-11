'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Card, CardContent, CircularProgress, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ForumIcon from '@mui/icons-material/Forum';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import PieBreakdown from '@/components/PieBreakdown';
import KPICard from '@/components/KPICard';
import { getFeatureUsageDashboard } from '@/lib/api-client';
import type { FeatureUsageDashboardResponse } from '@/types';

function humanizeFeature(feature: string | undefined): string {
  return feature
    ?.split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown';
}

function truncateLabel(label: string, max = 22): string {
  if (!label || label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

export default function FeatureUsagePage() {
  const [data, setData] = useState<FeatureUsageDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeatureUsageDashboard()
      .then((res) => setData(res))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const topFeatures = useMemo(() => data?.features?.slice(0, 5) || [], [data?.features]);

  const featureShare = useMemo(
    () => topFeatures.map((item) => ({ name: humanizeFeature(item.feature), value: item.total_interactions })),
    [topFeatures],
  );

  const topFeatureNames = useMemo(
    () => topFeatures.slice(0, 4).map((item) => item.feature),
    [topFeatures],
  );

  const trendRows = useMemo(() => {
    const byDate = new Map<string, Record<string, unknown>>();
    (data?.trends || []).forEach((row) => {
      if (!topFeatureNames.includes(row.feature)) return;
      const existing = byDate.get(row.date) || { date: row.date };
      (existing as Record<string, unknown>)[humanizeFeature(row.feature)] = row.interactions;
      byDate.set(row.date, existing);
    });
    return Array.from(byDate.values());
  }, [data?.trends, topFeatureNames]);

  const barRows = useMemo(
    () => topFeatures.map((item) => ({
      name: humanizeFeature(item.feature),
      acceptedLines: item.total_accepted_lines,
      suggestedLines: item.total_suggested_lines,
    })),
    [topFeatures],
  );

  const modelRows = useMemo(
    () => (data?.models || []).map((item) => ({
      name: item.name,
      value: item.total_suggestions + item.total_chats,
      suggestions: item.total_suggestions,
      acceptances: item.total_acceptances,
      chats: item.total_chats,
      share: item.share,
    })),
    [data?.models],
  );

  const modeRows = useMemo(
    () => (data?.modes || []).map((item) => ({
      name: item.mode,
      interactions: item.total_interactions,
      generations: item.total_generations,
      acceptances: item.total_acceptances,
      share: item.share,
    })),
    [data?.modes],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load feature dashboard: {error}</Alert>;
  }

  if (!data || !(data.features || []).length) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Feature Usage</Typography>
        <Alert severity="info">
          No feature usage data is available yet. Import the NDJSON usage exports or run a report-based sync first.
        </Alert>
      </Box>
    );
  }

  const { summary } = data;
  const COLORS = ['#00d4ff', '#7c4dff', '#00e676', '#ffab40'];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Feature Usage</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Feature-level Copilot adoption across ask mode, agent workflows, and related usage patterns.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Total Interactions" value={summary.total_interactions.toLocaleString()}
            subtitle="All feature interactions"
            icon={<ForumIcon sx={{ fontSize: 28, color: '#00d4ff' }} />} color="#00d4ff" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Code Generations" value={summary.total_generations.toLocaleString()}
            subtitle="Feature-generated code events"
            icon={<AutoAwesomeIcon sx={{ fontSize: 28, color: '#7c4dff' }} />} color="#7c4dff" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Acceptance Rate" value={`${summary.overall_acceptance_rate}%`}
            subtitle={`${summary.overall_line_acceptance_rate}% by lines`}
            icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#00e676' }} />} color="#00e676" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Agent Share" value={`${summary.agent_interaction_share}%`}
            subtitle={summary.top_feature ? `${humanizeFeature(summary.top_feature)} leads at ${summary.top_feature_share}%` : 'No leading feature'}
            icon={<InsightsIcon sx={{ fontSize: 28, color: '#ffab40' }} />} color="#ffab40" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Interaction Trend By Feature</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#9aa0a6', fontSize: 11 }} tickFormatter={(v: string) => v?.slice(5) || v} />
                  <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  {topFeatures.slice(0, 4).map((item, index) => (
                    <Line
                      key={item.feature}
                      type="monotone"
                      dataKey={humanizeFeature(item.feature)}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <PieBreakdown data={featureShare} title="Interaction Share" height={320} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Suggested vs Accepted Lines By Feature</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: unknown) => (value as number)?.toLocaleString()}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="suggestedLines" name="Suggested Lines" fill="#7c4dff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="acceptedLines" name="Accepted Lines" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          {modelRows.length ? (
            <PieBreakdown data={modelRows} title="Model Usage" height={320} />
          ) : (
            <Card>
              <CardContent sx={{ p: 3, minHeight: 320 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Model Usage</Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Model-level usage data is not yet available. Re-sync to fetch model breakdowns from the Copilot API.
                </Alert>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Chat Mode Usage</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ask, Edit, Agent, Custom, Plan, and Inline modes derived from feature names in the usage report.
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={modeRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: unknown, key: unknown) => {
                      if (key === 'share') return [`${value as number}%`, 'Share'];
                      return [(value as number)?.toLocaleString?.() ?? value, key as string];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="interactions" name="Interactions" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="generations" name="Generations" fill="#7c4dff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="acceptances" name="Acceptances" fill="#00e676" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Feature Leaderboard</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Feature</TableCell>
                  <TableCell align="right">Interactions</TableCell>
                  <TableCell align="right">Generations</TableCell>
                  <TableCell align="right">Acceptances</TableCell>
                  <TableCell align="right">Accepted Lines</TableCell>
                  <TableCell align="right">Acceptance Rate</TableCell>
                  <TableCell align="right">Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.features.map((item) => (
                  <TableRow key={item.feature} sx={{ '&:hover': { bgcolor: 'rgba(0,212,255,0.04)' } }}>
                    <TableCell>{humanizeFeature(item.feature)}</TableCell>
                    <TableCell align="right">{item.total_interactions.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_generations.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_acceptances.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_accepted_lines.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.acceptance_rate}%</TableCell>
                    <TableCell align="right">{item.interaction_share}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {modelRows.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Model Leaderboard</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Suggestions</TableCell>
                    <TableCell align="right">Acceptances</TableCell>
                    <TableCell align="right">Chats</TableCell>
                    <TableCell align="right">Share</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelRows.map((item) => (
                    <TableRow key={item.name} sx={{ '&:hover': { bgcolor: 'rgba(0,212,255,0.04)' } }}>
                      <TableCell title={item.name}>{truncateLabel(item.name, 34)}</TableCell>
                      <TableCell align="right">{item.suggestions.toLocaleString()}</TableCell>
                      <TableCell align="right">{item.acceptances.toLocaleString()}</TableCell>
                      <TableCell align="right">{item.chats.toLocaleString()}</TableCell>
                      <TableCell align="right">{item.share}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

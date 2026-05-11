'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress,
  Chip, Dialog, DialogContent, DialogTitle, Divider,
  Grid, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Typography, IconButton,
} from '@mui/material';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import GroupIcon from '@mui/icons-material/Group';
import ForumIcon from '@mui/icons-material/Forum';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BoltIcon from '@mui/icons-material/Bolt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import InsightsIcon from '@mui/icons-material/Insights';
import * as XLSX from 'xlsx';
import KPICard from '@/components/KPICard';
import TrendChart from '@/components/TrendChart';
import { getUserUsageDetail, getUsersUsageDashboard } from '@/lib/api-client';
import type {
  UserUsageDashboardResponse, UserUsageItem, UserUsageDetailResponse,
} from '@/types';

const USER_LINE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#f44336', '#3f51b5', '#4caf50', '#ff9800', '#009688',
  '#795548', '#607d8b', '#e91e63', '#9c27b0', '#00acc1',
];

function getUserColor(user: string, index: number): string {
  if (index < USER_LINE_COLORS.length) return USER_LINE_COLORS[index];
  let hash = 0;
  for (let i = 0; i < user.length; i += 1) {
    hash = (hash << 5) - hash + user.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs((hash * 137.508) % 360);
  return `hsl(${hue.toFixed(1)} 72% 52%)`;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value ?? 0);
}

function downloadBlob(content: BlobPart, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toExportRows(users: UserUsageItem[]) {
  return users.map((item) => ({
    User: item.user_login,
    Interactions: item.total_interactions,
    'Skills Interactions': item.total_skill_interactions,
    'Agent Interactions': item.total_agent_interactions,
    'Built-in Agent Interactions': item.total_builtin_agent_interactions,
    'Extension Agent Interactions': item.total_extension_agent_interactions,
    'Agent Edit Lines': item.total_agent_edit_lines,
    'Agent Impact (%)': item.agent_impact,
    'Suggested Lines': item.total_suggested_lines,
    'Accepted Lines': item.total_accepted_lines,
    'Line Acceptance Rate (%)': item.line_acceptance_rate,
    'Interaction Share (%)': item.interaction_share,
  }));
}

interface KpiRow { label: string; value: string; source: string; }

function KpiBreakdownDialog({ open, title, rows, onClose }: { open: boolean; title: string; rows: KpiRow[]; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>{title || 'KPI Details'}</Typography>
          <IconButton onClick={onClose} aria-label="Close KPI detail dialog"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>How It Is Calculated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} hover>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">{row.value}</TableCell>
                  <TableCell>{row.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailDialog({ open, userLogin, detail, loading, error, onClose }: {
  open: boolean; userLogin: string | null; detail: UserUsageDetailResponse | null;
  loading: boolean; error: string | null; onClose: () => void;
}) {
  const activityTrendRows = useMemo(
    () => (detail?.daily || []).map((row) => ({
      date: row.date, interactions: row.interactions, generations: row.generations, acceptances: row.acceptances,
    })),
    [detail?.daily],
  );

  const lineTrendRows = useMemo(
    () => (detail?.daily || []).map((row) => ({
      date: row.date, lines_suggested: row.suggested_lines, lines_accepted: row.accepted_lines,
    })),
    [detail?.daily],
  );

  const summary = detail?.summary;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={800}>{userLogin ? `${userLogin} Usage Overview` : 'User Usage Overview'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Daily Copilot usage details for the selected user from imported users reports.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close user detail dialog"><CloseIcon /></IconButton>
        </Box>
        {summary && !loading && !error && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
            <Chip label={`${summary.total_active_days} active day${summary.total_active_days === 1 ? '' : 's'}`} size="small" />
            <Chip label={`${summary.interaction_share}% of all interactions`} size="small" />
            <Chip label={`Peak ${summary.peak_daily_interactions} on ${summary.peak_interactions_date || 'N/A'}`} size="small" />
          </Stack>
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            <CircularProgress size={42} />
          </Box>
        )}
        {!loading && error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load user details: {error}</Alert>}
        {!loading && !error && detail && summary && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KPICard title="Interactions" value={formatCompactNumber(summary.total_interactions)}
                  subtitle={`${summary.average_daily_interactions} avg / day`}
                  icon={<InsightsIcon sx={{ fontSize: 28, color: '#00d4ff' }} />} color="#00d4ff" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KPICard title="Code Generations" value={formatCompactNumber(summary.total_generations)}
                  subtitle={`${summary.total_acceptances.toLocaleString()} accepted events`}
                  icon={<BoltIcon sx={{ fontSize: 28, color: '#7c4dff' }} />} color="#7c4dff" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KPICard title="Accepted Lines" value={formatCompactNumber(summary.total_accepted_lines)}
                  subtitle={`${summary.total_suggested_lines.toLocaleString()} suggested`}
                  icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#00e676' }} />} color="#00e676" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KPICard title="Chat Turns" value="—"
                  subtitle="Usage from daily report"
                  icon={<ChatBubbleOutlineIcon sx={{ fontSize: 28, color: '#ffab40' }} />} color="#ffab40" />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Daily Activity Trend</Typography>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={activityTrendRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#9aa0a6', fontSize: 11 }} tickFormatter={(v: string) => v?.slice(5) || v} />
                        <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="interactions" stroke="#00d4ff" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="generations" stroke="#7c4dff" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="acceptances" stroke="#00e676" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Suggested vs Accepted Lines</Typography>
                    <TrendChart data={lineTrendRows} title="" height={280} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Daily Metrics Breakdown</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Raw daily metrics behind the user-level cards and charts.
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Interactions</TableCell>
                        <TableCell align="right">Generations</TableCell>
                        <TableCell align="right">Acceptances</TableCell>
                        <TableCell align="right">Suggested Lines</TableCell>
                        <TableCell align="right">Accepted Lines</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.daily.map((row) => (
                        <TableRow key={row.date} hover>
                          <TableCell>{row.date}</TableCell>
                          <TableCell align="right">{row.interactions.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.generations.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.acceptances.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.suggested_lines.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.accepted_lines.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type SortOrder = 'asc' | 'desc';

export default function UsersUsagePage() {
  const [data, setData] = useState<UserUsageDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof UserUsageItem>('total_interactions');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [detailUserLogin, setDetailUserLogin] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, UserUsageDetailResponse>>({});
  const [kpiDialogKey, setKpiDialogKey] = useState<string | null>(null);

  useEffect(() => {
    getUsersUsageDashboard()
      .then((res) => {
        setData(res);
        const initialUsers = (res?.users || []).slice(0, 4).map((row) => row.user_login);
        setSelectedUsers(initialUsers);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedUserNames = useMemo(
    () => (data?.users || []).map((row) => row.user_login).filter((login) => selectedUsers.includes(login)),
    [data?.users, selectedUsers],
  );

  const trendRows = useMemo(() => {
    const byDate = new Map<string, Record<string, unknown>>();
    (data?.trend || []).forEach((row) => {
      const r = row as Record<string, unknown>;
      const userLogin = r.user_login as string;
      if (!selectedUserNames.includes(userLogin)) return;
      const existing = byDate.get(r.date as string) || { date: r.date };
      (existing as Record<string, unknown>)[userLogin] = r.interactions;
      byDate.set(r.date as string, existing);
    });
    return Array.from(byDate.values());
  }, [data?.trend, selectedUserNames]);

  const sortedUsers = useMemo(() => {
    const rows = [...(data?.users || [])];
    rows.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal || '').localeCompare(String(bVal || ''));
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [data?.users, sortBy, sortOrder]);

  const selectedUserRows = useMemo(
    () => sortedUsers.filter((row) => selectedUsers.includes(row.user_login)),
    [sortedUsers, selectedUsers],
  );

  const handleSort = (key: keyof UserUsageItem) => {
    if (sortBy === key) { setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc'); return; }
    setSortBy(key);
    setSortOrder(key === 'user_login' ? 'asc' : 'desc');
  };

  const handleUserToggle = (userLogin: string) => {
    setSelectedUsers((prev) => prev.includes(userLogin) ? prev.filter((u) => u !== userLogin) : [...prev, userLogin]);
  };

  const handleToggleAllUsers = () => {
    const all = sortedUsers.map((r) => r.user_login);
    const allSelected = all.length > 0 && all.every((l) => selectedUsers.includes(l));
    setSelectedUsers(allSelected ? [] : all);
  };

  const handleOpenUserDetail = (userLogin: string) => {
    setDetailUserLogin(userLogin);
    setDetailOpen(true);
    setDetailError(null);
    if (detailCache[userLogin]) return;
    setDetailLoading(true);
    getUserUsageDetail(userLogin)
      .then((res) => setDetailCache((prev) => ({ ...prev, [userLogin]: res })))
      .catch((err: Error) => setDetailError(err.message))
      .finally(() => setDetailLoading(false));
  };

  const handleExportCSV = () => {
    if (!selectedUserRows.length) return;
    const headers = Object.keys(toExportRows([selectedUserRows[0]])[0]);
    const escapeCsv = (v: unknown) => {
      const text = String(v ?? '');
      const q = '"';
      if (text.includes(',') || text.includes(q) || text.includes('\n')) return `${q}${text.split(q).join(`${q}${q}`)}${q}`;
      return text;
    };
    const rows = toExportRows(selectedUserRows).map((row) => headers.map((h) => escapeCsv((row as Record<string, unknown>)[h])).join(','));
    downloadBlob([headers.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8;', 'selected_users_usage.csv');
  };

  const handleExportXLSX = () => {
    if (!selectedUserRows.length) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(toExportRows(selectedUserRows));
    XLSX.utils.book_append_sheet(wb, ws, 'Users Usage');
    XLSX.writeFile(wb, 'selected_users_usage.xlsx');
  };

  const sortableColumns: { key: keyof UserUsageItem; label: string; align: 'left' | 'right' }[] = [
    { key: 'user_login', label: 'User', align: 'left' },
    { key: 'total_interactions', label: 'Interactions', align: 'right' },
    { key: 'total_skill_interactions', label: 'Skills', align: 'right' },
    { key: 'total_agent_interactions', label: 'Agents', align: 'right' },
    { key: 'total_agent_edit_lines', label: 'Agent Edit Lines', align: 'right' },
    { key: 'agent_impact', label: 'Agent Impact', align: 'right' },
    { key: 'total_suggested_lines', label: 'Suggested Lines', align: 'right' },
    { key: 'total_accepted_lines', label: 'Accepted Lines', align: 'right' },
    { key: 'line_acceptance_rate', label: 'Line Acceptance Rate', align: 'right' },
    { key: 'interaction_share', label: 'Share', align: 'right' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">Failed to load users usage dashboard: {error}</Alert>;

  if (!data || !(data.users || []).length) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Users Usage</Typography>
        <Alert severity="info">No user-level usage data is available yet. Run Sync Now after configuring PAT/org.</Alert>
      </Box>
    );
  }

  const s = data?.summary;
  const summary = {
    total_users: s?.total_users ?? 0,
    total_active_days: s?.total_active_days ?? 0,
    total_interactions: s?.total_interactions ?? 0,
    total_generations: s?.total_generations ?? 0,
    total_acceptances: s?.total_acceptances ?? 0,
    total_suggested_lines: s?.total_suggested_lines ?? 0,
    total_accepted_lines: s?.total_accepted_lines ?? 0,
    total_agent_edit_lines: s?.total_agent_edit_lines ?? 0,
    total_lines_changed: s?.total_lines_changed ?? 0,
    overall_agent_impact: s?.overall_agent_impact ?? 0,
    total_skill_interactions: s?.total_skill_interactions ?? 0,
    total_agent_interactions: s?.total_agent_interactions ?? 0,
    total_builtin_agent_interactions: s?.total_builtin_agent_interactions ?? 0,
    total_extension_agent_interactions: s?.total_extension_agent_interactions ?? 0,
    total_engaged_users_agent: s?.total_engaged_users_agent ?? 0,
    overall_acceptance_rate: s?.overall_acceptance_rate ?? 0,
    overall_line_acceptance_rate: s?.overall_line_acceptance_rate ?? 0,
  };
  const fmtN = (v: number) => Number(v ?? 0).toLocaleString();
  const activeDetail = detailUserLogin ? detailCache[detailUserLogin] ?? null : null;
  const allSelected = sortedUsers.length > 0 && sortedUsers.every((r) => selectedUsers.includes(r.user_login));
  const someSelected = sortedUsers.some((r) => selectedUsers.includes(r.user_login));

  const kpiBreakdowns: Record<string, { title: string; rows: KpiRow[] }> = {
    trackedUsers: { title: 'Tracked Users Breakdown', rows: [{ label: 'Tracked Users', value: summary.total_users.toLocaleString(), source: 'Distinct users from users report rows' }, { label: 'Active User-Days', value: fmtN(summary.total_active_days), source: 'Sum of per-user active days' }] },
    interactions: { title: 'Total Interactions Breakdown', rows: [{ label: 'Total Interactions', value: fmtN(summary.total_interactions), source: 'Sum(user_initiated_interaction_count)' }] },
    generations: { title: 'Code Generations Breakdown', rows: [{ label: 'Total Generations', value: fmtN(summary.total_generations), source: 'Sum(code_generation_activity_count)' }, { label: 'Total Acceptances', value: fmtN(summary.total_acceptances), source: 'Sum(code_acceptance_activity_count)' }] },
    lineAcceptance: { title: 'Line Acceptance Rate Breakdown', rows: [{ label: 'Accepted Lines', value: fmtN(summary.total_accepted_lines), source: 'Sum(loc_added_sum + loc_deleted_sum)' }, { label: 'Suggested Lines', value: fmtN(summary.total_suggested_lines), source: 'Sum(loc_suggested_to_add_sum + loc_suggested_to_delete_sum)' }, { label: 'Line Acceptance Rate', value: `${summary.overall_line_acceptance_rate}%`, source: 'Accepted / Suggested * 100' }] },
    agentImpact: { title: 'Agent Impact Breakdown', rows: [{ label: 'Agent Edit Lines', value: fmtN(summary.total_agent_edit_lines), source: 'From totals_by_feature where feature=agent_edit' }, { label: 'Agent Impact', value: `${summary.overall_agent_impact}%`, source: 'Agent Edit Lines / Lines Changed * 100' }] },
    skills: { title: 'Skills Interactions Breakdown', rows: [{ label: 'Skill Interactions', value: fmtN(summary.total_skill_interactions), source: 'chat_panel_custom_mode + chat_panel_ask_mode' }] },
    agents: { title: 'Agent Interactions Breakdown', rows: [{ label: 'Total Agent Interactions', value: fmtN(summary.total_agent_interactions), source: 'chat_panel_agent_mode' }, { label: 'Built-in', value: fmtN(summary.total_builtin_agent_interactions), source: 'Mapped from chat_panel_agent_mode' }, { label: 'Extension', value: fmtN(summary.total_extension_agent_interactions), source: 'Extension agents' }] },
    engagedAgents: { title: 'Engaged Agent Users Breakdown', rows: [{ label: 'Engaged Agent Users', value: fmtN(summary.total_engaged_users_agent), source: 'Distinct users with agent interactions > 0' }] },
  };
  const activeKpi = kpiDialogKey ? kpiBreakdowns[kpiDialogKey] : null;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Users Usage</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          User-level Copilot adoption and interaction metrics from the GitHub users-28-day report.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Tracked Users" value={summary.total_users.toLocaleString()} subtitle={`${summary.total_active_days.toLocaleString()} active user-days`} icon={<GroupIcon sx={{ fontSize: 28, color: '#00d4ff' }} />} color="#00d4ff" onClick={() => setKpiDialogKey('trackedUsers')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Total Interactions" value={summary.total_interactions.toLocaleString()} subtitle="User initiated interactions" icon={<ForumIcon sx={{ fontSize: 28, color: '#7c4dff' }} />} color="#7c4dff" onClick={() => setKpiDialogKey('interactions')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Code Generations" value={summary.total_generations.toLocaleString()} subtitle={`${summary.total_acceptances.toLocaleString()} accepted`} icon={<AutoAwesomeIcon sx={{ fontSize: 28, color: '#ffab40' }} />} color="#ffab40" onClick={() => setKpiDialogKey('generations')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Line Acceptance Rate" value={`${summary.overall_line_acceptance_rate}%`} subtitle="Accepted lines vs suggested lines" icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#00e676' }} />} color="#00e676" onClick={() => setKpiDialogKey('lineAcceptance')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Agent Impact" value={`${summary.overall_agent_impact}%`} subtitle={`${summary.total_agent_edit_lines.toLocaleString()} agent edit lines`} icon={<InsightsIcon sx={{ fontSize: 28, color: '#ff7043' }} />} color="#ff7043" onClick={() => setKpiDialogKey('agentImpact')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Skills Interactions" value={summary.total_skill_interactions.toLocaleString()} subtitle="Slash commands and custom skills" icon={<AutoAwesomeIcon sx={{ fontSize: 28, color: '#29b6f6' }} />} color="#29b6f6" onClick={() => setKpiDialogKey('skills')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Agent Interactions" value={summary.total_agent_interactions.toLocaleString()} subtitle={`${summary.total_builtin_agent_interactions.toLocaleString()} built-in, ${summary.total_extension_agent_interactions.toLocaleString()} extension`} icon={<BoltIcon sx={{ fontSize: 28, color: '#ab47bc' }} />} color="#ab47bc" onClick={() => setKpiDialogKey('agents')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KPICard title="Engaged Agent Users" value={summary.total_engaged_users_agent.toLocaleString()} subtitle="Users who interacted with agents" icon={<GroupIcon sx={{ fontSize: 28, color: '#26a69a' }} />} color="#26a69a" onClick={() => setKpiDialogKey('engagedAgents')} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Interaction Trend By User</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing trends for {selectedUserNames.length} selected user{selectedUserNames.length === 1 ? '' : 's'} from User Leaderboard.
              </Typography>
              {!selectedUserNames.length && <Alert severity="info" sx={{ mb: 2 }}>Select one or more users in the User Leaderboard to render the trend chart.</Alert>}
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#9aa0a6', fontSize: 11 }} tickFormatter={(v: string) => v?.slice(5) || v} />
                  <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  {selectedUserNames.map((user, index) => (
                    <Line key={user} type="monotone" dataKey={user} stroke={getUserColor(user, index)} strokeWidth={2.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>User Leaderboard</Typography>
            <Stack direction="row" spacing={1.2}>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportCSV} disabled={!selectedUserRows.length}>Export CSV</Button>
              <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleExportXLSX} disabled={!selectedUserRows.length}>Export XLSX</Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={handleToggleAllUsers} inputProps={{ 'aria-label': 'toggle all users' }} />
                  </TableCell>
                  {sortableColumns.map((col) => (
                    <TableCell key={col.key} align={col.align}>
                      <TableSortLabel active={sortBy === col.key} direction={sortBy === col.key ? sortOrder : 'asc'} onClick={() => handleSort(col.key)} sx={{ '& .MuiTableSortLabel-icon': { color: 'text.secondary !important' } }}>
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((item) => (
                  <TableRow key={item.user_login} hover onClick={() => handleUserToggle(item.user_login)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,212,255,0.04)' }, ...(selectedUsers.includes(item.user_login) && { bgcolor: 'rgba(0,212,255,0.10)' }) }}>
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedUsers.includes(item.user_login)} onChange={() => handleUserToggle(item.user_login)} inputProps={{ 'aria-label': `toggle ${item.user_login}` }} />
                    </TableCell>
                    <TableCell>
                      <Button variant="text" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenUserDetail(item.user_login); }} sx={{ px: 0, minWidth: 0, fontWeight: 700, textTransform: 'none' }}>
                        {item.user_login}
                      </Button>
                    </TableCell>
                    <TableCell align="right">{item.total_interactions.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_skill_interactions.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_agent_interactions.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_agent_edit_lines.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.agent_impact}%</TableCell>
                    <TableCell align="right">{item.total_suggested_lines.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.total_accepted_lines.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.line_acceptance_rate}%</TableCell>
                    <TableCell align="right">{item.interaction_share}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <UserDetailDialog open={detailOpen} userLogin={detailUserLogin} detail={activeDetail} loading={detailLoading && !activeDetail} error={detailError} onClose={() => { setDetailOpen(false); setDetailError(null); }} />
      <KpiBreakdownDialog open={Boolean(activeKpi)} title={activeKpi?.title ?? ''} rows={activeKpi?.rows ?? []} onClose={() => setKpiDialogKey(null)} />
    </Box>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert,
  TablePagination, TextField, InputAdornment, Tooltip, Collapse,
  IconButton, Grid, Select, MenuItem, FormControl, InputLabel, Skeleton,
  useTheme, alpha,
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShieldIcon from '@mui/icons-material/Shield';
import BugReportIcon from '@mui/icons-material/BugReport';
import PeopleIcon from '@mui/icons-material/People';
import CodeIcon from '@mui/icons-material/Code';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getPullRequests, getPRInsightsSummary } from '@/lib/api-client';
import type { PullRequestResponse, PRInsightsSummary } from '@/types';

const stateColors: Record<string, 'info' | 'default' | 'success'> = { open: 'info', closed: 'default', merged: 'success' };

function riskLabel(score: number): string { return score < 0.3 ? 'Low' : score < 0.6 ? 'Medium' : 'High'; }
function riskColor(score: number): string { return score < 0.3 ? '#00e676' : score < 0.6 ? '#ffab40' : '#ff5252'; }
const formatNum = (n: number | undefined) => (n ?? 0).toLocaleString();

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getMergeHours(pr: PullRequestResponse): number | null {
  const created = toDate(pr.created_at);
  const merged = toDate(pr.merged_at);
  if (!created || !merged || merged < created) return null;
  return (merged.getTime() - created.getTime()) / (1000 * 60 * 60);
}

function isAIAgentPR(pr: PullRequestResponse): boolean {
  const author = (pr.author || '').toLowerCase();
  return author === 'github-copilot[bot]' || author.includes('copilot') || author.includes('mcp-agent');
}

function SummaryCard({ title, value, icon, color, subtitle }: { title: string; value: string; icon: React.ReactNode; color: string; subtitle?: string }) {
  return (
    <Card sx={{ position: 'relative', overflow: 'hidden', height: '100%', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)` } }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5, fontWeight: 600 }}>{title}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1.2 }}>{value}</Typography>
            {subtitle && <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>{subtitle}</Typography>}
          </Box>
          <Box sx={{ p: 1.2, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${color}22, transparent)` }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function CodeOwnershipBar({ copilotLines, humanLines }: { copilotLines: number; humanLines: number }) {
  const total = copilotLines + humanLines;
  if (total === 0) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const copilotPct = (copilotLines / total) * 100;
  const humanPct = 100 - copilotPct;
  return (
    <Tooltip title={<Box sx={{ fontSize: '0.78rem' }}><div>🤖 Copilot: {formatNum(copilotLines)} lines ({copilotPct.toFixed(1)}%)</div><div>👤 Human: {formatNum(humanLines)} lines ({humanPct.toFixed(1)}%)</div></Box>} arrow placement="top">
      <Box sx={{ width: '100%', minWidth: 100 }}>
        <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
          <Box sx={{ width: `${copilotPct}%`, background: 'linear-gradient(90deg, #00d4ff, #0096d4)', transition: 'width 0.4s ease' }} />
          <Box sx={{ width: `${humanPct}%`, bgcolor: '#4a5568', transition: 'width 0.4s ease' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#00d4ff' }}>{copilotPct.toFixed(0)}%</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#9aa0a6' }}>{humanPct.toFixed(0)}%</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

function QualitySignals({ analysis }: { analysis: PullRequestResponse['analysis'] }) {
  if (!analysis) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const { failed_checks, reverted_lines, review_comments_on_copilot } = analysis;
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {failed_checks > 0 ? (
        <Tooltip title={`${failed_checks} CI check(s) failed`} arrow>
          <Chip icon={<CancelOutlinedIcon sx={{ fontSize: 14 }} />} label={failed_checks} size="small" sx={{ bgcolor: 'rgba(255,82,82,0.12)', color: '#ff5252', fontWeight: 700, fontSize: '0.7rem', height: 24, '& .MuiChip-icon': { color: '#ff5252' } }} />
        </Tooltip>
      ) : (
        <Tooltip title="All CI checks passed" arrow>
          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#00e676', opacity: 0.7 }} />
        </Tooltip>
      )}
      {(reverted_lines ?? 0) > 0 && (
        <Tooltip title={`${reverted_lines} line(s) reverted post-merge`} arrow>
          <Chip label={`🔁 ${reverted_lines}`} size="small" sx={{ bgcolor: 'rgba(255,171,64,0.12)', color: '#ffab40', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />
        </Tooltip>
      )}
      {(review_comments_on_copilot ?? 0) > 0 && (
        <Tooltip title={`${review_comments_on_copilot} review comment(s) on Copilot code`} arrow>
          <Chip icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} label={review_comments_on_copilot} size="small" sx={{ bgcolor: 'rgba(255,171,64,0.08)', color: '#ffab40', fontWeight: 700, fontSize: '0.7rem', height: 24, '& .MuiChip-icon': { color: '#ffab40' } }} />
        </Tooltip>
      )}
      {!failed_checks && !reverted_lines && !review_comments_on_copilot && (
        <Typography variant="caption" sx={{ color: '#00e676', fontWeight: 600, fontSize: '0.7rem' }}>✓ Clean</Typography>
      )}
    </Box>
  );
}

function RiskBadge({ score }: { score: number }) {
  const label = riskLabel(score);
  const color = riskColor(score);
  return (
    <Tooltip title={`Risk score: ${(score * 100).toFixed(1)}% — based on rejection rate, CI failures, and reverted lines`} arrow>
      <Chip label={label} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24, minWidth: 64, bgcolor: `${color}18`, color, border: `1px solid ${color}33` }} />
    </Tooltip>
  );
}

function CopilotContribution({ analysis }: { analysis: PullRequestResponse['analysis'] }) {
  if (!analysis) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const { estimated_copilot_lines, estimated_accepted_lines, estimated_rejected_lines } = analysis;
  const rate = estimated_copilot_lines > 0 ? Math.round((estimated_accepted_lines / estimated_copilot_lines) * 100) : 0;
  return (
    <Tooltip title={<Box sx={{ fontSize: '0.78rem', lineHeight: 1.8 }}><div><strong>Copilot:</strong> {formatNum(estimated_copilot_lines)} lines suggested</div><div>✔ <strong>Accepted:</strong> {formatNum(estimated_accepted_lines)}</div><div>✖ <strong>Rejected:</strong> {formatNum(estimated_rejected_lines)}</div><div>📊 <strong>Acceptance Rate:</strong> {rate}%</div></Box>} arrow placement="left">
      <Box sx={{ minWidth: 130 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
          <AutoAwesomeIcon sx={{ fontSize: 13, color: '#00d4ff' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#00d4ff', fontSize: '0.72rem' }}>{formatNum(estimated_copilot_lines)} lines</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#00e676', fontSize: '0.68rem', fontWeight: 600 }}>✔ {formatNum(estimated_accepted_lines)}</Typography>
          <Typography variant="caption" sx={{ color: '#ff5252', fontSize: '0.68rem', fontWeight: 600 }}>✖ {formatNum(estimated_rejected_lines)}</Typography>
        </Box>
        <Box sx={{ mt: 0.4, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <Box sx={{ width: `${rate}%`, height: '100%', borderRadius: 2, background: rate > 80 ? 'linear-gradient(90deg, #00e676, #00c853)' : rate > 60 ? 'linear-gradient(90deg, #ffab40, #ff9800)' : 'linear-gradient(90deg, #ff5252, #d32f2f)', transition: 'width 0.4s ease' }} />
          </Box>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, minWidth: 28, color: rate > 80 ? '#00e676' : rate > 60 ? '#ffab40' : '#ff5252' }}>{rate}%</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

function ExpandableRow({ pr }: { pr: PullRequestResponse }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const analysis = pr.analysis;
  const riskScore = analysis?.risk_score || 0;
  const copilotLines = analysis?.estimated_copilot_lines || 0;
  const humanLines = Math.max(0, (pr.lines_added || 0) - copilotLines);

  return (
    <>
      <TableRow sx={{ '&:hover': { bgcolor: 'rgba(0,212,255,0.04)' }, transition: 'background-color 0.15s', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <TableCell sx={{ width: 40, p: 0.5 }}>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>#{pr.number}</TableCell>
        <TableCell sx={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.title}</TableCell>
        <TableCell><Chip label={pr.author || 'unknown'} size="small" variant="outlined" sx={{ borderRadius: 2, fontSize: '0.72rem' }} /></TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>+{formatNum(pr.lines_added)}</TableCell>
        <TableCell align="center"><Chip label={pr.state} size="small" color={stateColors[pr.state] || 'default'} sx={{ fontWeight: 600, minWidth: 64, fontSize: '0.72rem' }} /></TableCell>
        <TableCell><CopilotContribution analysis={analysis} /></TableCell>
        <TableCell sx={{ minWidth: 120 }}><CodeOwnershipBar copilotLines={copilotLines} humanLines={humanLines} /></TableCell>
        <TableCell><QualitySignals analysis={analysis} /></TableCell>
        <TableCell align="center"><RiskBadge score={riskScore} /></TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ p: 0, border: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <InsertDriveFileOutlinedIcon sx={{ fontSize: 18 }} /> File-Level Breakdown
              </Typography>
              {pr.files && pr.files.length > 0 ? (
                <Table size="small" sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                  <TableHead>
                    <TableRow>
                      {['File', 'Lines', 'Copilot vs Human', 'Status'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }} align={h === 'Lines' ? 'right' : h === 'Status' ? 'center' : 'left'}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pr.files.map((f) => (
                      <TableRow key={f.id} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><CodeIcon sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{f.filename}</Typography></Box></TableCell>
                        <TableCell align="right"><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>+{f.lines_added}</Typography></TableCell>
                        <TableCell sx={{ minWidth: 160 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                              <Tooltip title={`Copilot: ${f.copilot_lines} lines (${f.copilot_pct.toFixed(1)}%)`} arrow>
                                <Box sx={{ width: `${Math.min(f.copilot_pct, 100)}%`, bgcolor: '#00d4ff', transition: 'width 0.3s' }} />
                              </Tooltip>
                              <Tooltip title={`Human: ${f.human_lines} lines`} arrow>
                                <Box sx={{ flex: 1, bgcolor: '#4a5568' }} />
                              </Tooltip>
                            </Box>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#00d4ff', fontWeight: 700, minWidth: 32 }}>{Math.min(f.copilot_pct, 100).toFixed(0)}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={f.status} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: f.status === 'merged' ? 'rgba(0,230,118,0.1)' : f.status === 'accepted' ? 'rgba(0,212,255,0.1)' : 'rgba(255,171,64,0.1)', color: f.status === 'merged' ? '#00e676' : f.status === 'accepted' ? '#00d4ff' : '#ffab40' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <Typography variant="body2" color="text.secondary">No file-level data available.</Typography>}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>Timeline:</Typography>
                {['Suggested', 'Accepted', 'Modified', pr.state === 'merged' ? 'Merged' : pr.state].map((step, i) => (
                  <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip label={step} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(0,212,255,0.08)', color: '#00d4ff', fontWeight: 600 }} />
                    {i < 3 && <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>→</Typography>}
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const COPILOT_RANGES = [
  { label: 'All', min: null as number | null, max: null as number | null },
  { label: '0 – 25%', min: 0, max: 25 },
  { label: '25 – 50%', min: 25, max: 50 },
  { label: '50 – 75%', min: 50, max: 75 },
  { label: '75 – 100%', min: 75, max: 100 },
];

export default function PRInsightsPage() {
  const [prs, setPrs] = useState<PullRequestResponse[]>([]);
  const [summary, setSummary] = useState<PRInsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [copilotRange, setCopilotRange] = useState(0);
  const [authorFilter, setAuthorFilter] = useState('');

  useEffect(() => {
    Promise.all([getPullRequests({ limit: 200 }), getPRInsightsSummary()])
      .then(([prRes, sumRes]) => { setPrs(prRes); setSummary(sumRes); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const authors = useMemo(() => Array.from(new Set(prs.map((p) => p.author).filter(Boolean))).sort() as string[], [prs]);

  const filtered = useMemo(() => {
    let result = prs;
    if (search) { const q = search.toLowerCase(); result = result.filter((p) => (p.title || '').toLowerCase().includes(q) || (p.author || '').toLowerCase().includes(q)); }
    if (statusFilter) result = result.filter((p) => p.state === statusFilter);
    if (authorFilter) result = result.filter((p) => p.author === authorFilter);
    if (riskFilter) result = result.filter((p) => { const s = p.analysis?.risk_score || 0; if (riskFilter === 'low') return s < 0.3; if (riskFilter === 'medium') return s >= 0.3 && s < 0.6; if (riskFilter === 'high') return s >= 0.6; return true; });
    const range = COPILOT_RANGES[copilotRange];
    if (range.min !== null || range.max !== null) result = result.filter((p) => { const pct = p.analysis?.copilot_contribution_pct || 0; if (range.min !== null && pct < range.min) return false; if (range.max !== null && pct > range.max) return false; return true; });
    return result;
  }, [prs, search, statusFilter, authorFilter, riskFilter, copilotRange]);

  const insightStats = useMemo(() => {
    const merged = prs.filter((p) => p.state === 'merged' && p.created_at && p.merged_at);
    const aiMerged = merged.filter(isAIAgentPR);
    const humanMerged = merged.filter((p) => !isAIAgentPR(p));
    const avg = (list: PullRequestResponse[]) => { const vals = list.map(getMergeHours).filter((v) => v !== null) as number[]; if (!vals.length) return null; return vals.reduce((a, c) => a + c, 0) / vals.length; };
    const aiAvg = avg(aiMerged); const humanAvg = avg(humanMerged);
    const velocityGainPct = humanAvg && aiAvg !== null ? ((humanAvg - aiAvg) / humanAvg) * 100 : null;
    const aiCount = prs.filter(isAIAgentPR).length;
    const humanCount = Math.max(0, prs.length - aiCount);
    let aiLines = 0; let humanLines = 0;
    prs.forEach((p) => { const c = p.analysis?.estimated_accepted_lines || 0; const t = p.lines_added || 0; aiLines += c; humanLines += Math.max(0, t - c); });
    return { aiAvg, humanAvg, velocityGainPct, aiCount, humanCount, aiLines, humanLines };
  }, [prs]);

  const headerCellSx = { fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', bgcolor: 'rgba(0,0,0,0.15)', borderBottom: '2px solid rgba(0,212,255,0.12)' };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={260} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}><Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">Failed to load PR data: {error}</Alert>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          PR Insights for {summary?.primary_repo_name || 'Repository'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          AI vs Human pull request efficiency, adoption, and review friction
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>AI vs Human PRs</Typography>
              <Box sx={{ height: 150, width: '100%', mt: 1 }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={[{ name: 'AI Generated', value: insightStats.aiCount }, { name: 'Human Generated', value: insightStats.humanCount }]} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" stroke="none">
                      <Cell fill="#00d4ff" /><Cell fill="#4a5568" />
                    </Pie>
                    <RechartsTooltip formatter={(value: unknown) => [formatNum(value as number), 'PRs']} contentStyle={{ background: '#0f1724', border: '1px solid rgba(0,212,255,0.3)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                {formatNum(insightStats.aiCount)} AI Generated vs {formatNum(insightStats.humanCount)} Human Generated PRs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Lines of Code (AI vs Human)</Typography>
              <Box sx={{ height: 150, width: '100%', mt: 1 }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={[{ name: 'AI Generated Lines', value: insightStats.aiLines }, { name: 'Human Generated Lines', value: insightStats.humanLines }]} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" stroke="none">
                      <Cell fill="#00e676" /><Cell fill="#ffab40" />
                    </Pie>
                    <RechartsTooltip formatter={(value: unknown) => [formatNum(value as number), 'Lines']} contentStyle={{ background: '#0f1724', border: '1px solid rgba(0,230,118,0.3)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                {formatNum(insightStats.aiLines)} AI Lines vs {formatNum(insightStats.humanLines)} Human Lines
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><SummaryCard title="Total PRs" value={formatNum(summary.total_prs)} icon={<ShieldIcon sx={{ color: '#9aa0a6', fontSize: 22 }} />} color="#e8eaed" /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><SummaryCard title="Avg Copilot %" value={`${summary.avg_copilot_contribution_pct}%`} icon={<PeopleIcon sx={{ color: '#00d4ff', fontSize: 22 }} />} color="#00d4ff" /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><SummaryCard title="Avg Lines Added" value={formatNum(summary.avg_lines_added)} icon={<AutoAwesomeIcon sx={{ color: '#00d4ff', fontSize: 22 }} />} color="#00d4ff" /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><SummaryCard title="High Risk PRs" value={formatNum(summary.high_risk_prs)} icon={<BugReportIcon sx={{ color: '#ff5252', fontSize: 22 }} />} color={summary.high_risk_prs > 5 ? '#ff5252' : '#ffab40'} subtitle="Risk score ≥ 0.6" /></Grid>
        </Grid>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 0.5 }} />
            <TextField size="small" placeholder="Search title or author…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }}
              sx={{ minWidth: 220, flex: '1 1 220px', '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' } }}
            />
            {[
              { label: 'Status', value: statusFilter, onChange: (v: string) => { setStatusFilter(v); setPage(0); }, options: [{ v: '', l: 'All' }, { v: 'merged', l: 'Merged' }, { v: 'open', l: 'Open' }, { v: 'closed', l: 'Closed' }], width: 120 },
              { label: 'Risk', value: riskFilter, onChange: (v: string) => { setRiskFilter(v); setPage(0); }, options: [{ v: '', l: 'All' }, { v: 'low', l: '🟢 Low' }, { v: 'medium', l: '🟡 Medium' }, { v: 'high', l: '🔴 High' }], width: 110 },
            ].map(({ label, value, onChange, options, width }) => (
              <FormControl key={label} size="small" sx={{ minWidth: width }}>
                <InputLabel sx={{ fontSize: '0.8rem' }}>{label}</InputLabel>
                <Select value={value} label={label} onChange={(e) => onChange(e.target.value)} sx={{ borderRadius: 2.5, fontSize: '0.85rem', bgcolor: 'rgba(255,255,255,0.03)' }}>
                  {options.map((o) => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                </Select>
              </FormControl>
            ))}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '0.8rem' }}>Copilot %</InputLabel>
              <Select value={copilotRange} label="Copilot %" onChange={(e) => { setCopilotRange(Number(e.target.value)); setPage(0); }} sx={{ borderRadius: 2.5, fontSize: '0.85rem', bgcolor: 'rgba(255,255,255,0.03)' }}>
                {COPILOT_RANGES.map((r, i) => <MenuItem key={i} value={i}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: '0.8rem' }}>Developer</InputLabel>
              <Select value={authorFilter} label="Developer" onChange={(e) => { setAuthorFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2.5, fontSize: '0.85rem', bgcolor: 'rgba(255,255,255,0.03)' }}>
                <MenuItem value="">All</MenuItem>
                {authors.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto', fontWeight: 600 }}>
              {filtered.length} PR{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, width: 40, p: 0.5 }} />
                  {['PR #', 'Title', 'Author', 'Lines', 'Status', 'Copilot Contribution', 'Code Ownership', 'Quality Signals', 'Risk'].map((h) => (
                    <TableCell key={h} sx={headerCellSx} align={h === 'Lines' || h === 'Status' || h === 'Risk' ? 'center' : 'left'}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pr) => <ExpandableRow key={pr.id} pr={pr} />)}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><Typography variant="body2" color="text.secondary">No pull requests match the current filters.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div" count={filtered.length} page={page} rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 15, 25, 50]}
            sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

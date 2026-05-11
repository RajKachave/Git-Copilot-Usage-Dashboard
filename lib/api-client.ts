// API client – mirrors frontend/src/api/client.js, targeting Next.js API routes

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

// ── Auth ─────────────────────────────────────────────────────
export const getAuthStatus = () => request<import('@/types').AuthStatusResponse>('/auth/status');
export const configureAuth = (data: import('@/types').AuthConfigRequest) =>
  request<import('@/types').AuthStatusResponse>('/auth/configure', { method: 'POST', body: JSON.stringify(data) });

// ── Repos ────────────────────────────────────────────────────
export const getRepos = () => request<import('@/types').RepositoryResponse[]>('/repos');
export const triggerSync = () => request<import('@/types').SyncResponse>('/repos/sync', { method: 'POST' });

// ── Metrics ──────────────────────────────────────────────────
export const getCopilotMetrics = (params?: { from?: string; to?: string }) =>
  request<import('@/types').CopilotMetricResponse[]>(`/metrics/copilot${buildQuery(params)}`);
export const getUsageMetrics = () => request<Record<string, unknown>>('/metrics/usage');
export const importNdjsonMetrics = (formData: FormData) =>
  fetch(`${API_BASE}/metrics/import-ndjson`, { method: 'POST', body: formData }).then(r => r.json());

// ── Pull Requests ────────────────────────────────────────────
export const getPullRequests = (params?: { limit?: number }) =>
  request<import('@/types').PullRequestResponse[]>(`/prs${buildQuery(params)}`);
export const getPRAnalysis = (id: number) =>
  request<import('@/types').PRAnalysisResponse>(`/prs/${id}/analysis`);
export const getPRInsightsSummary = () =>
  request<import('@/types').PRInsightsSummary>('/prs/insights-summary');
export const getPRMetricsInsights = () =>
  request<import('@/types').PRMetricsInsightsResponse>('/prs/metrics-insights');
export const getPRFiles = (id: number) =>
  request<import('@/types').PRFileAnalysisResponse[]>(`/prs/${id}/files`);

// ── Dashboard ────────────────────────────────────────────────
export const getDashboardSummary = () =>
  request<import('@/types').DashboardSummary>('/dashboard/summary');
export const getDashboardTrends = () =>
  request<import('@/types').DashboardTrends>('/dashboard/trends');
export const getFeatureUsageDashboard = () =>
  request<import('@/types').FeatureUsageDashboardResponse>('/dashboard/feature-usage');
export const getUsersUsageDashboard = () =>
  request<import('@/types').UserUsageDashboardResponse>('/dashboard/users-usage');
export const getUserUsageDetail = (userLogin: string) =>
  request<import('@/types').UserUsageDetailResponse>(`/dashboard/users-usage/${encodeURIComponent(userLogin)}`);

// ── Health ───────────────────────────────────────────────────
export const getHealth = () => request<{ status: string }>('/health');

// ── Repo Settings ─────────────────────────────────────────────
export const getRepoSettings = (orgName: string) =>
  request<import('@/types').RepoSettingsResponse>(`/settings/repos${buildQuery({ org_name: orgName })}`);
export const saveRepoSettings = (data: { org_name: string; repo_names: string[] }) =>
  request<import('@/types').RepoSettingsResponse>('/settings/repos', { method: 'POST', body: JSON.stringify(data) });

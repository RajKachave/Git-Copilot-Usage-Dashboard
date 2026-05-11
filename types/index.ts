// ── Auth ──────────────────────────────────────────────────────────────────

export interface AuthStatusResponse {
  configured: boolean;
  org_name?: string;
  token_valid: boolean;
  user_login?: string;
  stale_repo_owners: string[];
  stale_repo_warning?: string;
}

export interface AuthConfigRequest {
  github_pat: string;
  github_org: string;
}

// ── Repository ────────────────────────────────────────────────────────────

export interface RepositoryResponse {
  id: number;
  github_id?: number;
  name: string;
  full_name: string;
  owner: string;
  description?: string;
  language?: string;
  created_at?: string;
  last_synced_at?: string;
}

export interface SyncResponse {
  status: string;
  message: string;
  repos_synced?: number;
  commits_synced?: number;
  prs_synced?: number;
}

// ── Copilot Metrics ───────────────────────────────────────────────────────

export interface CopilotMetricResponse {
  id: number;
  org_name: string;
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  total_engaged_users_agent: number;
  total_code_suggestions: number;
  total_code_acceptances: number;
  total_lines_suggested: number;
  total_lines_accepted: number;
  total_chats: number;
  total_chat_insertions: number;
  total_chat_copies: number;
  total_pr_summaries: number;
  language_breakdown?: Record<string, unknown>[];
  editor_breakdown?: Record<string, unknown>[];
}

export interface NDJSONImportResponse {
  status: string;
  message: string;
  total_records: number;
  inserted_records: number;
  skipped_existing_records: number;
  invalid_records: number;
  duplicate_records: number;
  imported_dates: string[];
}

// ── Pull Requests ─────────────────────────────────────────────────────────

export interface PRAnalysisResponse {
  estimated_copilot_lines: number;
  estimated_accepted_lines: number;
  estimated_rejected_lines: number;
  copilot_contribution_pct: number;
  failed_checks: number;
  total_checks: number;
  reverted_lines: number;
  review_comments_on_copilot: number;
  risk_score: number;
}

export interface PRFileAnalysisResponse {
  id: number;
  filename: string;
  lines_added: number;
  copilot_lines: number;
  human_lines: number;
  copilot_pct: number;
  status: string;
}

export interface PullRequestResponse {
  id: number;
  number: number;
  title: string;
  state: string;
  author?: string;
  lines_added: number;
  lines_deleted: number;
  created_at?: string;
  merged_at?: string;
  closed_at?: string;
  analysis?: PRAnalysisResponse;
  files?: PRFileAnalysisResponse[];
  repo?: string;
}

export interface PRInsightsSummary {
  total_prs: number;
  merged_prs: number;
  open_prs: number;
  avg_lines_added: number;
  avg_copilot_contribution_pct: number;
  high_risk_prs: number;
  primary_repo_name?: string;
}

export interface VelocityGap {
  ai_median_merge_time_mins: number;
  human_median_merge_time_mins: number;
  velocity_gain_pct: number;
}

export interface VolumeSplit {
  ai_managed_prs: number;
  human_managed_prs: number;
  total_prs: number;
  ai_pct: number;
}

export interface PRMetricsInsightsResponse {
  velocity_gap: VelocityGap;
  volume_split: VolumeSplit;
  bottom_cards: Record<string, number>;
  daily_trends: Record<string, unknown>[];
  top_features: Record<string, unknown>[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_repos: number;
  primary_repo_name: string;
  total_commits: number;
  total_prs: number;
  active_contributors: number;
  total_lines_suggested: number;
  total_lines_accepted: number;
  estimated_human_lines: number;
  acceptance_rate: number;
  total_active_users: number;
  total_engaged_users: number;
  total_suggestions: number;
  total_chats: number;
}

export interface TrendEntry {
  date: string;
  lines_suggested: number;
  lines_accepted: number;
  acceptance_rate: number;
  active_users: number;
  suggestions_count: number;
  chats_count: number;
}

export interface LanguageStat {
  name: string;
  total_lines_suggested: number;
  total_lines_accepted: number;
}

export interface EditorStat {
  name: string;
  total_engaged_users: number;
}

export interface DashboardTrends {
  trends: TrendEntry[];
  languages: LanguageStat[];
  editors: EditorStat[];
}

// ── Feature Usage ─────────────────────────────────────────────────────────

export interface FeatureSummary {
  total_interactions: number;
  total_generations: number;
  overall_acceptance_rate: number;
  overall_line_acceptance_rate: number;
  agent_interaction_share: number;
  top_feature?: string;
  top_feature_share?: number;
}

export interface FeatureItem {
  feature: string;
  total_interactions: number;
  total_generations: number;
  total_acceptances: number;
  total_suggested_lines: number;
  total_accepted_lines: number;
  acceptance_rate: number;
  interaction_share: number;
}

export interface ModelItem {
  name: string;
  total_suggestions: number;
  total_acceptances: number;
  total_chats: number;
  share: number;
}

export interface ModeItem {
  mode: string;
  total_interactions: number;
  total_generations: number;
  total_acceptances: number;
  share: number;
}

export interface FeatureTrendEntry {
  date: string;
  feature: string;
  interactions: number;
}

export interface FeatureUsageDashboardResponse {
  summary: FeatureSummary;
  features: FeatureItem[];
  models: ModelItem[];
  modes: ModeItem[];
  trends: FeatureTrendEntry[];
}

// ── Users Usage ───────────────────────────────────────────────────────────

export interface UserUsageItem {
  user_login: string;
  total_interactions: number;
  total_skill_interactions: number;
  total_agent_interactions: number;
  total_builtin_agent_interactions: number;
  total_extension_agent_interactions: number;
  total_agent_edit_lines: number;
  agent_impact: number;
  total_suggested_lines: number;
  total_accepted_lines: number;
  line_acceptance_rate: number;
  interaction_share: number;
}

export interface UsersDashboardSummary {
  total_users: number;
  total_interactions: number;
  total_generations: number;
  total_acceptances: number;
  total_suggested_lines: number;
  total_accepted_lines: number;
  overall_acceptance_rate: number;
  // Extended fields from users report
  total_active_days?: number;
  total_agent_edit_lines?: number;
  total_lines_changed?: number;
  overall_agent_impact?: number;
  total_skill_interactions?: number;
  total_agent_interactions?: number;
  total_builtin_agent_interactions?: number;
  total_extension_agent_interactions?: number;
  total_engaged_users_agent?: number;
  overall_line_acceptance_rate?: number;
}

export interface UserUsageDashboardResponse {
  summary: UsersDashboardSummary;
  users: UserUsageItem[];
  trend: Record<string, unknown>[];
}

export interface DailyUserUsage {
  date: string;
  interactions: number;
  generations: number;
  acceptances: number;
  suggested_lines: number;
  accepted_lines: number;
}

export interface UserUsageDetailSummary {
  total_interactions: number;
  total_generations: number;
  total_acceptances: number;
  total_active_days: number;
  peak_daily_interactions: number;
  peak_interactions_date?: string;
  average_daily_interactions: number;
  interaction_share: number;
  total_suggested_lines: number;
  total_accepted_lines: number;
}

export interface UserUsageDetailResponse {
  user_login: string;
  summary: UserUsageDetailSummary;
  daily: DailyUserUsage[];
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface RepoSettingsResponse {
  org_name: string;
  repo_names: string[];
}

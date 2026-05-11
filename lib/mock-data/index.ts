// Mock data generator – mirrors Python backend/app/services/mock_data.py logic

const LANGUAGES = ['python', 'typescript', 'javascript', 'go', 'ruby', 'java', 'rust', 'cpp'];
const EDITORS = ['vscode', 'neovim', 'jetbrains', 'xcode'];
const AUTHORS = [
  'alice-dev', 'bob-coder', 'charlie-eng', 'diana-ops',
  'elena-fe', 'frank-be', 'grace-ml', 'henry-devops',
  'iris-sec', 'jack-data',
];
const REPO_NAMES: [string, string][] = [
  ['acme-corp', 'web-platform'],
  ['acme-corp', 'api-gateway'],
  ['acme-corp', 'ml-pipeline'],
  ['acme-corp', 'mobile-app'],
  ['acme-corp', 'infra-tools'],
  ['acme-corp', 'data-service'],
];
const FILE_TEMPLATES: Record<string, string[]> = {
  python: ['app/{}.py', 'services/{}.py', 'utils/{}.py', 'tests/test_{}.py', 'models/{}.py'],
  typescript: ['src/{}.ts', 'src/components/{}.tsx', 'src/hooks/use{}.ts', 'tests/{}.test.ts'],
  javascript: ['src/{}.js', 'src/components/{}.jsx', 'lib/{}.js', 'tests/{}.spec.js'],
  go: ['cmd/{}.go', 'internal/{}.go', 'pkg/{}.go', 'handler/{}.go'],
};
const FILE_NAME_PARTS = [
  'auth', 'users', 'dashboard', 'api', 'config', 'cache',
  'logger', 'parser', 'handler', 'worker', 'scheduler',
  'validator', 'formatter', 'router', 'middleware', 'service',
];
const PR_TITLES = [
  'Add user authentication flow', 'Implement caching layer', 'Fix memory leak in worker',
  'Update API rate limiting', 'Refactor database queries', 'Add monitoring dashboard',
  'Improve error handling', 'Migrate to new SDK version',
];
const COMMIT_MESSAGES = [
  'feat: add new feature module', 'fix: resolve edge case in parser',
  'refactor: clean up service layer', 'chore: update dependencies',
  'docs: improve API documentation', 'perf: optimize query performance',
  'test: add unit tests for auth', 'style: format code with prettier',
];

// Seeded PRNG for deterministic output
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0x80000000;
  };
}

const rng = seededRand(42);
const rand = () => rng();
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => rand() * (max - min) + min;
const sample = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
};
const choice = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function computeRiskScore(rejected: number, suggested: number, failedChecks: number, totalChecks: number, reverted: number, totalLines: number): number {
  const rejectionRatio = suggested > 0 ? rejected / suggested : 0;
  const checkFailureRatio = totalChecks > 0 ? failedChecks / totalChecks : 0;
  const revertRatio = totalLines > 0 ? reverted / totalLines : 0;
  const score = rejectionRatio * 0.4 + checkFailureRatio * 0.35 + revertRatio * 0.25;
  return Math.round(Math.min(score, 1.0) * 1000) / 1000;
}

// ── Generated mock data (computed once) ───────────────────────────────────

export interface MockRepo {
  id: number;
  github_id: number;
  name: string;
  full_name: string;
  owner: string;
  description: string;
  language: string;
  created_at: string;
  last_synced_at: string;
}

export interface MockMetric {
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
  language_breakdown: Record<string, unknown>[];
  editor_breakdown: Record<string, unknown>[];
}

export interface MockPR {
  id: number;
  number: number;
  title: string;
  state: string;
  author: string;
  lines_added: number;
  lines_deleted: number;
  created_at: string;
  merged_at: string | null;
  repo: string;
  analysis: {
    estimated_copilot_lines: number;
    estimated_accepted_lines: number;
    estimated_rejected_lines: number;
    copilot_contribution_pct: number;
    failed_checks: number;
    total_checks: number;
    reverted_lines: number;
    review_comments_on_copilot: number;
    risk_score: number;
  };
  files: {
    id: number;
    filename: string;
    lines_added: number;
    copilot_lines: number;
    human_lines: number;
    copilot_pct: number;
    status: string;
  }[];
}

function generateRepos(): MockRepo[] {
  return REPO_NAMES.map(([owner, name], i) => ({
    id: i + 1,
    github_id: 100000 + i,
    name,
    full_name: `${owner}/${name}`,
    owner,
    description: `Mock repo: ${name}`,
    language: LANGUAGES[i % 4],
    created_at: new Date(Date.now() - 1000 * 86400 * 365).toISOString(),
    last_synced_at: new Date().toISOString(),
  }));
}

function generateMetrics(): MockMetric[] {
  const metrics: MockMetric[] = [];
  for (let dayOffset = 60; dayOffset >= 1; dayOffset--) {
    const baseUsers = randInt(15, 30);
    const engaged = Math.floor(baseUsers * randFloat(0.6, 0.9));
    const suggestions = randInt(400, 1200);
    const acceptances = Math.floor(suggestions * randFloat(0.4, 0.7));
    const linesSuggested = Math.floor(suggestions * randFloat(1.5, 3.0));
    const linesAccepted = Math.floor(linesSuggested * randFloat(0.35, 0.65));

    const langBreakdown = sample(LANGUAGES, randInt(3, 6)).map(lang => {
      const ls = randInt(30, 200);
      const la = Math.floor(ls * randFloat(0.4, 0.7));
      return {
        name: lang,
        total_engaged_users: randInt(2, 10),
        total_code_suggestions: ls,
        total_code_acceptances: la,
        total_code_lines_suggested: Math.floor(ls * randFloat(1.5, 2.5)),
        total_code_lines_accepted: Math.floor(la * randFloat(0.35, 0.65)),
      };
    });

    const editorBreakdown = sample(EDITORS, randInt(2, 4)).map(editor => ({
      name: editor,
      total_engaged_users: randInt(3, 15),
      models: [],
    }));

    metrics.push({
      id: 61 - dayOffset,
      org_name: 'acme-corp',
      date: dateStr(dayOffset),
      total_active_users: baseUsers,
      total_engaged_users: engaged,
      total_engaged_users_agent: randInt(2, 8),
      total_code_suggestions: suggestions,
      total_code_acceptances: acceptances,
      total_lines_suggested: linesSuggested,
      total_lines_accepted: linesAccepted,
      total_chats: randInt(10, 80),
      total_chat_insertions: randInt(5, 40),
      total_chat_copies: randInt(3, 25),
      total_pr_summaries: randInt(2, 15),
      language_breakdown: langBreakdown,
      editor_breakdown: editorBreakdown,
    });
  }
  return metrics;
}

function generateFileAnalyses(prId: number, linesAdded: number, copilotLines: number, language: string) {
  const lang = FILE_TEMPLATES[language] ? language : 'python';
  const templates = FILE_TEMPLATES[lang];
  const numFiles = randInt(2, Math.min(6, Math.max(2, Math.floor(linesAdded / 30))));
  const files = [];
  let remainingTotal = linesAdded;
  let remainingCopilot = copilotLines;

  for (let i = 0; i < numFiles; i++) {
    const isLast = i === numFiles - 1;
    const namePart = choice(FILE_NAME_PARTS);
    const template = choice(templates);
    const filename = template.replace('{}', namePart);

    let fileLines: number, fileCopilot: number;
    if (isLast) {
      fileLines = remainingTotal;
      fileCopilot = remainingCopilot;
    } else {
      fileLines = Math.max(1, Math.min(
        randInt(Math.max(1, Math.floor(remainingTotal / (numFiles - i) / 2)), Math.max(2, Math.floor(remainingTotal / (numFiles - i) * 2))),
        remainingTotal - (numFiles - i - 1)
      ));
      fileCopilot = Math.min(Math.floor(fileLines * randFloat(0.15, 0.75)), remainingCopilot);
    }

    remainingTotal = Math.max(0, remainingTotal - fileLines);
    remainingCopilot = Math.max(0, remainingCopilot - fileCopilot);

    const fileHuman = Math.max(0, fileLines - fileCopilot);
    const filePct = fileLines > 0 ? Math.round((fileCopilot / fileLines) * 1000) / 10 : 0;
    const status = choice(['merged', 'merged', 'merged', 'modified', 'accepted']);

    files.push({
      id: prId * 10 + i,
      filename,
      lines_added: fileLines,
      copilot_lines: fileCopilot,
      human_lines: fileHuman,
      copilot_pct: filePct,
      status,
    });
  }
  return files;
}

function generatePRs(repos: MockRepo[]): MockPR[] {
  const prs: MockPR[] = [];
  let prCounter = 1;
  for (const repo of repos) {
    for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
      if (rand() < 0.4) continue;
      const author = choice(AUTHORS);
      const linesAdded = randInt(20, 500);
      const linesDeleted = randInt(5, Math.floor(linesAdded * 0.4));
      const stateIdx = Math.floor(rand() * 5);
      const state = ['open', 'closed', 'merged', 'merged', 'merged'][stateIdx];
      const mergedAt = state === 'merged' ? dateStr(dayOffset) : null;
      const createdAt = dateStr(dayOffset + randInt(0, 3));

      const copilotPct = randFloat(0.2, 0.6);
      const copilotLines = Math.floor(linesAdded * copilotPct);
      const accepted = Math.floor(copilotLines * randFloat(0.7, 0.95));
      const rejected = copilotLines - accepted;

      const totalChecks = randInt(3, 10);
      const failedWeights = [40, 20, 15, 10, 8, 4, 2, 1];
      const failedRand = rand() * failedWeights.reduce((a, b) => a + b, 0);
      let cumWeight = 0;
      let failedChecks = 0;
      for (let fi = 0; fi < [0, 0, 1, 1, 2, 3, 4, 5].length; fi++) {
        cumWeight += failedWeights[fi];
        if (failedRand <= cumWeight) { failedChecks = [0, 0, 1, 1, 2, 3, 4, 5][fi]; break; }
      }

      const revertedLines = state === 'merged' && rand() < 0.15
        ? randInt(1, Math.max(1, Math.floor(linesAdded * 0.12))) : 0;
      const reviewComments = Math.floor(rand() * 6);

      const riskScore = computeRiskScore(rejected, copilotLines, failedChecks, totalChecks, revertedLines, linesAdded);

      const files = generateFileAnalyses(prCounter, linesAdded, copilotLines, repo.language);

      prs.push({
        id: prCounter,
        number: prCounter,
        title: choice(PR_TITLES),
        state,
        author,
        lines_added: linesAdded,
        lines_deleted: linesDeleted,
        created_at: createdAt,
        merged_at: mergedAt,
        repo: repo.full_name,
        analysis: {
          estimated_copilot_lines: copilotLines,
          estimated_accepted_lines: accepted,
          estimated_rejected_lines: rejected,
          copilot_contribution_pct: Math.round(copilotPct * 10000) / 100,
          failed_checks: failedChecks,
          total_checks: totalChecks,
          reverted_lines: revertedLines,
          review_comments_on_copilot: reviewComments,
          risk_score: riskScore,
        },
        files,
      });
      prCounter++;
    }
  }
  return prs;
}

// Singleton mock DB
let _repos: MockRepo[] | null = null;
let _metrics: MockMetric[] | null = null;
let _prs: MockPR[] | null = null;

export function getMockRepos(): MockRepo[] {
  if (!_repos) _repos = generateRepos();
  return _repos;
}

export function getMockMetrics(): MockMetric[] {
  if (!_metrics) _metrics = generateMetrics();
  return _metrics;
}

export function getMockPRs(): MockPR[] {
  if (!_prs) {
    const repos = getMockRepos();
    _prs = generatePRs(repos);
  }
  return _prs;
}

// ── Analytics helpers ─────────────────────────────────────────────────────

export function computeDashboardSummary() {
  const metrics = getMockMetrics();
  const repos = getMockRepos();
  const prs = getMockPRs();

  const totalLinesSuggested = metrics.reduce((s, m) => s + m.total_lines_suggested, 0);
  const totalLinesAccepted = metrics.reduce((s, m) => s + m.total_lines_accepted, 0);
  const totalSuggestions = metrics.reduce((s, m) => s + m.total_code_suggestions, 0);
  const totalChats = metrics.reduce((s, m) => s + m.total_chats, 0);
  const latestMetric = metrics[metrics.length - 1];

  const uniqueAuthors = new Set(prs.map(p => p.author));

  const acceptanceRate = totalLinesSuggested > 0
    ? Math.round((totalLinesAccepted / totalLinesSuggested) * 10000) / 100 : 0;

  // estimate human lines from PRs total lines - copilot accepted
  const totalPRLines = prs.reduce((s, p) => s + p.lines_added, 0);
  const estimatedHumanLines = Math.max(0, totalPRLines - totalLinesAccepted);

  return {
    total_repos: repos.length,
    primary_repo_name: repos[0]?.full_name ?? '',
    total_commits: prs.length * 3, // approximate
    total_prs: prs.length,
    active_contributors: uniqueAuthors.size,
    total_lines_suggested: totalLinesSuggested,
    total_lines_accepted: totalLinesAccepted,
    estimated_human_lines: estimatedHumanLines,
    acceptance_rate: acceptanceRate,
    total_active_users: latestMetric?.total_active_users ?? 0,
    total_engaged_users: latestMetric?.total_engaged_users ?? 0,
    total_suggestions: totalSuggestions,
    total_chats: totalChats,
  };
}

export function computeDashboardTrends() {
  const metrics = getMockMetrics();

  const trends = metrics.map(m => ({
    date: m.date,
    lines_suggested: m.total_lines_suggested,
    lines_accepted: m.total_lines_accepted,
    acceptance_rate: m.total_lines_suggested > 0
      ? Math.round((m.total_lines_accepted / m.total_lines_suggested) * 10000) / 100 : 0,
    active_users: m.total_active_users,
    suggestions_count: m.total_code_suggestions,
    chats_count: m.total_chats,
  }));

  // Aggregate language stats across all metrics
  const langMap = new Map<string, { total_lines_suggested: number; total_lines_accepted: number }>();
  for (const m of metrics) {
    for (const lb of (m.language_breakdown as { name: string; total_code_lines_suggested: number; total_code_lines_accepted: number }[])) {
      const entry = langMap.get(lb.name) ?? { total_lines_suggested: 0, total_lines_accepted: 0 };
      entry.total_lines_suggested += lb.total_code_lines_suggested ?? 0;
      entry.total_lines_accepted += lb.total_code_lines_accepted ?? 0;
      langMap.set(lb.name, entry);
    }
  }
  const languages = Array.from(langMap.entries())
    .map(([name, vals]) => ({ name, ...vals }))
    .sort((a, b) => b.total_lines_suggested - a.total_lines_suggested);

  // Aggregate editor stats
  const editorMap = new Map<string, number>();
  for (const m of metrics) {
    for (const eb of (m.editor_breakdown as { name: string; total_engaged_users: number }[])) {
      editorMap.set(eb.name, (editorMap.get(eb.name) ?? 0) + eb.total_engaged_users);
    }
  }
  const editors = Array.from(editorMap.entries())
    .map(([name, total_engaged_users]) => ({ name, total_engaged_users }));

  return { trends, languages, editors };
}

export function computeFeatureUsageDashboard() {
  // Synthesize feature usage data from metrics (since no CopilotFeatureMetric in mock)
  const features = [
    { feature: 'copilot_chat_ask', pct: 0.35 },
    { feature: 'copilot_edits', pct: 0.25 },
    { feature: 'copilot_agent', pct: 0.20 },
    { feature: 'copilot_inline', pct: 0.15 },
    { feature: 'copilot_custom', pct: 0.05 },
  ];

  const metrics = getMockMetrics();
  const totalInteractions = metrics.reduce((s, m) => s + m.total_code_suggestions + m.total_chats, 0);

  const featureItems = features.map(f => {
    const interactions = Math.floor(totalInteractions * f.pct);
    const generations = Math.floor(interactions * 0.7);
    const acceptances = Math.floor(generations * 0.55);
    const suggestedLines = Math.floor(interactions * 2.2);
    const acceptedLines = Math.floor(suggestedLines * 0.55);
    return {
      feature: f.feature,
      total_interactions: interactions,
      total_generations: generations,
      total_acceptances: acceptances,
      total_suggested_lines: suggestedLines,
      total_accepted_lines: acceptedLines,
      acceptance_rate: Math.round(acceptances / Math.max(1, generations) * 10000) / 100,
      interaction_share: Math.round(f.pct * 10000) / 100,
    };
  });

  const summary = {
    total_interactions: featureItems.reduce((s, f) => s + f.total_interactions, 0),
    total_generations: featureItems.reduce((s, f) => s + f.total_generations, 0),
    overall_acceptance_rate: 55.2,
    overall_line_acceptance_rate: 52.8,
    agent_interaction_share: 20.0,
    top_feature: features[0].feature,
    top_feature_share: 35.0,
  };

  // Trend data: last 14 days, one entry per feature per day
  const trends: { date: string; feature: string; interactions: number }[] = [];
  for (let d = 14; d >= 1; d--) {
    const day = dateStr(d);
    for (const f of features) {
      trends.push({
        date: day,
        feature: f.feature,
        interactions: Math.floor(randInt(50, 300) * f.pct * 5),
      });
    }
  }

  const models = [
    { name: 'claude-sonnet-4-5', total_suggestions: 4800, total_acceptances: 2640, total_chats: 1200, share: 38.0 },
    { name: 'gpt-4o', total_suggestions: 3600, total_acceptances: 1980, total_chats: 900, share: 28.5 },
    { name: 'claude-haiku-4-5', total_suggestions: 2400, total_acceptances: 1320, total_chats: 600, share: 19.0 },
    { name: 'gpt-4o-mini', total_suggestions: 1800, total_acceptances: 990, total_chats: 450, share: 14.5 },
  ];

  const modes = [
    { mode: 'Ask', total_interactions: Math.floor(totalInteractions * 0.35), total_generations: 0, total_acceptances: 0, share: 35.0 },
    { mode: 'Edit', total_interactions: Math.floor(totalInteractions * 0.25), total_generations: 0, total_acceptances: 0, share: 25.0 },
    { mode: 'Agent', total_interactions: Math.floor(totalInteractions * 0.20), total_generations: 0, total_acceptances: 0, share: 20.0 },
    { mode: 'Inline', total_interactions: Math.floor(totalInteractions * 0.15), total_generations: 0, total_acceptances: 0, share: 15.0 },
    { mode: 'Custom', total_interactions: Math.floor(totalInteractions * 0.05), total_generations: 0, total_acceptances: 0, share: 5.0 },
  ].map(m => ({ ...m, total_generations: Math.floor(m.total_interactions * 0.7), total_acceptances: Math.floor(m.total_interactions * 0.4) }));

  return { summary, features: featureItems, models, modes, trends };
}

export function computeUsersUsageDashboard() {
  const users = AUTHORS.map((login, i) => {
    const total_interactions = randInt(200, 2000);
    const total_suggested_lines = randInt(500, 5000);
    const total_accepted_lines = Math.floor(total_suggested_lines * randFloat(0.35, 0.7));
    const line_acceptance_rate = Math.round((total_accepted_lines / Math.max(1, total_suggested_lines)) * 10000) / 100;
    const total_generations = Math.floor(total_interactions * 0.65);
    const total_acceptances = Math.floor(total_generations * 0.5);
    const agent_interactions = Math.floor(total_interactions * randFloat(0.1, 0.3));

    return {
      user_login: login,
      total_interactions,
      total_skill_interactions: Math.floor(total_interactions * 0.4),
      total_agent_interactions: agent_interactions,
      total_builtin_agent_interactions: Math.floor(agent_interactions * 0.7),
      total_extension_agent_interactions: Math.floor(agent_interactions * 0.3),
      total_agent_edit_lines: randInt(50, 500),
      agent_impact: Math.round(randFloat(10, 40) * 10) / 10,
      total_suggested_lines,
      total_accepted_lines,
      line_acceptance_rate,
      interaction_share: 0,
    };
  });

  const totalInteractions = users.reduce((s, u) => s + u.total_interactions, 0);
  users.forEach(u => {
    u.interaction_share = Math.round((u.total_interactions / Math.max(1, totalInteractions)) * 10000) / 100;
  });
  users.sort((a, b) => b.total_interactions - a.total_interactions);

  const summary = {
    total_users: users.length,
    total_interactions: totalInteractions,
    total_generations: users.reduce((s, u) => s + Math.floor(u.total_interactions * 0.65), 0),
    total_acceptances: users.reduce((s, u) => s + Math.floor(u.total_interactions * 0.32), 0),
    total_suggested_lines: users.reduce((s, u) => s + u.total_suggested_lines, 0),
    total_accepted_lines: users.reduce((s, u) => s + u.total_accepted_lines, 0),
    overall_acceptance_rate: 54.2,
  };

  // 30-day trend
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = dateStr(30 - i);
    return {
      date: d,
      interactions: randInt(80, 400),
      generations: randInt(50, 260),
      acceptances: randInt(25, 130),
    };
  });

  return { summary, users, trend };
}

export function computeUserDetail(userLogin: string) {
  const allUsers = computeUsersUsageDashboard();
  const user = allUsers.users.find(u => u.user_login === userLogin);
  if (!user) return null;

  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = dateStr(30 - i);
    const interactions = randInt(5, 40);
    const generations = Math.floor(interactions * 0.65);
    const acceptances = Math.floor(generations * 0.5);
    const suggested = randInt(20, 200);
    const accepted = Math.floor(suggested * randFloat(0.35, 0.7));
    return { date: d, interactions, generations, acceptances, suggested_lines: suggested, accepted_lines: accepted };
  }).filter(() => rand() > 0.2);

  const peak = daily.reduce((best, d) => d.interactions > best.interactions ? d : best, daily[0] ?? { date: '', interactions: 0 });

  const summary = {
    total_interactions: user.total_interactions,
    total_generations: Math.floor(user.total_interactions * 0.65),
    total_acceptances: Math.floor(user.total_interactions * 0.32),
    total_active_days: daily.length,
    peak_daily_interactions: peak?.interactions ?? 0,
    peak_interactions_date: peak?.date ?? '',
    average_daily_interactions: daily.length > 0 ? Math.round(user.total_interactions / daily.length) : 0,
    interaction_share: user.interaction_share,
    total_suggested_lines: user.total_suggested_lines,
    total_accepted_lines: user.total_accepted_lines,
  };

  return { user_login: userLogin, summary, daily };
}

export function computePRInsightsSummary() {
  const prs = getMockPRs();
  const merged = prs.filter(p => p.state === 'merged');
  const open = prs.filter(p => p.state === 'open');
  const avgLinesAdded = prs.length > 0 ? Math.round(prs.reduce((s, p) => s + p.lines_added, 0) / prs.length) : 0;
  const avgCopilotPct = prs.length > 0
    ? Math.round(prs.reduce((s, p) => s + (p.analysis?.copilot_contribution_pct ?? 0), 0) / prs.length * 10) / 10 : 0;
  const highRisk = prs.filter(p => (p.analysis?.risk_score ?? 0) >= 0.6).length;

  return {
    total_prs: prs.length,
    merged_prs: merged.length,
    open_prs: open.length,
    avg_lines_added: avgLinesAdded,
    avg_copilot_contribution_pct: avgCopilotPct,
    high_risk_prs: highRisk,
    primary_repo_name: getMockRepos()[0]?.full_name ?? '',
  };
}

export function computePRMetricsInsights() {
  const metrics = getMockMetrics();
  if (!metrics.length) {
    return {
      velocity_gap: { ai_median_merge_time_mins: 0, human_median_merge_time_mins: 0, velocity_gain_pct: 0 },
      volume_split: { ai_managed_prs: 0, human_managed_prs: 0, total_prs: 0, ai_pct: 0 },
      bottom_cards: { total_prs: 0, prs_with_copilot: 0, copilot_lines_suggested: 0, copilot_lines_accepted: 0, acceptance_rate: 0, active_users: 0, total_code_suggestions: 0, total_code_acceptances: 0 },
      daily_trends: [],
      top_features: [],
    };
  }

  const totalLinesSuggested = metrics.reduce((s, m) => s + m.total_lines_suggested, 0);
  const totalLinesAccepted = metrics.reduce((s, m) => s + m.total_lines_accepted, 0);
  const totalPRSummaries = metrics.reduce((s, m) => s + m.total_pr_summaries, 0);
  const totalCodeSuggestions = metrics.reduce((s, m) => s + m.total_code_suggestions, 0);
  const totalCodeAcceptances = metrics.reduce((s, m) => s + m.total_code_acceptances, 0);
  const maxActiveUsers = Math.max(...metrics.map(m => m.total_active_users));
  const acceptanceRate = totalLinesSuggested > 0 ? Math.round((totalLinesAccepted / totalLinesSuggested) * 1000) / 10 : 0;

  const totalEstimatedPrs = Math.max(totalPRSummaries, metrics.reduce((s, m) => s + m.total_active_users, 0));
  const aiManagedPrs = totalPRSummaries;
  const humanManagedPrs = Math.max(0, totalEstimatedPrs - aiManagedPrs);
  const aiPct = totalEstimatedPrs > 0 ? Math.round((aiManagedPrs / totalEstimatedPrs) * 1000) / 10 : 0;

  const humanBaselineMins = 1440;
  const aiMergeTimeMins = acceptanceRate > 0 ? humanBaselineMins * (1 - acceptanceRate / 200) : 0;
  const velocityGain = acceptanceRate > 0 ? Math.round(((humanBaselineMins - aiMergeTimeMins) / humanBaselineMins) * 1000) / 10 : 0;

  const dailyTrends = metrics.map(m => ({
    date: m.date,
    lines_suggested: m.total_lines_suggested,
    lines_accepted: m.total_lines_accepted,
    acceptance_rate: m.total_lines_suggested > 0 ? Math.round((m.total_lines_accepted / m.total_lines_suggested) * 10000) / 100 : 0,
    active_users: m.total_active_users,
    pr_summaries: m.total_pr_summaries,
  }));

  return {
    velocity_gap: {
      ai_median_merge_time_mins: Math.round(aiMergeTimeMins * 10) / 10,
      human_median_merge_time_mins: humanBaselineMins,
      velocity_gain_pct: velocityGain,
    },
    volume_split: {
      ai_managed_prs: aiManagedPrs,
      human_managed_prs: humanManagedPrs,
      total_prs: totalEstimatedPrs,
      ai_pct: aiPct,
    },
    bottom_cards: {
      total_prs: getMockPRs().length,
      prs_with_copilot: Math.floor(getMockPRs().length * 0.7),
      copilot_lines_suggested: totalLinesSuggested,
      copilot_lines_accepted: totalLinesAccepted,
      acceptance_rate: acceptanceRate,
      active_users: maxActiveUsers,
      total_code_suggestions: totalCodeSuggestions,
      total_code_acceptances: totalCodeAcceptances,
    },
    daily_trends: dailyTrends,
    top_features: [],
  };
}

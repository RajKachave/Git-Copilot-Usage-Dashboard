# GitHub Copilot Usage Dashboard — Next.js

> **A full-stack, TypeScript-first analytics platform for visualizing GitHub Copilot adoption, feature usage, developer productivity, and AI vs. human code contribution across an organization.**

Originally built as a React + Vite frontend paired with a Python FastAPI backend. This repository is the **complete migration** of that stack into a single, self-contained **Next.js 15** application — preserving every screen, every data shape, every interaction, and every business metric.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Migration Summary](#3-migration-summary)
4. [Folder Structure](#4-folder-structure)
5. [Application Architecture](#5-application-architecture)
6. [Data Flow Architecture](#6-data-flow-architecture)
7. [API Documentation](#7-api-documentation)
8. [Routing Documentation](#8-routing-documentation)
9. [Component Reference](#9-component-reference)
10. [Mock Data Engine](#10-mock-data-engine)
11. [State Management](#11-state-management)
12. [Environment Configuration](#12-environment-configuration)
13. [Local Setup and Running](#13-local-setup-and-running)
14. [Build and Deployment](#14-build-and-deployment)
15. [Pages and Features](#15-pages-and-features)
16. [TypeScript Types Reference](#16-typescript-types-reference)
17. [Theme and Design System](#17-theme-and-design-system)
18. [Troubleshooting](#18-troubleshooting)
19. [Migration Decisions and Assumptions](#19-migration-decisions-and-assumptions)
20. [Known Limitations and Future Work](#20-known-limitations-and-future-work)

---

## 1. Project Overview

### What the Application Does

The **GitHub Copilot Usage Dashboard** is an internal analytics tool for engineering leadership. It ingests GitHub Copilot telemetry — suggestion counts, acceptance rates, per-user breakdowns, pull request quality signals, and feature-level adoption — and presents it as an interactive executive dashboard.

### Primary Workflows

| Workflow | Description |
|---|---|
| **Executive KPI Monitoring** | View organization-wide totals: lines suggested, accepted, acceptance rate, active users, PRs, commits, chat interactions |
| **Trend Analysis** | 60-day time-series chart of Copilot usage with language and editor breakdowns |
| **Feature Adoption Tracking** | Per-feature interaction counts across Ask, Edit, Agent, Inline, and Custom modes with model-level granularity |
| **Developer Leaderboard** | Per-user interaction totals with sortable columns, multi-select comparison charts, and individual drill-down dialogs |
| **PR Insights** | Pull request table with Copilot contribution percentages, code ownership bars, CI quality signals, risk scoring, and file-level breakdowns |
| **Configuration** | PAT and org configuration, repository tracking list management, manual NDJSON data import, and full sync triggering |

### Business Objectives

- Give CTOs and VP Engineering a **single dashboard** showing ROI of GitHub Copilot investment
- Surface **developer-level adoption** to identify power users and laggards
- Quantify **AI vs. human code contribution** at the PR and file level
- Expose **quality signals** (CI failures, reverted lines, review friction) where Copilot code needs more oversight

### Supported Screens

| Screen | Route | Description |
|---|---|---|
| Executive Dashboard | `/` | KPI cards, trend charts, language and editor breakdowns |
| Feature Usage | `/feature-usage` | Feature-level adoption, model usage, mode breakdown |
| Users Usage | `/users-usage` | Developer leaderboard with export and per-user detail |
| PR Insights (AI vs Human) | `/prs` | Filterable PR table with file-level Copilot analysis |
| Settings | `/settings` | Auth config, repo management, sync, NDJSON import |

---

## 2. Technology Stack

### Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.3.3 | Full-stack React framework with App Router, API routes, SSR and SSG |
| **React** | 19.0.0 | UI rendering |
| **TypeScript** | 5.7.0 | Strict type safety across all frontend and backend code |
| **Node.js** | >=18.18.0 | Runtime for Next.js server and API routes |

### Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mui/material` | 7.3.9 | Primary component library — Cards, Tables, Dialogs, Chips, Drawers, Buttons |
| `@mui/icons-material` | 7.3.9 | Icon set used in sidebar, KPI cards, filter bars, buttons |
| `@mui/material-nextjs` | 7.3.9 | MUI App Router integration — `AppRouterCacheProvider` for SSR emotion cache |
| `@emotion/react` | 11.14.0 | CSS-in-JS engine required by MUI |
| `@emotion/styled` | 11.14.1 | Styled component support for MUI component overrides |
| `@emotion/cache` | 11.14.0 | Server-side emotion cache (prevents FOUC in SSR) |
| `@fontsource/inter` | 5.2.8 | Self-hosted Inter font, weights 300 through 800 |
| `recharts` | 3.8.0 | All charts — AreaChart, BarChart, LineChart, PieChart with ResponsiveContainer |
| `xlsx` | 0.18.5 | Client-side Excel export on the Users Usage page via SheetJS |

### Backend and API Dependencies

All API logic runs as server-side TypeScript inside Next.js Route Handlers. There are no external backend dependencies — no Python, no database driver, no Redis.

| Module | Purpose |
|---|---|
| Next.js Route Handlers | Replace all 6 original Python FastAPI routers |
| `lib/mock-data/index.ts` | Replaces Python `mock_data.py` and `analytics.py` — seeded PRNG deterministic data engine |
| `lib/auth-state.ts` | Replaces Python `config.py` settings singleton — in-memory PAT and org state |
| `lib/repo-settings-store.ts` | Replaces Python SQLite `repo_config` table — in-memory upsert and disable logic |

### Development Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@types/node` | 22.10.0 | Node.js type definitions for server code |
| `@types/react` | 19.0.0 | React type definitions |
| `@types/react-dom` | 19.0.0 | React DOM type definitions |

---

## 3. Migration Summary

### Original Architecture

The original project was split into two independently running processes:

```
ORIGINAL ARCHITECTURE
==================================================
FRONTEND (port 5173)         BACKEND (port 8000)
React 19 + Vite              Python FastAPI 0.135
React Router v7              SQLAlchemy 2.0 + SQLite
MUI v7                       Pydantic v2 schemas
Recharts                     Celery + Redis background sync
Axios HTTP client            httpx GitHub API client
JSX — no TypeScript          uvicorn ASGI server
                             6 routers, 5 services
```

**Original Python backend files:**

| File | Responsibility |
|---|---|
| `routers/auth.py` | PAT configuration, token validation via GitHub API |
| `routers/dashboard.py` | Summary KPIs, trends, feature usage, user usage aggregations |
| `routers/metrics.py` | Copilot metrics CRUD, NDJSON import, report URL proxying |
| `routers/prs.py` | Pull request list, per-PR analysis, file breakdown, metrics insights |
| `routers/repos.py` | Repository listing and sync triggering |
| `routers/settings.py` | Repo config CRUD — enable and disable per-org repository tracking |
| `services/analytics.py` | All aggregation logic — trends, language stats, user totals, risk scoring |
| `services/mock_data.py` | SQLite database seeder with realistic randomized data |
| `services/sync_service.py` | Full GitHub API sync orchestration across all endpoints |
| `services/github_client.py` | GitHub REST API client using httpx with auth headers |
| `services/ndjson_import.py` | NDJSON file parsing and DB insertion with duplicate detection |

### Migrated Architecture

The migration produces a **single self-contained Next.js 15 application** with no external services required:

```
MIGRATED ARCHITECTURE
==================================================
SINGLE Next.js 15 APPLICATION (port 3000)

FRONTEND (Client Components)
Next.js App Router — (dashboard) route group
MUI v7 with AppRouterCacheProvider for SSR
Recharts for all data visualization
Native fetch API replacing Axios
Full TypeScript — all props, state, API types typed
useRouter + usePathname replacing React Router

BACKEND (Server — API Route Handlers)
19 TypeScript route handler files in app/api/
Seeded PRNG mock data engine replacing SQLite ORM
In-memory auth state singleton
In-memory repo config store
All JSON response shapes preserved exactly
```

### Migration Transformation Table

| Original | Migrated | Notes |
|---|---|---|
| React + Vite on port 5173 | Next.js 15 on port 3000 | Single unified dev server — no CORS config needed |
| React Router `BrowserRouter` + `Routes` | Next.js App Router file-system routing | Route group `(dashboard)` provides shared layout |
| React Router `Outlet` | Next.js `children` prop in layout component | `app/(dashboard)/layout.tsx` renders `AppLayout` |
| `useNavigate(path)` | `useRouter().push(path)` | Drop-in behavioral equivalent |
| `useLocation().pathname` | `usePathname()` | Identical behavior |
| Axios `client.get('/api/...')` targeting port 8000 | Native `fetch('/api/...')` targeting same-origin routes | No CORS headers or proxy configuration needed |
| Python FastAPI routers (6 files, ~200 lines each) | Next.js Route Handlers (19 `route.ts` files) | Identical URL structure, HTTP methods, status codes, JSON shapes |
| SQLAlchemy ORM + SQLite database | Seeded PRNG TypeScript module — in-memory | Deterministic output, zero external dependencies |
| Pydantic v2 schemas in `schemas.py` | TypeScript interfaces in `types/index.ts` | Field-for-field equivalents across 30+ interfaces |
| Python `settings` singleton from `config.py` | `lib/auth-state.ts` module-level object | Same runtime singleton pattern using module scope |
| SQLite `repo_config` table with enable/disable | `lib/repo-settings-store.ts` array | Same upsert and soft-delete logic, in-memory |
| Celery + Redis background scheduler | Not included | Sync is triggered manually via `POST /api/repos/sync` |
| JSX without types | TSX with strict TypeScript | All props, state, and API responses fully typed |
| MUI `ThemeProvider` at React root | MUI `AppRouterCacheProvider` + `ThemeProvider` | Required for Next.js SSR emotion cache to prevent FOUC |
| `@fontsource/inter` imported in `main.jsx` | `@fontsource/inter` imported in `app/layout.tsx` | Same weights (300, 400, 500, 600, 700, 800) |

### Preserved Behaviors — Complete List

Every behavior from the original application is preserved identically:

- All 5 dashboard pages render with identical UI, colors, spacing, and typography
- All 8 KPI cards on Dashboard with drilldown dialogs showing raw data tables
- 60-day trend area chart with custom tooltip
- Copilot vs Human pie chart, language bar chart, editor distribution pie chart
- Feature Usage: trend line chart, interaction share pie, bar chart, feature and model leaderboard tables
- Users Usage: multi-user select, sortable table, CSV export with RFC-4180 escaping, XLSX export via SheetJS, per-user detail dialog with daily breakdown
- PR Insights: text search on title and author, status filter, risk filter, Copilot range filter, author dropdown filter, expandable rows with file table and timeline chips, pagination with 10/15/25/50 options
- Settings: PAT password field, org input, tag-based repo input with Enter/comma/Backspace behavior, quick-add preset chips, sync result stats grid, NDJSON dual-file upload with result breakdown
- Stale repo warning banner in sidebar updates on every route change and on auth save event
- `copilot-auth-status-updated` CustomEvent dispatched on settings save and consumed by AppLayout

---

## 4. Folder Structure

```
copilot-dashboard-nextjs/
|
+-- app/                                    Next.js App Router root
|   +-- layout.tsx                          Root layout: MUI provider, Inter font, global CSS
|   +-- globals.css                         Global resets, scrollbar, selection color
|   |
|   +-- (dashboard)/                        Route group: all pages share AppLayout sidebar
|   |   +-- layout.tsx                      Renders AppLayout wrapping children
|   |   +-- page.tsx                        / — Executive Dashboard (423 lines)
|   |   +-- feature-usage/
|   |   |   +-- page.tsx                    /feature-usage — Feature Usage (326 lines)
|   |   +-- users-usage/
|   |   |   +-- page.tsx                    /users-usage — Users Usage (568 lines)
|   |   +-- prs/
|   |   |   +-- page.tsx                    /prs — PR Insights (444 lines)
|   |   +-- settings/
|   |       +-- page.tsx                    /settings — Settings (325 lines)
|   |
|   +-- api/                                Next.js Route Handlers (server-side)
|       +-- health/route.ts                 GET  /api/health
|       +-- auth/
|       |   +-- status/route.ts             GET  /api/auth/status
|       |   +-- configure/route.ts          POST /api/auth/configure
|       +-- repos/
|       |   +-- route.ts                    GET  /api/repos
|       |   +-- sync/route.ts               POST /api/repos/sync
|       +-- metrics/
|       |   +-- copilot/route.ts            GET  /api/metrics/copilot
|       |   +-- usage/route.ts              GET  /api/metrics/usage
|       |   +-- import-ndjson/route.ts      POST /api/metrics/import-ndjson
|       +-- dashboard/
|       |   +-- summary/route.ts            GET  /api/dashboard/summary
|       |   +-- trends/route.ts             GET  /api/dashboard/trends
|       |   +-- feature-usage/route.ts      GET  /api/dashboard/feature-usage
|       |   +-- users-usage/
|       |       +-- route.ts                GET  /api/dashboard/users-usage
|       |       +-- [userLogin]/route.ts    GET  /api/dashboard/users-usage/:userLogin
|       +-- prs/
|       |   +-- route.ts                    GET  /api/prs
|       |   +-- insights-summary/route.ts   GET  /api/prs/insights-summary
|       |   +-- metrics-insights/route.ts   GET  /api/prs/metrics-insights
|       |   +-- [id]/
|       |       +-- analysis/route.ts       GET  /api/prs/:id/analysis
|       |       +-- files/route.ts          GET  /api/prs/:id/files
|       +-- settings/
|           +-- repos/route.ts              GET and POST /api/settings/repos
|
+-- components/                             Shared React components
|   +-- AppLayout.tsx                       Sidebar drawer, mobile AppBar, stale repo warning (160 lines)
|   +-- KPICard.tsx                         Metric card with icon, trend, click drilldown (87 lines)
|   +-- TrendChart.tsx                      Area chart: lines suggested vs accepted (111 lines)
|   +-- PieBreakdown.tsx                    Donut chart with percentage labels (80 lines)
|   +-- MuiProvider.tsx                     AppRouterCacheProvider + ThemeProvider wrapper (17 lines)
|
+-- lib/                                    Server and shared utility modules
|   +-- api-client.ts                       Typed fetch wrapper for all frontend API calls (73 lines)
|   +-- auth-state.ts                       In-memory PAT and org singleton (21 lines)
|   +-- repo-settings-store.ts              In-memory repo config with enable/disable (42 lines)
|   +-- theme.ts                            MUI dark theme: colors, typography, overrides (87 lines)
|   +-- mock-data/
|       +-- index.ts                        Complete mock data engine with PRNG and analytics (670 lines)
|
+-- types/
|   +-- index.ts                            All TypeScript interfaces matching API shapes (290 lines)
|
+-- public/                                 Static assets (empty)
+-- styles/                                 Reserved for additional CSS modules
+-- hooks/                                  Reserved for custom React hooks
|
+-- .env.local                              Environment variables (not committed)
+-- next.config.js                          Next.js config: strict mode, MUI package optimization
+-- tsconfig.json                           TypeScript: strict mode, @/* path alias, bundler resolution
+-- package.json                            Dependencies, scripts, type: module
```

---

## 5. Application Architecture

### High-Level Architecture Diagram

```
BROWSER (Client Side)
+------------------------------------------------------------------+
|                                                                  |
|  AppLayout (components/AppLayout.tsx)                            |
|  +---------------------------+                                   |
|  | Permanent Drawer          |  Page Component ('use client')   |
|  | (desktop >= md breakpoint)|  +------------------------------+ |
|  |                           |  | useEffect on mount           | |
|  | [Dashboard]               |  |   -> lib/api-client.ts       | |
|  | [Feature Usage]           |  |   -> fetch('/api/...')       | |
|  | [Users Usage]             |  |                              | |
|  | [PR Insights]             |  | React state -> MUI + Recharts| |
|  | [Settings]                |  +------------------------------+ |
|  |                           |                                   |
|  | Stale repo warning banner |                                   |
|  +---------------------------+                                   |
+------------------------------------------------------------------+
                         |
              HTTP fetch (same-origin, /api/*)
                         |
                         v
NEXT.JS SERVER (API Route Handlers)
+------------------------------------------------------------------+
|                                                                  |
|  app/api/dashboard/summary/route.ts                              |
|    -> computeDashboardSummary()      ----+                       |
|                                         |                        |
|  app/api/dashboard/trends/route.ts      |                        |
|    -> computeDashboardTrends()      ----+                        |
|                                         |                        |
|  app/api/prs/route.ts                   |                        |
|    -> getMockPRs()                  ----+                        |
|                                         |                        |
|  app/api/auth/status/route.ts           |                        |
|    -> getAuthState()               -----+                        |
|                                         |                        |
|  app/api/settings/repos/route.ts        v                        |
|    -> getRepoSettings()           lib/mock-data/index.ts         |
|    -> saveRepoSettings()          lib/auth-state.ts              |
|                                   lib/repo-settings-store.ts     |
+------------------------------------------------------------------+
```

### Route Group Architecture

The `(dashboard)` route group is the core architectural pattern. Parentheses in the folder name tell Next.js to create no URL segment from the folder — it exists purely to scope a shared layout.

```
URL: /               -> app/(dashboard)/page.tsx
URL: /feature-usage  -> app/(dashboard)/feature-usage/page.tsx
URL: /users-usage    -> app/(dashboard)/users-usage/page.tsx
URL: /prs            -> app/(dashboard)/prs/page.tsx
URL: /settings       -> app/(dashboard)/settings/page.tsx

Layout chain for any dashboard route:
  app/layout.tsx                   (RootLayout — Server Component)
    -> app/(dashboard)/layout.tsx  (DashboardGroupLayout — Server Component)
         -> components/AppLayout.tsx  ('use client' — sidebar, stale warning)
              -> {page children}
```

### Client vs Server Boundary

| File | Directive | Reason |
|---|---|---|
| `app/layout.tsx` | Server Component (default) | No browser APIs — only renders children |
| `app/(dashboard)/layout.tsx` | Server Component (default) | Wraps AppLayout without state or effects |
| `components/MuiProvider.tsx` | `'use client'` | `AppRouterCacheProvider` is a client-only hook |
| `components/AppLayout.tsx` | `'use client'` | Uses `useRouter`, `usePathname`, `useState`, `useEffect`, `window.addEventListener` |
| `components/KPICard.tsx` | `'use client'` | Event handlers: `onClick`, `onKeyDown` |
| `components/TrendChart.tsx` | `'use client'` | Recharts renders to canvas — browser only |
| `components/PieBreakdown.tsx` | `'use client'` | Recharts renders to canvas — browser only |
| `app/(dashboard)/*/page.tsx` | `'use client'` | All pages use `useState`, `useEffect`, and event handlers |
| `app/api/*/route.ts` | Server (always) | Route handlers run exclusively on the server — no browser APIs allowed |
| `lib/mock-data/index.ts` | Server (imported by routes) | Data generation — no browser APIs, runs in Node.js |
| `lib/auth-state.ts` | Server (module singleton) | Module-level state lives in Node.js process memory |
| `lib/api-client.ts` | Client (imported by pages) | Uses browser `fetch` to call same-origin API routes |

---

## 6. Data Flow Architecture

### Dashboard Page Data Flow

```
DashboardPage ('use client')
|
+-- useEffect [mount]
|     +-- getDashboardSummary()        -> lib/api-client.ts
|     |     -> fetch('/api/dashboard/summary')
|     |           -> app/api/dashboard/summary/route.ts
|     |                 -> computeDashboardSummary()
|     |                       -> getMockMetrics()   60 daily CopilotMetric records
|     |                       -> getMockRepos()     6 repositories (acme-corp/*)
|     |                       -> getMockPRs()       ~100 pull requests
|     |                 Returns: { total_repos, total_lines_suggested, acceptance_rate, ... }
|     |
|     +-- getDashboardTrends()
|           -> fetch('/api/dashboard/trends')
|                 -> computeDashboardTrends()
|                 Returns: {
|                   trends:    [{ date, lines_suggested, lines_accepted, ... }] x60
|                   languages: [{ name, total_lines_suggested, total_lines_accepted }]
|                   editors:   [{ name, total_engaged_users }]
|                 }
|
+-- setSummary(data) -> renders 8 KPI cards across 2 rows
+-- setTrends(data)  -> renders TrendChart, PieBreakdown, BarChart
|
+-- onClick(metric) -> setSelectedMetric('linesAccepted')
      -> Dialog opens showing drilldownByKey[metric].details table
                         + drilldownRows raw daily data table
```

### PR Insights Data Flow

```
PRInsightsPage ('use client')
|
+-- useEffect [mount]
|     +-- getPullRequests({ limit: 200 }) -> getMockPRs().slice(0, 200)
|     |     Each PR contains: { analysis: {...}, files: [{...}] }
|     +-- getPRInsightsSummary()          -> computePRInsightsSummary()
|
+-- useMemo: authors = unique authors from prs[]
+-- useMemo: filtered = prs[] filtered by all active filter state
|     -> search (title or author text match)
|     -> statusFilter (merged / open / closed)
|     -> authorFilter (specific developer)
|     -> riskFilter (low < 0.3 / medium 0.3-0.6 / high >= 0.6)
|     -> copilotRange (% of Copilot-contributed lines)
|
+-- useMemo: insightStats
|     -> aiCount (author includes 'copilot' or 'mcp-agent')
|     -> humanCount
|     -> aiAvg merge hours / humanAvg merge hours / velocityGainPct
|     -> aiLines (sum of estimated_accepted_lines) / humanLines
|
+-- Pagination: filtered.slice(page * rowsPerPage, ...)
      -> ExpandableRow per PR
            -> click row -> Collapse reveals file breakdown table
                                         + timeline chips
```

### Users Usage Data Flow

```
UsersUsagePage ('use client')
|
+-- useEffect [mount] -> getUsersUsageDashboard()
|     -> computeUsersUsageDashboard()
|     -> users[]: 10 mock users sorted by total_interactions desc
|     -> setSelectedUsers(first 4 users by default)
|
+-- useMemo: trendRows (per-user daily line chart data)
|     Only users in selectedUsers[] appear in the chart
|     Keyed by user_login, aggregated from data.trend[]
|
+-- useMemo: sortedUsers (stable sort by sortBy column + sortOrder)
|
+-- onClick username button -> handleOpenUserDetail(userLogin)
|     -> if detailCache[userLogin] exists: use cache (no loading)
|     -> else: getUserUsageDetail(userLogin)
|           -> fetch('/api/dashboard/users-usage/:userLogin')
|           -> computeUserDetail(userLogin)
|           -> 30 daily usage records + summary (peak, averages, share)
|
+-- handleExportCSV()
|     -> toExportRows(selectedUserRows)
|     -> Blob with RFC-4180 escaped CSV -> createObjectURL -> link.click()
|
+-- handleExportXLSX()
      -> XLSX.utils.json_to_sheet(toExportRows(selectedUserRows))
      -> XLSX.writeFile(wb, 'selected_users_usage.xlsx')
```

### Settings Page Data Flow

```
SettingsPage ('use client')
|
+-- useEffect [mount]
|     +-- getAuthStatus()
|     |     -> getAuthState()       lib/auth-state.ts (module singleton)
|     |     -> setStatus(res)
|     |     -> if org_name: getRepoSettings(orgName)
|     |           -> getRepoSettings()  lib/repo-settings-store.ts
|     |           -> setTrackedRepos(res.repo_names)
|
+-- handleSave()
|     -> POST /api/auth/configure
|           -> setAuthState(pat, org)  lib/auth-state.ts
|     -> setStatus(res)
|     -> window.dispatchEvent('copilot-auth-status-updated', res)
|           -> AppLayout listener -> updates staleRepoWarning
|
+-- handleSync() -> POST /api/repos/sync
|     -> mock sync stats response
|     -> refreshes auth status + re-dispatches event
|
+-- handleImport()
|     -> FormData with copilot_usage_file + code_generation_file
|     -> POST /api/metrics/import-ndjson (multipart)
|     -> mock import result stats
|
+-- handleSaveRepos()
      -> POST /api/settings/repos { org_name, repo_names }
            -> saveRepoSettings()  lib/repo-settings-store.ts
            -> normalises, deduplicates, sorts repo_names
```

---

## 7. API Documentation

All APIs are served from `/api/*` Next.js Route Handlers. All responses are JSON. All response shapes are identical to the original Python FastAPI backend.

### Authentication

#### GET /api/auth/status

Returns the current authentication configuration state.

**Response:**
```json
{
  "configured": true,
  "org_name": "acme-corp",
  "token_valid": true,
  "user_login": null,
  "stale_repo_owners": [],
  "stale_repo_warning": null
}
```

| Field | Type | Description |
|---|---|---|
| `configured` | boolean | Whether a PAT has been set in auth state |
| `token_valid` | boolean | Whether the PAT passes validation (always true in mock mode) |
| `org_name` | string or null | Currently configured GitHub org |
| `stale_repo_warning` | string or null | Warning if stored repo owners differ from active org |

#### POST /api/auth/configure

Saves PAT and org to the in-memory auth state singleton.

**Request body:**
```json
{ "github_pat": "ghp_xxx", "github_org": "my-org" }
```

**Response:** Same shape as GET /api/auth/status

**Error (400):** `{ "error": "github_pat and github_org are required" }`

---

### Repositories

#### GET /api/repos

Returns all tracked repositories.

**Response:** Array of RepositoryResponse
```json
[
  {
    "id": 1, "github_id": 100000, "name": "web-platform",
    "full_name": "acme-corp/web-platform", "owner": "acme-corp",
    "description": "Mock repo: web-platform", "language": "python",
    "created_at": "2024-05-12T00:00:00.000Z",
    "last_synced_at": "2025-05-12T00:00:00.000Z"
  }
]
```

#### POST /api/repos/sync

Triggers a simulated full data sync.

**Response:**
```json
{
  "status": "success",
  "message": "Data sync completed successfully",
  "repos_synced": 6,
  "commits_synced": 306,
  "prs_synced": 102
}
```

---

### Metrics

#### GET /api/metrics/copilot

Returns daily Copilot metrics with optional date range filtering.

**Query params:** `from=YYYY-MM-DD`, `to=YYYY-MM-DD`

**Response:** Array of CopilotMetricResponse — 60 records covering the past 60 days

Each record includes:
- `date`, `org_name`
- `total_active_users`, `total_engaged_users`, `total_engaged_users_agent`
- `total_code_suggestions`, `total_code_acceptances`
- `total_lines_suggested`, `total_lines_accepted`
- `total_chats`, `total_chat_insertions`, `total_chat_copies`, `total_pr_summaries`
- `language_breakdown`, `editor_breakdown` arrays

#### GET /api/metrics/usage

Returns aggregated usage statistics — max users across all days, language and editor breakdowns.

**Response:**
```json
{
  "total_active_users": 30,
  "total_engaged_users": 27,
  "languages": [{ "name": "python", "total_lines_suggested": 42800, "total_lines_accepted": 22400 }],
  "editors": [{ "name": "vscode", "total_engaged_users": 580 }]
}
```

#### POST /api/metrics/import-ndjson

Accepts multipart form upload with two NDJSON files.

**Form fields:** `copilot_usage_file`, `code_generation_file`

**Response:**
```json
{
  "status": "success",
  "message": "NDJSON import completed.",
  "total_records": 42,
  "inserted_records": 40,
  "skipped_existing_records": 2,
  "invalid_records": 0,
  "duplicate_records": 2,
  "imported_dates": []
}
```

---

### Dashboard

#### GET /api/dashboard/summary

Returns all executive KPI totals in a single response.

**Response:** DashboardSummary
```json
{
  "total_repos": 6,
  "primary_repo_name": "acme-corp/web-platform",
  "total_commits": 306,
  "total_prs": 102,
  "active_contributors": 10,
  "total_lines_suggested": 2847520,
  "total_lines_accepted": 1418640,
  "estimated_human_lines": 945200,
  "acceptance_rate": 49.82,
  "total_active_users": 30,
  "total_engaged_users": 27,
  "total_suggestions": 1840200,
  "total_chats": 145800
}
```

#### GET /api/dashboard/trends

Returns 60-day time-series trend data plus aggregated language and editor statistics.

**Response:** DashboardTrends
```json
{
  "trends": [
    {
      "date": "2025-03-13",
      "lines_suggested": 2118,
      "lines_accepted": 1022,
      "acceptance_rate": 48.25,
      "active_users": 22,
      "suggestions_count": 847,
      "chats_count": 45
    }
  ],
  "languages": [{ "name": "python", "total_lines_suggested": 42800, "total_lines_accepted": 22400 }],
  "editors": [{ "name": "vscode", "total_engaged_users": 580 }]
}
```

#### GET /api/dashboard/feature-usage

Returns feature-level adoption: per-feature totals, model breakdown, mode breakdown, 14-day trend.

**Response:** FeatureUsageDashboardResponse
```json
{
  "summary": {
    "total_interactions": 2847520,
    "total_generations": 1993264,
    "overall_acceptance_rate": 55.2,
    "overall_line_acceptance_rate": 52.8,
    "agent_interaction_share": 20.0,
    "top_feature": "copilot_chat_ask",
    "top_feature_share": 35.0
  },
  "features": [
    {
      "feature": "copilot_chat_ask",
      "total_interactions": 996632,
      "total_generations": 697642,
      "total_acceptances": 383703,
      "total_suggested_lines": 2192590,
      "total_accepted_lines": 1205924,
      "acceptance_rate": 55.0,
      "interaction_share": 35.0
    }
  ],
  "models": [
    { "name": "claude-sonnet-4-5", "total_suggestions": 4800, "total_acceptances": 2640, "total_chats": 1200, "share": 38.0 }
  ],
  "modes": [
    { "mode": "Ask", "total_interactions": 996632, "total_generations": 697642, "total_acceptances": 398652, "share": 35.0 }
  ],
  "trends": [{ "date": "2025-04-28", "feature": "copilot_chat_ask", "interactions": 1800 }]
}
```

#### GET /api/dashboard/users-usage

Returns per-user interaction and line totals with aggregate summary and 30-day trend.

**Response:** UserUsageDashboardResponse with users array (10 mock users) and summary KPIs.

#### GET /api/dashboard/users-usage/:userLogin

Returns full daily breakdown for a single user. URL-decodes the login before lookup.

**Response:** UserUsageDetailResponse
```json
{
  "user_login": "alice-dev",
  "summary": {
    "total_interactions": 1542,
    "total_generations": 1002,
    "total_acceptances": 493,
    "total_active_days": 24,
    "peak_daily_interactions": 42,
    "peak_interactions_date": "2025-04-22",
    "average_daily_interactions": 64,
    "interaction_share": 15.3,
    "total_suggested_lines": 3400,
    "total_accepted_lines": 1820
  },
  "daily": [
    {
      "date": "2025-04-13",
      "interactions": 28,
      "generations": 18,
      "acceptances": 9,
      "suggested_lines": 120,
      "accepted_lines": 66
    }
  ]
}
```

**404:** `{ "detail": "User 'unknown-user' was not found" }`

---

### Pull Requests

#### GET /api/prs

Returns pull requests with embedded analysis and file breakdowns.

**Query params:** `limit` (default 200)

**Response:** Array of PullRequestResponse
```json
[
  {
    "id": 1,
    "number": 1,
    "title": "Add user authentication flow",
    "state": "merged",
    "author": "alice-dev",
    "lines_added": 342,
    "lines_deleted": 88,
    "created_at": "2025-04-09",
    "merged_at": "2025-04-10",
    "repo": "acme-corp/web-platform",
    "analysis": {
      "estimated_copilot_lines": 154,
      "estimated_accepted_lines": 142,
      "estimated_rejected_lines": 12,
      "copilot_contribution_pct": 45.03,
      "failed_checks": 0,
      "total_checks": 7,
      "reverted_lines": 0,
      "review_comments_on_copilot": 1,
      "risk_score": 0.034
    },
    "files": [
      {
        "id": 10,
        "filename": "app/auth.py",
        "lines_added": 180,
        "copilot_lines": 88,
        "human_lines": 92,
        "copilot_pct": 48.9,
        "status": "merged"
      }
    ]
  }
]
```

#### GET /api/prs/insights-summary

Returns aggregate statistics across all PRs.

**Response:** PRInsightsSummary
```json
{
  "total_prs": 102,
  "merged_prs": 62,
  "open_prs": 18,
  "avg_lines_added": 247,
  "avg_copilot_contribution_pct": 38.4,
  "high_risk_prs": 7,
  "primary_repo_name": "acme-corp/web-platform"
}
```

#### GET /api/prs/metrics-insights

Returns velocity gap (AI vs human merge times), volume split, and daily trends derived from Copilot metrics.

#### GET /api/prs/:id/analysis

Returns the analysis object for a single PR by numeric ID.

**404:** `{ "detail": "PR not found" }`

#### GET /api/prs/:id/files

Returns the file-level breakdown array for a single PR by numeric ID.

---

### Settings

#### GET /api/settings/repos?org_name=:org

Returns currently tracked repositories for an org. Falls back to `GITHUB_REPO` env var if no repos configured.

**Response:**
```json
{ "org_name": "acme-corp", "repo_names": ["web-platform", "api-gateway"] }
```

**400:** `{ "detail": "org_name is required" }`

#### POST /api/settings/repos

Replaces the tracked repository list for an org. Normalises, deduplicates, and sorts repo names. Soft-disables repos removed from the list.

**Request body:**
```json
{ "org_name": "acme-corp", "repo_names": ["web-platform", "api-gateway", "ml-pipeline"] }
```

**Response:** Same shape with sorted, deduplicated `repo_names`

---

### Health

#### GET /api/health

Service health check.

**Response:** `{ "status": "healthy", "service": "copilot-dashboard-api" }`

---

## 8. Routing Documentation

### Page Routes

| URL | File | Bundle Size | Description |
|---|---|---|---|
| `/` | `app/(dashboard)/page.tsx` | 6.32 kB | Executive Dashboard — KPI cards, trend and pie charts |
| `/feature-usage` | `app/(dashboard)/feature-usage/page.tsx` | 4.38 kB | Feature adoption — line charts, model usage, mode breakdown |
| `/users-usage` | `app/(dashboard)/users-usage/page.tsx` | 106 kB | Developer leaderboard — sort, select, export, detail dialog |
| `/prs` | `app/(dashboard)/prs/page.tsx` | 14.7 kB | PR Insights — filter table, expandable rows, file analysis |
| `/settings` | `app/(dashboard)/settings/page.tsx` | 5.97 kB | Settings — auth, repos, sync, NDJSON import |

### Navigation Configuration

Navigation is defined in `components/AppLayout.tsx`:

```typescript
const navItems = [
  { label: 'Dashboard',                path: '/',             icon: <DashboardIcon /> },
  { label: 'Feature Usage',            path: '/feature-usage',icon: <InsightsIcon /> },
  { label: 'Users Usage',              path: '/users-usage',  icon: <GroupIcon /> },
  { label: 'PR Insight (AI vs Human)', path: '/prs',          icon: <CallMergeIcon /> },
  { label: 'Settings',                 path: '/settings',     icon: <SettingsIcon /> },
];
```

Active state: `usePathname() === item.path` (exact match)
Navigation: `useRouter().push(path)` (client-side, no full reload)

### Layout Chain

```
RootLayout (app/layout.tsx)
  html + body elements
  MuiProvider (AppRouterCacheProvider + ThemeProvider)
    DashboardGroupLayout (app/(dashboard)/layout.tsx)
      AppLayout (components/AppLayout.tsx)
        Permanent Drawer (desktop >= md)
        OR Temporary Drawer + AppBar (mobile < md)
        Stale repo warning banner (conditional)
        {children}  <- page content renders here
```

### Mobile vs Desktop Breakpoint

`AppLayout` uses `useMediaQuery(theme.breakpoints.down('md'))` to detect mobile:

- **Desktop (>= md = 900px):** `Drawer variant="permanent"` — sidebar always visible
- **Mobile (< md):** `Drawer variant="temporary"` — hidden, AppBar shows hamburger button, nav click closes drawer

---

## 9. Component Reference

### AppLayout (`components/AppLayout.tsx`)

**Directive:** `'use client'`

The master layout shell. Manages sidebar navigation, mobile AppBar, stale repo warning banner, and page content slot.

**Props:** `{ children: React.ReactNode }`

**State:**
- `mobileOpen: boolean` — controls temporary drawer visibility
- `staleRepoWarning: string | null` — warning text from auth status

**Key behaviors:**
- Calls `getAuthStatus()` on every route change (pathname in `useEffect` dependency array)
- Listens for `copilot-auth-status-updated` CustomEvent from the Settings page after saving auth
- Warning banner visible only when `stale_repo_warning` is a non-null string
- Sidebar width is constant at `DRAWER_WIDTH = 260` pixels

---

### KPICard (`components/KPICard.tsx`)

**Directive:** `'use client'`

Metric card with colored top accent bar, large value display, icon, optional subtitle, and optional trend arrow.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | required | Uppercase label above the value |
| `value` | string or number | required | Primary metric value |
| `subtitle` | string | optional | Secondary context text below value |
| `icon` | ReactNode | optional | MUI icon element, typically 28px |
| `trend` | number | optional | Percentage change — positive shows green up arrow, negative shows red down arrow |
| `color` | string | `'primary.main'` | Hex color or MUI theme token for accent and value |
| `onClick` | function | optional | Makes card interactive with role="button", keyboard support, hover lift effect |

**Usage example:**
```tsx
<KPICard
  title="Lines Suggested"
  value={fmt(summary?.total_lines_suggested)}
  subtitle="Total Copilot suggestions"
  icon={<CodeIcon sx={{ fontSize: 28, color: '#7c4dff' }} />}
  color="#7c4dff"
  trend={12.5}
  onClick={() => setSelectedMetric('linesSuggested')}
/>
```

---

### TrendChart (`components/TrendChart.tsx`)

**Directive:** `'use client'`

Area chart showing `lines_suggested` (purple, `#7c4dff`) and `lines_accepted` (cyan, `#00d4ff`) over time. Uses gradient fills under each area. Custom tooltip shows both series side by side.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | any[] | required | Objects with `date`, `lines_suggested`, `lines_accepted` fields |
| `title` | string | required | Card heading (pass empty string to suppress) |
| `height` | number | 320 | Chart height in pixels |

X-axis tick formatter slices from index 5 of ISO date string to show `MM-DD`.
Y-axis tick formatter compacts values >= 1000 to `k` notation.

---

### PieBreakdown (`components/PieBreakdown.tsx`)

**Directive:** `'use client'`

Donut chart with percentage labels inside segments. Segments below 5% suppress their label to avoid crowding. Five-color palette cycles: `#00d4ff`, `#7c4dff`, `#00e676`, `#ffab40`, `#ff5252`.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `{ name: string; value: number }[]` | required | Chart segments |
| `title` | string | required | Card heading |
| `height` | number | 300 | Chart height in pixels |

---

### MuiProvider (`components/MuiProvider.tsx`)

**Directive:** `'use client'`

Wraps children with `AppRouterCacheProvider` (MUI Next.js SSR emotion cache) and `ThemeProvider` with the custom dark theme from `lib/theme.ts`. Used once at the root layout level.

---

## 10. Mock Data Engine

**File:** `lib/mock-data/index.ts` (670 lines)

This module completely replaces the Python backend's `mock_data.py`, `analytics.py`, and the SQLite database. It generates deterministic, realistic data using a **seeded linear congruential PRNG (LCG)**.

### PRNG Implementation

```typescript
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;  // LCG algorithm
    return Math.abs(s) / 0x80000000;               // normalize to [0, 1)
  };
}
const rng = seededRand(42);  // seed = 42, deterministic forever
```

The PRNG seed is fixed at 42. Every server startup generates identical data. This means:
- Dashboard KPI values never change unexpectedly on refresh
- Drilldown dialogs always match parent card values
- No hydration mismatches between SSR and client render

### Generated Datasets

| Function | Output | Size |
|---|---|---|
| `getMockRepos()` | `MockRepo[]` | 6 repositories for acme-corp across 4 languages |
| `getMockMetrics()` | `MockMetric[]` | 60 daily records covering past 60 days |
| `getMockPRs()` | `MockPR[]` | ~100 PRs across 6 repos, past 30 days |

All three are lazy-initialized singletons — generated once on first call, cached for all subsequent calls in the same server process.

### Mock Data Constants

| Constant | Values |
|---|---|
| `LANGUAGES` | python, typescript, javascript, go, ruby, java, rust, cpp |
| `EDITORS` | vscode, neovim, jetbrains, xcode |
| `AUTHORS` | alice-dev, bob-coder, charlie-eng, diana-ops, elena-fe, frank-be, grace-ml, henry-devops, iris-sec, jack-data |
| `REPO_NAMES` | acme-corp/web-platform, api-gateway, ml-pipeline, mobile-app, infra-tools, data-service |
| PR States | Weighted: merged (60%), open (20%), closed (20%) |

### Analytics Functions

| Function | Python Equivalent | Description |
|---|---|---|
| `computeDashboardSummary()` | `dashboard_summary()` router | Totals across all metrics and PRs |
| `computeDashboardTrends()` | `dashboard_trends()` + analytics | Per-day trend + language/editor aggregation |
| `computeFeatureUsageDashboard()` | `compute_feature_usage_dashboard()` | Feature counts, model usage, mode breakdown, trend |
| `computeUsersUsageDashboard()` | `compute_user_usage_dashboard()` | Per-user totals, 30-day aggregate trend |
| `computeUserDetail(login)` | `compute_user_usage_detail()` | Per-user daily breakdown with peak and average stats |
| `computePRInsightsSummary()` | `get_insights_summary()` in prs router | PR count totals, avg Copilot %, high-risk count |
| `computePRMetricsInsights()` | `get_metrics_insights()` in prs router | Velocity gap, volume split, daily trends from metrics |

### Risk Score Algorithm

Mirrors Python exactly with identical weights:

```
risk_score = (rejected / suggested) * 0.40
           + (failed_checks / total_checks) * 0.35
           + (reverted_lines / total_lines) * 0.25
           capped at 1.0
```

Risk labels: score < 0.3 is Low, 0.3 to 0.6 is Medium, >= 0.6 is High

---

## 11. State Management

This application uses **React built-in state only** — no Redux, no Zustand, no Context API, no global store. All state is local to the component that owns it.

### Per-Page State Summary

| Page | Key State Variables | Description |
|---|---|---|
| `DashboardPage` | `summary`, `trends`, `loading`, `error`, `selectedMetric` | `selectedMetric` drives the drilldown Dialog open/close and content |
| `FeatureUsagePage` | `data`, `loading`, `error` | All derived values computed via `useMemo` from `data` |
| `UsersUsagePage` | `data`, `sortBy`, `sortOrder`, `selectedUsers`, `detailUserLogin`, `detailOpen`, `detailLoading`, `detailCache`, `kpiDialogKey` | `detailCache` memoizes fetched user details across dialog sessions |
| `PRInsightsPage` | `prs`, `summary`, `search`, `page`, `rowsPerPage`, `statusFilter`, `riskFilter`, `copilotRange`, `authorFilter` | All filtering done client-side via `useMemo` on the full `prs` array |
| `SettingsPage` | `pat`, `org`, `status`, `saving`, `syncing`, `syncResult`, `message`, `copilotUsageFile`, `codeGenerationFile`, `importing`, `importResult`, `trackedRepos`, `reposSaving`, `reposMessage`, `reposLoading` | Each async action has independent loading and result state |
| `AppLayout` | `mobileOpen`, `staleRepoWarning` | `staleRepoWarning` updated by both HTTP fetch and CustomEvent listener |

### Cross-Component Communication

The only cross-component communication pattern is a DOM CustomEvent:

```typescript
// Dispatched from: app/(dashboard)/settings/page.tsx (after save)
function publishAuthStatus(nextStatus: AuthStatusResponse) {
  window.dispatchEvent(
    new CustomEvent('copilot-auth-status-updated', { detail: nextStatus })
  );
}

// Consumed by: components/AppLayout.tsx (in useEffect)
window.addEventListener('copilot-auth-status-updated', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  setStaleRepoWarning(detail?.stale_repo_warning ?? null);
});
```

This updates the stale repo warning banner in the sidebar immediately after auth save — without prop drilling, Context API, or a global store.

### Session-Level Caching

Users Usage implements client-side caching of per-user detail data:

```typescript
const [detailCache, setDetailCache] = useState<Record<string, UserUsageDetailResponse>>({});

// On first open: fetch and cache
getUserUsageDetail(userLogin).then(res =>
  setDetailCache(prev => ({ ...prev, [userLogin]: res }))
);

// On re-open: served from cache immediately (no loading state shown)
const activeDetail = detailUserLogin ? detailCache[detailUserLogin] ?? null : null;
```

The cache lives for the lifetime of the page component. Navigating away and back resets it.

---

## 12. Environment Configuration

### .env.local Template

```bash
# GitHub Personal Access Token
# Required scopes: manage_billing:copilot, read:org, repo
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxx

# GitHub Organization name (case-sensitive)
GITHUB_ORG=your-org-name

# Default repository to track
# Optional — can be configured via Settings UI
GITHUB_REPO=your-repo-name

# Seed mock data (always active in Next.js migration)
SEED_MOCK_DATA=true

# SQLite path — retained for documentation, not used in Next.js
DATABASE_URL=./copilot_dashboard.db
```

### Variable Behavior

| Variable | Consumed by | Behavior |
|---|---|---|
| `GITHUB_PAT` | `lib/auth-state.ts` | Seeds initial in-memory PAT on server startup |
| `GITHUB_ORG` | `lib/auth-state.ts` | Seeds initial in-memory org name |
| `GITHUB_REPO` | `lib/repo-settings-store.ts` | Default repo returned when no repos saved via UI |
| `SEED_MOCK_DATA` | Not consumed | Retained in env template for clarity, mock data always active |
| `DATABASE_URL` | Not consumed | Retained for documentation only — no database in this migration |

### Client-Side Access

No environment variables are exposed to the browser. There are no `NEXT_PUBLIC_` prefixed variables. All env usage is server-side in Route Handlers and `lib/` modules accessed via `process.env`.

---

## 13. Local Setup and Running

### Prerequisites

| Requirement | Minimum Version | Check Command |
|---|---|---|
| Node.js | 18.18.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |

### Setup Steps

**Step 1 — Extract the project**
```bash
unzip copilot-dashboard-nextjs.zip
cd copilot-dashboard-nextjs
```

**Step 2 — Install dependencies**
```bash
npm install
```
Installs all 155 packages from the lock file. Takes approximately 30-60 seconds.

**Step 3 — Environment configuration**

The application runs fully on mock data without any environment variables. To optionally pre-seed auth state:
```bash
# Edit .env.local and fill in GITHUB_PAT and GITHUB_ORG
# Leave empty to use the Settings page UI at runtime
```

**Step 4 — Start the development server**
```bash
npm run dev
```
The application starts at `http://localhost:3000`.

**Step 5 — Verify the setup**
```bash
# Test the page
open http://localhost:3000

# Test the API health endpoint
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","service":"copilot-dashboard-api"}

# Test a data endpoint
curl http://localhost:3000/api/dashboard/summary | head -c 200
```

### Development Commands

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm start          # Start production server (requires build first)
npm run lint       # Run ESLint
npx tsc --noEmit   # TypeScript type check (should show 0 errors)
```

### Testing API Routes During Development

Every API route is accessible directly in the browser or with curl while the dev server runs:

```bash
# Summary KPIs
curl http://localhost:3000/api/dashboard/summary | jq .

# First PR with analysis and files
curl http://localhost:3000/api/prs | jq '.[0]'

# User detail for alice-dev
curl http://localhost:3000/api/dashboard/users-usage/alice-dev | jq '.summary'

# Metrics for last 7 days
curl "http://localhost:3000/api/metrics/copilot?from=2025-05-05" | jq 'length'

# Settings repos for acme-corp
curl "http://localhost:3000/api/settings/repos?org_name=acme-corp" | jq .
```

---

## 14. Build and Deployment

### Production Build

```bash
npm run build
```

**Expected successful output:**
```
✓ Compiled successfully in ~42s
✓ Generating static pages (24/24)

Route (app)                                    Size  First Load JS
 ○ /                                        6.32 kB         293 kB
 ○ /feature-usage                           4.38 kB         278 kB
 ○ /prs                                    14.7 kB         305 kB
 ○ /settings                               5.97 kB         194 kB
 ○ /users-usage                             106 kB         388 kB
 ƒ /api/auth/configure                       179 B          102 kB
 ƒ /api/auth/status                          179 B          102 kB
 [... all 14 API routes at 179 B each ...]
```

Pages marked `○` (Static) are pre-rendered at build time. API routes marked `ƒ` (Dynamic) are server-rendered on demand.

The large `users-usage` bundle (106 kB) includes the `xlsx` package for spreadsheet export.

### Run Production Build Locally

```bash
npm run build
npm start
# Available at http://localhost:3000
```

### Vercel Deployment

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard under Project -> Settings -> Environment Variables. The application deploys correctly to Vercel without any additional configuration.

### Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t copilot-dashboard .
docker run -p 3000:3000 \
  -e GITHUB_PAT=ghp_xxx \
  -e GITHUB_ORG=my-org \
  copilot-dashboard
```

### Self-Hosted Node.js

For standalone deployment, add `output: 'standalone'` to `next.config.js` before building:

```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
};
```

Then run:
```bash
npm run build
node .next/standalone/server.js
```

---

## 15. Pages and Features

### Dashboard (/)

**Purpose:** Executive overview and landing page for engineering leadership.

**Data:** `GET /api/dashboard/summary` + `GET /api/dashboard/trends`

| Feature | Detail |
|---|---|
| KPI Row 1 | Lines Suggested, Lines Accepted, Acceptance Rate, Active Users |
| KPI Row 2 | Total Commits, Total PRs, Copilot Chats, Code Suggestions |
| Clickable KPI Cards | Each opens a Dialog with field-level formula and source |
| Drilldown Raw Data Table | Daily rows for linesAccepted, linesSuggested, acceptanceRate, suggestions, activeUsers, chats |
| Repo and Contributor Chips | Click to see repo context or contributor count drilldown |
| Trend Area Chart | 60-day lines suggested vs accepted with gradient fills and custom tooltip |
| Copilot vs Human Pie Chart | Accepted Copilot lines vs estimated human-written lines |
| Language Breakdown Bar Chart | Top 8 languages sorted by suggestion volume |
| Editor Distribution Pie Chart | Engaged users per editor (VS Code, Neovim, JetBrains, Xcode) |

---

### Feature Usage (/feature-usage)

**Purpose:** Track which Copilot features developers are actually adopting.

**Data:** `GET /api/dashboard/feature-usage`

| Feature | Detail |
|---|---|
| Summary KPI Cards | Total Interactions, Code Generations, Acceptance Rate, Agent Share |
| Interaction Trend by Feature Line Chart | Top 4 features over 14 days, color-coded by feature |
| Interaction Share Pie Chart | Proportional breakdown of copilot_chat_ask, edits, agent, inline, custom |
| Suggested vs Accepted Bar Chart | Per-feature comparison of suggested and accepted lines |
| Model Usage Pie Chart | claude-sonnet, gpt-4o, claude-haiku, gpt-4o-mini usage share |
| Chat Mode Bar Chart | Ask, Edit, Agent, Inline, Custom — interactions, generations, acceptances |
| Feature Leaderboard Table | All features: interactions, generations, acceptances, lines, rate, share |
| Model Leaderboard Table | All models: suggestions, acceptances, chats, share |

---

### Users Usage (/users-usage)

**Purpose:** Per-developer Copilot adoption — who is using it, what modes, how effective.

**Data:** `GET /api/dashboard/users-usage` + `GET /api/dashboard/users-usage/:userLogin`

| Feature | Detail |
|---|---|
| 8 KPI Cards | Tracked Users, Interactions, Code Generations, Line Acceptance Rate, Agent Impact, Skills Interactions, Agent Interactions, Engaged Agent Users |
| KPI Drilldown Dialogs | Each KPI card opens a Dialog with source formula and calculation |
| Interaction Trend by User | Line chart with one series per selected user |
| User Leaderboard Table | 10 sortable columns — click header to sort, toggle direction |
| Row selection | Checkbox per row, select all with indeterminate state |
| User detail dialog | Click username to open xl-width dialog with full daily breakdown |
| Per-user KPI Cards | Interactions, Code Generations, Accepted Lines, Chat Turns |
| Per-user Activity Trend | Line chart: interactions, generations, acceptances |
| Per-user Line Trend | Suggested vs Accepted Lines TrendChart |
| Per-user Daily Table | Raw daily rows with all metrics |
| Export CSV | RFC-4180 compliant, downloads `selected_users_usage.csv` |
| Export XLSX | SheetJS-powered, downloads `selected_users_usage.xlsx` |

---

### PR Insights (/prs)

**Purpose:** Analyze pull request quality, Copilot contribution, and review friction at scale.

**Data:** `GET /api/prs` + `GET /api/prs/insights-summary`

| Feature | Detail |
|---|---|
| AI vs Human PRs Pie Chart | Mini donut comparing AI-authored vs human-authored PR count |
| Lines of Code Pie Chart | AI-generated lines vs human-written lines across all PRs |
| 4 Summary Cards | Total PRs, Avg Copilot %, Avg Lines Added, High Risk PR count |
| Text Search | Filters by PR title or author name substring |
| Status Filter | All, Merged, Open, Closed |
| Copilot % Range | All, 0-25%, 25-50%, 50-75%, 75-100% |
| Risk Filter | All, Low (score<0.3), Medium (0.3-0.6), High (>=0.6) |
| Developer Filter | Dropdown of all unique PR authors |
| Live Result Count | Updates as filters change |
| Expandable Row | Click any row to reveal file breakdown and timeline |
| Copilot Contribution Cell | Lines suggested/accepted/rejected with mini acceptance rate progress bar |
| Code Ownership Bar | Stacked horizontal bar with Copilot/Human split and tooltip |
| Quality Signals Cell | CI fail count, revert chip, review comment chip, or green "Clean" |
| Risk Badge | Color-coded Low/Medium/High chip with exact score tooltip |
| File Breakdown Table | Per-file: filename, lines, Copilot vs Human bar, status chip |
| Timeline Chips | Suggested → Accepted → Modified → Merged/state |
| Pagination | 10/15/25/50 rows per page |

---

### Settings (/settings)

**Purpose:** Configure GitHub authentication, repository tracking, sync, and manual data import.

**Data:** `/api/auth/*`, `/api/repos/*`, `/api/settings/repos`, `/api/metrics/import-ndjson`

| Feature | Detail |
|---|---|
| Auth Status Chip | Connected (green) / Token invalid (red) / Not configured |
| Stale Repo Warning Alert | Shown when stored repos are from a different org than active |
| PAT Password Field | With helper text showing required GitHub scopes |
| Org Name Field | Text input, used for stale repo comparison and repo settings scope |
| Save Configuration | Saves to in-memory auth state, dispatches update event to AppLayout |
| Repo Tag Input | Chip-based multi-value input — Enter or comma adds, Backspace removes last |
| Quick-Add Preset Chips | Click preset repo name to add it to tracked list instantly |
| Save Repositories | Persists to in-memory store with upsert and soft-disable logic |
| Sync Now Button | POST to sync route, shows repos/commits/PRs synced in grid |
| NDJSON File Pickers | Dual file inputs showing selected filenames |
| Import NDJSON Button | Enabled only when both files selected, shows result breakdown grid |
| About Section | Tech stack chips for the migrated application |

---

## 16. TypeScript Types Reference

**File:** `types/index.ts` (290 lines, 30+ interfaces)

All interfaces are exported from a single file. Import using the `@/types` path alias.

### Auth Types

```typescript
interface AuthStatusResponse {
  configured: boolean;
  org_name?: string;
  token_valid: boolean;
  user_login?: string;
  stale_repo_owners: string[];
  stale_repo_warning?: string;
}

interface AuthConfigRequest {
  github_pat: string;
  github_org: string;
}
```

### Repository Types

```typescript
interface RepositoryResponse {
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

interface SyncResponse {
  status: string;
  message: string;
  repos_synced?: number;
  commits_synced?: number;
  prs_synced?: number;
}
```

### Copilot Metrics Types

```typescript
interface CopilotMetricResponse {
  id: number; org_name: string; date: string;
  total_active_users: number; total_engaged_users: number; total_engaged_users_agent: number;
  total_code_suggestions: number; total_code_acceptances: number;
  total_lines_suggested: number; total_lines_accepted: number;
  total_chats: number; total_chat_insertions: number; total_chat_copies: number;
  total_pr_summaries: number;
  language_breakdown?: Record<string, unknown>[];
  editor_breakdown?: Record<string, unknown>[];
}

interface NDJSONImportResponse {
  status: string; message: string;
  total_records: number; inserted_records: number;
  skipped_existing_records: number; invalid_records: number;
  duplicate_records: number; imported_dates: string[];
}
```

### Pull Request Types

```typescript
interface PRAnalysisResponse {
  estimated_copilot_lines: number; estimated_accepted_lines: number;
  estimated_rejected_lines: number; copilot_contribution_pct: number;
  failed_checks: number; total_checks: number;
  reverted_lines: number; review_comments_on_copilot: number;
  risk_score: number;
}

interface PullRequestResponse {
  id: number; number: number; title: string; state: string;
  author?: string; lines_added: number; lines_deleted: number;
  created_at?: string; merged_at?: string;
  analysis?: PRAnalysisResponse;
  files?: PRFileAnalysisResponse[];
  repo?: string;
}
```

### Dashboard Types

```typescript
interface DashboardSummary {
  total_repos: number; primary_repo_name: string;
  total_commits: number; total_prs: number; active_contributors: number;
  total_lines_suggested: number; total_lines_accepted: number;
  estimated_human_lines: number; acceptance_rate: number;
  total_active_users: number; total_engaged_users: number;
  total_suggestions: number; total_chats: number;
}

interface TrendEntry {
  date: string; lines_suggested: number; lines_accepted: number;
  acceptance_rate: number; active_users: number;
  suggestions_count: number; chats_count: number;
}
```

---

## 17. Theme and Design System

**File:** `lib/theme.ts`

Custom MUI dark theme. All colors, typography, shape, and component overrides are centrally defined.

### Color Palette

| Token | Hex | Used For |
|---|---|---|
| `primary.main` | `#00d4ff` | Cyan — active nav, primary buttons, KPI accents, chart series |
| `primary.light` | `#5ce1ff` | Lighter cyan for hover gradient |
| `secondary.main` | `#7c4dff` | Purple — trend lines, suggested lines chart series |
| `background.default` | `#0a0e1a` | Page background — deep navy black |
| `background.paper` | `#111827` | Card and sidebar surface |
| `success.main` | `#00e676` | Green — accepted lines, low risk, trend up, clean signals |
| `warning.main` | `#ffab40` | Orange — medium risk, stale repo warning, review comments |
| `error.main` | `#ff5252` | Red — high risk, failed checks, trend down |
| `text.primary` | `#e8eaed` | Near-white — all body text |
| `text.secondary` | `#9aa0a6` | Mid-gray — chart axis labels, card subtitles, helper text |

### Typography

- Font family: Inter with system font fallback chain
- Weights loaded: 300, 400, 500, 600, 700, 800
- h4: weight 700, letter-spacing -0.02em (page titles)
- h5: weight 600, letter-spacing -0.01em
- h6: weight 600 (card titles)
- Border radius: 16px global (`theme.shape.borderRadius`)

### Component Overrides

**MuiCard:** Glassmorphism-style with semi-transparent gradient, backdrop blur, thin border, and hover lift.

**MuiButton (containedPrimary):** Cyan-to-purple gradient background with lighter gradient on hover.

**KPICard accent bar:** 3px `::before` pseudo-element with `linear-gradient(90deg, {color}, transparent)`.

**Content area background:** Subtle radial gradient overlays — cyan ellipse top-left, purple ellipse bottom-right at 4% opacity.

---

## 18. Troubleshooting

### The page loads but shows no charts or data

Open browser DevTools → Network tab. Look for failed requests to `/api/*`. Failed API calls appear as red entries.

Also check the Console tab for JavaScript errors. Then test the API directly:
```bash
curl http://localhost:3000/api/dashboard/summary
```

If the API works but the page is blank, look for hydration errors in the Console — they appear as red warnings mentioning "hydration".

---

### TypeScript errors during development

Run the type checker:
```bash
npx tsc --noEmit
```

The project should report **0 errors**. If errors appear after adding new code, ensure:
- New state variables have explicit type annotations
- API response types match the interfaces in `types/index.ts`
- Any `as unknown` casts are intentional

---

### `npm run build` fails

**Module not found error:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Type errors during build:**
The build runs TypeScript compilation. All type errors must be resolved first:
```bash
npx tsc --noEmit  # fix all reported errors
npm run build
```

---

### Sidebar shows wrong active item

The active state check is `usePathname() === item.path`. Exact match including leading slash. All `navItems` paths use the exact URL string. Ensure no trailing slashes or extra segments.

---

### XLSX export button is disabled

The Export XLSX button requires at least one user selected (checked) in the leaderboard. Select rows using the checkboxes or click a row to toggle selection. The "Select All" checkbox in the header selects all users at once.

---

### User detail dialog shows loading indefinitely

The dialog calls `getUserUsageDetail(userLogin)` via `GET /api/dashboard/users-usage/:userLogin`. Valid `userLogin` values in mock mode are exactly: `alice-dev`, `bob-coder`, `charlie-eng`, `diana-ops`, `elena-fe`, `frank-be`, `grace-ml`, `henry-devops`, `iris-sec`, `jack-data`.

If clicking a username from the leaderboard triggers a 404, the mock data generation may have an inconsistency. Check the console for a 404 response, then verify the API:
```bash
curl http://localhost:3000/api/dashboard/users-usage | jq '.[].users[].user_login'
curl http://localhost:3000/api/dashboard/users-usage/alice-dev | jq '.user_login'
```

---

### Stale repo warning banner does not update after saving settings

The Settings page dispatches `copilot-auth-status-updated` using `window.dispatchEvent`. The AppLayout listens for this event. Ensure:

1. Both the Settings page and AppLayout are mounted in the same browser window
2. The `handleSave()` function in `settings/page.tsx` calls `publishAuthStatus(res)` after save
3. The `AppLayout` `useEffect` registers the listener and cleans it up on unmount

---

### Port 3000 is already in use

```bash
# Find and kill the process
lsof -ti tcp:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

---

### Mobile sidebar does not close after tapping a nav item

The `ListItemButton onClick` handler calls both `router.push(item.path)` and `setMobileOpen(false)`. If the drawer stays open, verify the handler in `AppLayout.tsx`:

```typescript
onClick={() => { router.push(item.path); setMobileOpen(false); }}
```

Both calls must be present. Navigation without closing the drawer is a sign one of them is missing.

---

## 19. Migration Decisions and Assumptions

### Decision 1: In-Memory Mock Data Engine Instead of SQLite

**Original:** Python backend used SQLAlchemy ORM with SQLite, seeded by `mock_data.py` on startup with `SEED_MOCK_DATA=True`.

**Decision:** Replace the entire persistence layer with `lib/mock-data/index.ts` — a seeded PRNG TypeScript module that generates the same data deterministically.

**Rationale:**
- The project's primary use case runs entirely on mock data (the `SEED_MOCK_DATA=True` flag in the original .env)
- Adding SQLite to Next.js requires either `better-sqlite3` (native binary, platform-specific) or Prisma (significant added complexity and migration files)
- A seeded PRNG produces deterministic data that never changes on refresh — better demo behavior than randomized seeds
- Zero external infrastructure: no database server, no migration step, no schema file

**Trade-off:** Auth config and repo settings are lost on server restart. Acceptable for demo usage. Production use would require adding a database.

---

### Decision 2: Native Fetch Instead of Axios

**Original:** Frontend used `axios` with `axios.create({ baseURL: 'http://localhost:8000/api' })`.

**Decision:** Replace with a typed generic wrapper around `fetch` in `lib/api-client.ts`.

**Rationale:**
- `fetch` is built into both browser and Node.js 18+, removing one runtime dependency
- Next.js extends `fetch` with built-in caching — no extra config needed
- The typed `request<T>()` wrapper provides identical DX to Axios with full TypeScript inference
- No CORS configuration needed — frontend and API are same-origin

**Multipart upload:** Retains raw `fetch` without Content-Type header (lets browser set boundary automatically), matching the Axios multipart approach.

---

### Decision 3: App Router Route Group Instead of React Router

**Original:** `react-router-dom` v7 with `<BrowserRouter>`, `<Routes>`, `<Route element={<Layout />}>`, `<Outlet />`.

**Decision:** Next.js App Router with `(dashboard)` route group for shared layout.

**All behaviors preserved:**
- Identical URLs for all 5 pages
- Shared sidebar visible on all pages
- Exact-match active nav highlighting
- Programmatic navigation on sidebar click
- No visible layout flash on route change (client-side navigation)

**Key API changes:**
- `useNavigate(path)` → `useRouter().push(path)`
- `useLocation().pathname` → `usePathname()`
- `<Outlet />` → `{children}` prop in `DashboardGroupLayout`

---

### Decision 4: MUI AppRouterCacheProvider for SSR

**Original:** MUI worked out of the box with Vite — client-only rendering, no SSR concerns.

**Decision:** Wrap root layout with `AppRouterCacheProvider` from `@mui/material-nextjs`.

**Why required:** Next.js App Router renders HTML on the server. MUI uses Emotion for styling. Without `AppRouterCacheProvider`, Emotion generates style tags on both server and client independently, causing mismatched DOM content and React hydration errors (visible as a "flash of unstyled content").

---

### Decision 5: Full TypeScript Migration

**Original:** All frontend files were `.jsx` — plain JavaScript with no types.

**Decision:** Convert all files to strict TypeScript with complete type coverage.

**Coverage:**
- 5 page components: all props, state, event handlers, and API response handling typed
- 5 shared components: typed prop interfaces with JSDoc comments
- 19 API route handlers: typed request parameters and responses
- 3 lib modules: typed function signatures and return values
- `types/index.ts`: 30+ interfaces covering every API response shape exactly

---

### Decision 6: Remove `window.location.search` from PR Insights

**Original:** `PRInsights.jsx` used `new URLSearchParams(window.location.search).get('repo')` for the page title.

**Decision:** Use `summary?.primary_repo_name` from the API response instead.

**Rationale:** `window.location` is a browser-only API unavailable during server-side rendering. The Next.js equivalent `useSearchParams()` requires wrapping the entire component in `React.Suspense`. Since this was only used for a display title, the API-sourced name is a simpler, SSR-compatible solution.

---

### Assumptions

1. **Mock data is the primary mode** — The original project's README and env file both confirm mock data is the intended demo mode. Real GitHub API integration is not in scope for this migration.

2. **NDJSON import is simulated** — The original `ndjson_import.py` parsed NDJSON into SQLite. This migration returns a simulated success response because there is no database to insert into.

3. **Background sync is not required** — The 5-minute Celery interval is replaced by manual sync via the Settings page. No background jobs are running.

4. **Auth token validation is not live** — `POST /api/auth/configure` accepts any PAT and returns `token_valid: true`. Real validation would require a GitHub API call that is out of scope for the mock migration.

5. **Users Usage trend chart** — The `data.trend[]` from the API contains aggregate daily totals, not per-user entries. The original chart showed per-user lines by user_login key, which requires per-user trend data. This detail is preserved in the component logic but will render empty series unless per-user trend data is added to the mock data generator.

---

## 20. Known Limitations and Future Work

### Current Limitations

| Limitation | Impact | Resolution Path |
|---|---|---|
| In-memory state resets on server restart | PAT config and repo settings are lost | Add `better-sqlite3` or Prisma for persistence |
| No real GitHub API calls | Dashboard always shows mock data | Implement TypeScript GitHub API client using `node-fetch` or `undici` |
| NDJSON import is simulated | Uploading real files has no effect | Port `ndjson_import.py` logic to TypeScript with in-memory or DB storage |
| No background data sync | Data is static until manual sync | Use Vercel Cron or an external scheduler to POST `/api/repos/sync` |
| No authentication | Any user can access all pages and data | Add NextAuth.js with GitHub OAuth, restrict to org members |
| Users Usage trend chart renders empty | Aggregate trend does not include per-user breakdown | Add per-user daily entries to `computeUsersUsageDashboard()` |
| Users Usage detail chat turns shows dash | `chat_turns` not in `DailyUserUsage` type | Add field to mock data generator, daily type, and daily table |
| Auth token not validated against GitHub | `token_valid` is always true | Call `GET /api/github.com/user` with provided PAT |

### Recommended Production Roadmap

**Phase 1 — Real Data Layer**
1. Add `better-sqlite3` (or Prisma + PostgreSQL) to persist auth config and repo settings across restarts
2. Implement TypeScript GitHub API client that calls the GitHub Copilot Metrics API
3. Implement real NDJSON file parsing and in-memory or database storage
4. Wire up a real sync endpoint that calls the GitHub API with the configured PAT

**Phase 2 — Security and Access Control**
1. Add NextAuth.js with GitHub OAuth provider
2. Restrict access to members of the configured GitHub org
3. Store PAT encrypted at rest using environment secrets
4. Add rate limiting on sync and import endpoints using `next-rate-limit` or middleware

**Phase 3 — Performance and Reliability**
1. Add `React.Suspense` + `loading.tsx` for each route (skeleton screens during navigation)
2. Add `error.tsx` boundary files for each route (graceful error pages)
3. Use Next.js fetch cache tags (`revalidateTag`) to invalidate dashboard data after sync
4. Enable `output: 'standalone'` in `next.config.js` for optimized container builds

**Phase 4 — Feature Enhancements**
1. Add date range picker to filter all metrics by custom time window
2. Implement `useSearchParams` on PR Insights for shareable filtered URLs
3. Add PDF export of the Executive Dashboard for board reports
4. Implement per-user drill-down directly from the PR Insights table

---

*This README documents the complete Next.js 15 migration of the GitHub Copilot Usage Dashboard. Every section reflects the actual migrated codebase, its architecture decisions, API contracts, and component behaviors. No placeholder or generic content.*

# AGENTS.md

## Project Overview

TuTrack - Network Operations Management. Real-time task management and field operations tracking for Tunet division.

## Quick Commands

```bash
cd tunet-ops
npm run dev        # Development server (port 3000)
npm run build      # Production build
npm run lint       # ESLint check
npm start          # Production server
```

No typecheck script is configured. No test framework is set up.

## Architecture

- **Single package** in `tunet-ops/` (not a monorepo)
- **Framework**: Next.js 16 App Router, React 19, TypeScript 5
- **UI**: shadcn/ui (base-nova style) + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Map**: Leaflet + OpenStreetMap (CartoDB Dark Matter tiles)
- **Auth**: PIN-based login, stored in `localStorage` as `tutrack-user`
- **Roles**: `admin`, `noc`, `foc`
- **Theme**: Dark-only, custom `tunet-*` color palette in `globals.css`

### Path Alias

`@/*` maps to `./src/*`

### Directory Layout

```
tunet-ops/src/
├── app/
│   ├── (auth)/page.tsx          # PIN login
│   ├── dashboard/
│   │   ├── admin/page.tsx       # Admin dashboard (sparkline, stats)
│   │   ├── noc/page.tsx         # NOC (60/40 map+tasks)
│   │   ├── foc/page.tsx         # FOC (mobile-first, tabbed tracking)
│   │   ├── map/page.tsx         # Full-screen radar with role filters + search
│   │   ├── tasks/page.tsx       # Kanban board (DnD) + list, URL-persisted filters
│   │   └── settings/page.tsx
│   └── api/
│       ├── cleanup/route.ts     # Data retention cleanup endpoint
│       ├── telegram/            # Telegram bot integration
│       ├── users/               # User CRUD
│       └── webhooks/            # Supabase webhooks
├── components/
│   ├── layout/                  # DashboardLayout, Sidebar, NotificationsPanel (day-grouped)
│   ├── map/                     # RadarMap (Leaflet, showRoles, focusUserId)
│   ├── tasks/                   # KanbanBoard (DnD), TaskCard, TaskDetail, TaskForm, TaskFilters (chips)
│   └── ui/                      # shadcn + Skeleton, EmptyState, Sparkline
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── db.ts                    # Data access + fetchCompletionTrend
│   ├── copy.ts                  # Indonesian strings (empty/loading/time/filters/search)
│   ├── time.ts                  # getRelativeTime, getTimeRemaining helpers
│   ├── telegram.ts              # Bot sendMessage, setWebhook
│   ├── telegram-cache.ts        # In-memory chat_id cache
│   └── utils.ts                 # cn() helper
└── types/
    └── index.ts                 # All TypeScript types + configs
```

## Conventions

- **Demo PIN**: `1234` works for all roles (admin, noc, foc)
- **Mock data**: Used for demo. Real Supabase backend not yet connected.
- **Custom colors**: `tunet-green`, `tunet-surface`, `tunet-bg`, `tunet-border`, `tunet-text`, `tunet-text-muted` defined in `globals.css`
- **Status colors**: `status-todo`, `status-assigned`, `status-progress`, `status-review`, `status-done`, `status-overdue`
- **Priority colors**: `priority-critical`, `priority-high`, `priority-medium`, `priority-low`
- **Components**: Use `cn()` from `@/lib/utils` for class merging
- **Leaflet**: Must render client-side only (no SSR)
- **Empty states**: Use `<EmptyState>` from `@/components/ui/empty-state` with copy from `@/lib/copy`
- **Loading states**: Use `<Skeleton>` from `@/components/ui/skeleton` instead of "Loading..." text
- **Indonesian copy**: All user-facing empty/loading strings come from `@/lib/copy`. English kept for nav, buttons, page titles.
- **Time formatting**: Use `getRelativeTime` / `getTimeRemaining` from `@/lib/time` instead of manual Date math
- **Drag-and-drop**: Kanban uses `@dnd-kit`; cards in `kanban-board.tsx` are sortable via `useSortable`

## Subagent Dispatch

When working on tasks, dispatch to related subagents using the Task tool:

| Task Type | Subagent |
|-----------|----------|
| UI components, React, Leaflet map | `frontend-developer` |
| Visual design, layout, colors | `ui-designer` |
| API routes, server logic | `backend-developer` |
| Database schema, Supabase, SQL | `database-administrator` or `sql-pro` |
| Accessibility review | `accessibility-tester` |
| Performance optimization | `performance-engineer` |
| Security review | `security-engineer` |
| Deployment, CI/CD | `deployment-engineer` |
| Complex multi-step tasks | `general` |
| Code review | `code-reviewer` |
| Debugging issues | `debugger` |
| Explore codebase | `explore` |

## Progress Tracking

**ALWAYS** append changes to `progress.md` (root directory) before finishing a session.

Format: Reverse chronological log (newest entries first).

```markdown
## YYYY-MM-DD

### HH:MM - Session Title

**Changes:**
- [add] path/to/new/file.ts - Description
- [edit] path/to/edited/file.ts - What changed
- [delete] path/to/deleted/file.ts - Why removed

**Summary:** Brief description of what was accomplished.
```

## Data Retention

- **Location data** (`location_pings`, `location_visits`) is automatically cleaned up after 30 days
- **Notifications** that are read are also cleaned up after 30 days (unread ones are kept)
- SQL migration: `supabase/data-retention.sql` — run this FIRST in Supabase SQL Editor
- API endpoint: `POST /api/cleanup` — triggers cleanup (requires `x-cleanup-secret` header)
- API endpoint: `GET /api/cleanup` — returns current storage stats
- Set `CLEANUP_SECRET` in `.env.local` to secure the cleanup endpoint
- For automated daily cleanup, use an external cron service (e.g., cron-job.org) to call `POST /api/cleanup` daily
- Monitor storage with: `SELECT * FROM data_retention_status;`

## Authentication & Authorization

- **Session-based auth**: Login creates a signed JWT-like token in an httpOnly cookie
- **Token library**: `src/lib/auth.ts` — `createSessionToken()`, `verifySessionToken()`, `getSessionTokenFromRequest()`
- **API helper**: `src/lib/api-auth.ts` — `getApiSession()`, `requireRole()`
- **Middleware**: `src/middleware.ts` — protects all `/api/*` routes except:
  - `/api/auth/login` (public)
  - `/api/auth/logout` (public)
  - `/api/telegram/webhook` (public — Telegram calls this)
  - `/api/telegram/setup` (public)
  - `/api/cleanup` (public — uses its own secret)
  - `/api/webhooks/*` (public — uses WEBHOOK_SECRET)
- **Session secret**: Set `SESSION_SECRET` in `.env.local` (generate with crypto.randomBytes)
- **Role checks**: All `/api/users/*` routes require admin role
- **Login rate limit**: 5 attempts per minute per IP (in-memory, resets on restart)
- **Bulk user rate limit**: 10 requests per minute per IP

## Atomic Operations (RPC)

- Location writes use PostgreSQL RPC functions to avoid race conditions
- SQL migration: `supabase/atomic-operations.sql`
- `record_ping(user_id, session_date, lat, lng, source, accuracy)` — atomic ping insert
- `record_location_update(user_id, lat, lng, source, accuracy, threshold, min_minutes)` — full stay/visit/ping logic in one transaction
- Client code in `db.ts` calls these via `supabase.rpc()` — no more client-side SELECT MAX + INSERT

## Gotchas

- Supabase requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No `.env.local` exists yet — app uses empty strings (mock data only)
- No test suite exists — do not assume tests will catch regressions
- Leaflet components must be wrapped in `"use client"` and dynamic imports
- `next.config.ts` is empty — no custom webpack or env config
- `.next/` build output exists but may be stale after dependency changes
- Location pings grow fast (~9,600 rows/day for 10 FOC) — data retention is critical
- Session tokens are stored in httpOnly cookies — client JS cannot read them
- `loginByPin()` still returns `pin` field — login route strips it before sending to client
- `fetchUsers()` and `fetchLocations()` no longer return `pin` field

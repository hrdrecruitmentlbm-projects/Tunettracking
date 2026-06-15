# AGENTS.md

## Project Overview

TunetOps - Network Operations Management. Real-time task management and field operations tracking for Tunet division.

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
- **Auth**: PIN-based login, stored in `localStorage` as `tunetops-user`
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
│   │   ├── admin/page.tsx       # Admin dashboard
│   │   ├── noc/page.tsx         # NOC (60/40 map+tasks)
│   │   ├── foc/page.tsx         # FOC (mobile-first)
│   │   ├── map/page.tsx         # Full-screen radar
│   │   ├── tasks/page.tsx       # Kanban board
│   │   └── settings/page.tsx
│   └── api/                     # API routes
├── components/
│   ├── layout/                  # DashboardLayout, Sidebar
│   ├── map/                     # RadarMap (Leaflet)
│   ├── tasks/                   # KanbanBoard, TaskCard
│   └── ui/                      # shadcn components
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── mock-data.ts             # Demo users/tasks/locations
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

## Gotchas

- Supabase requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No `.env.local` exists yet — app uses empty strings (mock data only)
- No test suite exists — do not assume tests will catch regressions
- Leaflet components must be wrapped in `"use client"` and dynamic imports
- `next.config.ts` is empty — no custom webpack or env config
- `.next/` build output exists but may be stale after dependency changes

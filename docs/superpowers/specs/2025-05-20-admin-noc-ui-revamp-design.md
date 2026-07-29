# Design Spec: Admin & NOC UI/UX Revamp

**Date:** 2025-05-20  
**Topic:** Admin & NOC Dashboards UI/UX Modernization & Functional Optimization  
**Target Application:** TuTrack (Network Operations Management)

---

## Executive Summary

This specification defines the UI/UX revamp for the **Admin Dashboard** (`/dashboard/admin`) and **NOC Dashboard** (`/dashboard/noc`). The goal is to eliminate visual clutter, optimize data hierarchy, and introduce dynamic workspace controls to maximize operator productivity during daily monitoring and emergency network incident dispatching.

---

## 1. Admin Dashboard Revamp (`src/app/dashboard/admin/page.tsx`)

### Objectives
- Re-architect the dashboard into a clear 3-tier visual hierarchy.
- Reduce visual noise while highlighting actionable SLA metrics and active field resources.
- Modernize layout using clean tabs for secondary data analytics.

### Architecture & Components

```
+-----------------------------------------------------------------------------------+
| Tier 1: Top KPI Strip (4 Compact Grid Cards with Trend Badges & Pulse Indicators) |
+------------------------------------------+----------------------------------------+
| Tier 2: Core Command Grid (2:1 Ratio)    | Priority Radar Widget                  |
| - Consolidated Pipeline Bar              | - Expiring Tasks List (Top 5)          |
| - Daily Activity Chart                   | - Direct Action Triggers               |
+------------------------------------------+----------------------------------------+
| Tier 3: Tabbed Operations Panel                                                   |
| [ Tab 1: Tim & Per-User Activity | Tab 2: Completion Trend | Tab 3: System Logs ]  |
+-----------------------------------------------------------------------------------+
```

#### Tier 1: Top KPI Strip
1. **Active Overdue Tasks**: Large count in `status-overdue`, animated pulse dot, comparing today vs yesterday.
2. **Live Technicians Online**: Active connection count using `useHeartbeat` with role pill breakdown (`FOC`, `NOC`, `MKT`).
3. **Active Workload**: In-progress tasks count with circular completion rate ring.
4. **24h Completion Rate**: Percentage badge with sparkline trend for 14-day completion lookback.

#### Tier 2: Core Command Workspace (2:1 Grid Ratio)
- **Main Section (2 cols)**: Combined status pipeline bar and smooth gradient daily activity chart.
- **Side Section (1 col)**: Expiring & Overdue Tasks Radar widget showing closest deadlines with `getTimeRemaining()`, assignee badges, and quick-action view buttons.

#### Tier 3: Operational Detail Tabs
Tabbed interface replacing long vertical scrolling cards:
- **`Tim & Per-User Activity`**: Technician performance metrics (tasks assigned/completed, last ping time).
- **`Analitik Trend`**: 14-day completion trend chart.
- **`Status Sistem`**: Heartbeat count & data retention storage stats.

---

## 2. NOC Dashboard Revamp (`src/app/dashboard/noc/page.tsx`)

### Objectives
- Replace fixed 60/40 map/task split with dynamic workspace layout switcher.
- Provide interactive map HUD overlay for instant filtering.
- Modernize horizontal Kanban task sidebar for quick triage.

### Architecture & Layout Controls

#### Layout Switcher Header
Operator-controlled split buttons:
- `🗺️ Split (50/50)` - Default balanced command view.
- `🌍 Map Focus (70/30)` - Expanded map area for geo-incident tracking.
- `📋 List Focus (30/70)` - Expanded task list for heavy dispatch operations.
- `🖥️ Full Map (100/0)` - Full-screen radar view.

#### Interactive Map HUD Filter Bar
Floating glassmorphic pill bar overlaid on top-right of `RadarMap`:
- **Filters**: `[ Semuanya | ⚡ Outage / Kritis | 🔴 Overdue | 🟢 FOC Aktif ]`
- Filter selections dynamically isolate map markers and pulse highlighted nodes.

#### Modernized Task Sidebar
- High-contrast status badges (`status-todo`, `status-progress`, `status-done`, `status-overdue`).
- Quick-action Telegram dispatch button on task cards.
- Full Task Detail modal integration on card click.

---

## 3. UI Tokens & Styling Guidelines

- **Backgrounds**: `bg-tunet-bg` (`#0a0d12`), `bg-tunet-surface` (`#121721`), `border-tunet-border` (`#1e2638`).
- **Accents**: `tunet-green` (`#00e599`) for active pings and success indicators.
- **Typography**: Numeric data strictly styled with `tabular-nums` and `font-display`.
- **Interactions**: Smooth flex transitions (`transition-all duration-300`) when toggling layout modes.

---

## 4. Verification & Testing Criteria

1. **Admin Page**: Verify correct layout rendering, tab switching, and zero layout shift on mock data load.
2. **NOC Page**: Test view switcher (`50/50`, `70/30`, `30/70`, `100/0`) ensuring map resizes cleanly without rendering issues.
3. **Build Check**: Ensure `npm run lint` and Next.js build compile cleanly with no errors.

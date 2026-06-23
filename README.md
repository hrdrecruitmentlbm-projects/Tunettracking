# TuTrack - Tunet Tracker

Real-time task management and field operations tracking for Tunet division.

## Features

- **Task Management** - Kanban board with 5-stage workflow (To Do → Assigned → In Progress → Review → Done)
- **Real-time Radar Map** - Track FOC & NOC locations live with Leaflet + OpenStreetMap
- **Priority System** - Custom priorities (Critical, High, Medium, Low) with SLA tracking
- **Role-based Access** - Admin, NOC, and FOC roles with different dashboards
- **PIN Authentication** - Simple PIN-based login for field workers
- **Mobile Responsive** - Full feature parity on mobile devices

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Map:** Leaflet + OpenStreetMap (CartoDB Dark Matter tiles)
- **Database:** PostgreSQL (Supabase) with PostGIS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for production)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd tunet-ops

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Demo PINs

- `1234` - Works for Admin, NOC, and FOC roles

## Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Enable PostGIS extension
4. Update environment variables

## Project Structure

```
tunet-ops/
├── src/
│   ├── app/
│   │   ├── (auth)/page.tsx      # PIN login
│   │   ├── dashboard/
│   │   │   ├── admin/page.tsx   # Admin dashboard
│   │   │   ├── noc/page.tsx     # NOC dashboard (60/40 split)
│   │   │   ├── foc/page.tsx     # FOC dashboard (mobile-first)
│   │   │   ├── map/page.tsx     # Full-screen radar
│   │   │   ├── tasks/page.tsx   # Task board
│   │   │   └── settings/page.tsx
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── layout/              # Sidebar, dashboard layout
│   │   ├── map/                 # Radar map component
│   │   ├── tasks/               # Task card, kanban board
│   │   └── ui/                  # shadcn components
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── mock-data.ts         # Demo data
│   │   └── utils.ts
│   └── types/
│       └── index.ts             # TypeScript types
├── supabase/
│   └── schema.sql               # Database schema
└── package.json
```

## Key Features

### NOC Dashboard
- 60/40 split view: Map (60%) + Task board (40%)
- Real-time FOC location tracking
- Task delegation with proximity suggestions

### FOC Dashboard
- Mobile-first design
- Personal task list
- Location sharing toggle

### Radar Map
- Dark map tiles (CartoDB Dark Matter)
- Color-coded markers: Green (active), Yellow (idle), Red (overdue)
- Real-time updates via Supabase Realtime

## Next Steps

- [ ] Connect to real Supabase backend
- [ ] Implement Telegram bot integration
- [ ] Add file attachments to tasks
- [ ] Implement offline support
- [ ] Add notifications center
- [ ] Create "Find nearest FOC" feature

# HostelHub

A comprehensive hostel management system for IIT Roorkee, built for students, wardens, secretaries, and administrators.

## Features

### For Students
- **Complaint Management** — Submit and track maintenance/hostel complaints with real-time status updates
- **Mess Portal** — View weekly menus, generate meal tokens, and check mess schedules
- **Community Forum** — Anonymous or identified posts for bhawan discussions
- **Gate Pass System** — Request and track leave passes
- **Notice Board** — View announcements from wardens and administration

### For Wardens & Secretaries
- **Complaint Dashboard** — Review, assign, and resolve complaints across categories
- **Student Management** — View resident lists and room assignments
- **Notice Publishing** — Create and publish announcements to students

### For Central Administration
- **Multi-Bhawan Oversight** — Manage complaints and operations across all hostels
- **Analytics** — Track complaint resolution rates and operational metrics
- **Role Management** — Assign and manage user roles

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Convex (real-time database + serverless functions)
- **Authentication:** Convex Auth (Google OAuth + Email OTP)
- **Routing:** React Router v7
- **Animations:** Framer Motion
- **State Management:** Convex reactive queries

## Project Structure

```
src/
├── components/
│   ├── app/              # Feature views (Complaints, Mess, Community, etc.)
│   ├── features/dashboard/  # Role-specific dashboards
│   ├── landing/          # Public landing page
│   └── ui/               # shadcn/ui primitives
├── convex/               # Backend schema, queries, mutations, actions
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
└── pages/                # Route-level components (Auth, Dashboard, NotFound)
```

## Setup

### Prerequisites
- Node.js 18+
- Bun package manager
- Convex account

### Installation

```bash
# Install dependencies
bun install

# Start Convex backend
bunx convex dev

# Start frontend (in separate terminal)
bun run dev
```

### Environment Variables

The following environment variables are required:

**Frontend (Vite):**
- `VITE_CONVEX_URL` — Your Convex deployment URL

**Backend (Convex):**
- `CONVEX_SITE_URL` — Convex site URL (auto-configured)
- `GOOGLE_CLIENT_ID` — Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret (optional)
- `FREEBUFF_OTP_API_KEY` — Email OTP service API key

## Authentication

HostelHub uses **@iitr.ac.in** email addresses for authentication:

1. **Google OAuth** — Primary method for institute Google accounts
2. **Email OTP** — Fallback for email-based verification

Domain restrictions ensure only IIT Roorkee accounts can access the system.

## Role System

| Role | Access Level |
|------|--------------|
| Student | Basic features (complaints, mess, community) |
| Warden | Bhawan-level management |
| Secretary | Bhawan administration |
| Admin | Cross-bhawan oversight |

## Development

### Adding New Features

1. **Backend:** Add queries/mutations in `src/convex/`
2. **Frontend:** Create view components in `src/components/app/`
3. **Routing:** Update routes in `src/main.tsx`
4. **Auth:** Use `RequireAuth` wrapper for protected routes

### Conventions

- Use `useAuth()` hook for authentication state
- Prefer Convex reactive queries over client state
- Use shadcn/ui components from `src/components/ui/`
- Follow the existing role-based dashboard pattern
- Use Framer Motion for animations

## License

Private — IIT Roorkee Hostel Administration

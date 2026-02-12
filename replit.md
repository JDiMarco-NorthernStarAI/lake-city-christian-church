# Lake City Christian Church Website

## Overview

This is a full-stack church website for Lake City Christian Church (LC3/LCCC) located in Middleburg Heights, OH. The site serves as both a public-facing church website and includes a built-in admin CMS so non-technical church staff can manage content. The mission statement is: "Lake City Christian Church exists to connect people to a life-changing relationship with Jesus."

The public site includes pages for: Home, About (Our Story, What We Believe, Leadership), Ministries (Kids, Students, Small Groups, Connect & Serve), Encounter (sermons), Announcements, Give, Plan a Visit, and Contact. The admin dashboard at `/admin` provides CRUD management for sermons, events, team members, contact submissions, connect cards, and site settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router, not React Router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming. The design uses a dark/black aesthetic with blue gradient accents (#00D4FF → #0088DD → #0033AA). Church photos render in black & white via CSS grayscale filters.
- **Animations**: Framer Motion for scroll-triggered fade-in animations and page transitions
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Fonts**: Inter, Montserrat, DM Sans loaded via Google Fonts
- **Icons**: Lucide React for UI icons, react-icons for social media icons

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via TSX
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Authentication**: Session-based auth using express-session with connect-pg-simple for session storage in PostgreSQL. Passwords hashed with bcryptjs. Role-based access control (admin = full access, editor = assigned sections only).
- **Development**: Vite dev server middleware integrated into Express for HMR during development
- **Production Build**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with drizzle-kit for schema management
- **Schema Location**: `shared/schema.ts` — shared between client and server
- **Schema Push**: `npm run db:push` uses drizzle-kit push (no migration files needed for dev)
- **Tables**: users, sermons, events, team_members, contact_submissions, connect_cards, site_settings, plus session table auto-created by connect-pg-simple

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface with a database-backed implementation using Drizzle
- All database operations go through the storage abstraction

### Seed Data
- `server/seed.ts` creates a default admin user (username: "admin", password: "lakecity2024") and populates initial team members, sermons, and other content on first run

### Project Structure
```
client/               # Frontend React application
  src/
    components/       # Shared components (navbar, footer)
      ui/             # Shadcn/ui components
    pages/            # Route page components
    hooks/            # Custom React hooks
    lib/              # Utilities (queryClient, cn helper)
server/               # Backend Express application
  index.ts            # Entry point, Express setup
  routes.ts           # API route definitions
  storage.ts          # Database storage interface and implementation
  db.ts               # Drizzle/PostgreSQL connection
  seed.ts             # Initial data seeding
  vite.ts             # Vite dev middleware integration
  static.ts           # Production static file serving
shared/               # Shared code between client and server
  schema.ts           # Drizzle schema + Zod validation schemas
attached_assets/      # Static image assets (logos, church photos)
migrations/           # Drizzle migration output directory
```

### Key Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets` (Vite only)

### Build & Run Commands
- `npm run dev` — Development server with HMR
- `npm run build` — Production build (Vite + esbuild)
- `npm start` — Run production build
- `npm run db:push` — Push schema changes to database
- `npm run check` — TypeScript type checking

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable. Used for all application data and session storage.

### Third-Party Services (referenced in the app)
- **YouTube** — Sermon videos embedded via YouTube URLs, thumbnails fetched from `img.youtube.com`
- **Google Fonts** — Typography (Inter, Montserrat, DM Sans, etc.)
- **Tithe.ly** — External giving/donation platform (linked to, not integrated)

### Key NPM Dependencies
- `drizzle-orm` + `drizzle-kit` — Database ORM and schema tooling
- `express` + `express-session` — HTTP server and session management
- `connect-pg-simple` — PostgreSQL session store
- `bcryptjs` — Password hashing
- `@tanstack/react-query` — Client-side data fetching/caching
- `framer-motion` — Animations
- `wouter` — Client-side routing
- `zod` + `drizzle-zod` — Schema validation
- `react-hook-form` — Form state management
- Shadcn/ui ecosystem (Radix UI primitives, class-variance-authority, tailwind-merge, clsx)
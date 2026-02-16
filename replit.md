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
- **API Pattern**: Two API layers:
  - `/api/*` — Legacy endpoints for web admin dashboard (session-based auth)
  - `/api/v1/*` — Versioned RESTful API for web app, iOS, and Android (JWT-based auth)
- **Authentication (Web Admin)**: Session-based auth using express-session with connect-pg-simple for session storage in PostgreSQL.
- **Authentication (V1 API)**: JWT access tokens (15-minute expiry) + refresh tokens (30-day expiry, hashed and stored in database). Supports device tracking and multi-device logout. Frontend auth via AuthProvider context (`client/src/hooks/use-auth.tsx`) with localStorage token storage and automatic refresh. Public pages: /login, /register, /account.
- **RBAC**: 6 roles (member, student_ministry, kids_ministry, small_group, admin, super_admin) with configurable feature permissions via rolePermissions table. Users can have multiple roles simultaneously; enabled features are the union of all role permissions. super_admin always has full access.
- **Passwords**: Hashed with bcryptjs (12 rounds for v1 API, 10 rounds for legacy admin).
- **Development**: Vite dev server middleware integrated into Express for HMR during development
- **Production Build**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with drizzle-kit for schema management
- **Schema Location**: `shared/schema.ts` — shared between client and server
- **Schema Push**: `npm run db:push` uses drizzle-kit push (no migration files needed for dev)
- **Tables**: users, sermons, events, team_members, contact_submissions, connect_cards, site_settings, plus session table auto-created by connect-pg-simple
- **V1 API Tables**: refresh_tokens (JWT refresh token storage with device tracking), event_signups (event registration with waitlist support), children (kids ministry registration)
- **Form Builder Tables**: forms (configurable forms with slug, status, settings), form_fields (fields with type, order, options), form_submissions (submitted data as JSONB)
- **Donation Tables**: donation_funds (named giving categories with slug/active status), donations (amount in cents, frequency, Stripe session/payment/subscription IDs, status tracking)
- **Push Notification Tables**: push_subscriptions (endpoint, VAPID keys, user/device tracking), notification_logs (title, body, type, delivery stats)
- **Sign Ups Tables**: signup_events (event registration with form linkage, capacity, waitlist, categories, post-submission display settings), signup_submissions (user registrations with status, check-in tracking, waitlist position)

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
  v1-routes.ts        # V1 API routes (JWT auth, events, children, users)
  jwt.ts              # JWT token generation, verification, and hashing utilities
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
- **Stripe** — Payment processing for donations (one-time and recurring via Checkout Sessions). Uses STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET env vars.
- **Web Push** — Push notifications via Web Push API with VAPID keys (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY). Uses web-push npm package.
- **Google OAuth** — Social authentication via Google Sign-In (server-side ID token verification with google-auth-library). Uses GOOGLE_CLIENT_ID env var.
- **Apple Sign-In** — Social authentication via Apple ID (JWT verification against Apple JWKS using jwks-rsa). Uses APPLE_CLIENT_ID/APPLE_BUNDLE_ID env vars.
- **Replit App Storage** — Object storage for file uploads (presigned URL flow). Uses DEFAULT_OBJECT_STORAGE_BUCKET_ID env var.
- **SMTP Email** — Transactional emails via Nodemailer. Uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM env vars. Gracefully degrades (logs to console) when SMTP not configured.

### Email Templates
- `server/email-templates.ts` — HTML email templates matching church dark/gradient branding:
  - Welcome email (on user registration)
  - Contact form confirmation
  - Event signup/waitlist confirmation
  - Connect card confirmation
  - Donation receipt (on Stripe webhook)
  - Admin notification (generic)
- `server/email-service.ts` — Nodemailer transport with SMTP env var configuration

### Key NPM Dependencies
- `drizzle-orm` + `drizzle-kit` — Database ORM and schema tooling
- `express` + `express-session` — HTTP server and session management
- `connect-pg-simple` — PostgreSQL session store
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT token generation and verification for v1 API
- `jwks-rsa` — Apple Sign-In JWKS key verification
- `google-auth-library` — Google OAuth2 ID token verification
- `nodemailer` — Email sending via SMTP
- `@tanstack/react-query` — Client-side data fetching/caching
- `framer-motion` — Animations
- `wouter` — Client-side routing
- `zod` + `drizzle-zod` — Schema validation
- `react-hook-form` — Form state management
- Shadcn/ui ecosystem (Radix UI primitives, class-variance-authority, tailwind-merge, clsx)
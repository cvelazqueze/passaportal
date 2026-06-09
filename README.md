# PassaPortal

Privacy-first Talent Relationship Management (TRM) platform built with Next.js 15, PostgreSQL, and Docker.

## Quick Start with Docker

```bash
# 1. Clone and configure
cp .env.example .env

# 2. Start PostgreSQL and Redis (creates DB `passaportal`)
docker compose up postgres redis -d

# 3. Install dependencies
npm install

# 4. Generate Prisma client and push schema
npm run db:generate
npm run db:push

# 5. Seed demo data
npm run db:seed

# 6. Start development server
npm run dev
```

Or run everything in Docker:

```bash
docker compose --profile dev up app-dev postgres redis
```

> **Upgrading from `talentos` DB naming?** Stop containers, remove the old volume (`docker compose down -v`), update `.env` to match `.env.example`, then run `db:push` and `db:seed` again.

## Demo Accounts (local development only)

After seeding, demo users share the password you set as `SEED_DEMO_PASSWORD` in `.env` (never commit that file).

| Role | Email |
|------|-------|
| Platform Admin | admin@passaportal.app |
| Agency Admin | admin@acme.com |
| Recruiter | recruiter@acme.com |
| Hiring Manager | hm@acme.com |
| Candidate | alex@example.com |
| Candidate | jordan@example.com |

> **Production:** leave `ALLOW_DEMO_SEED=false` and do not run `npm run db:seed` unless you are intentionally provisioning a staging environment.

## Candidate Portal — Career Copilot

The candidate portal is a **Career Operating System** focused exclusively on helping candidates manage, optimize, and accelerate their job search.

| Module | Route | Purpose |
|--------|-------|---------|
| Profile Hub | `/candidate/profile` | Single source of truth for career data |
| Resume Hub | `/candidate/resumes` | Master resume + targeted versions |
| Job Workspace | `/candidate/jobs` | Job description analysis & matching |
| Opportunities | `/candidate/opportunities` | Configurable pipeline tracker (Kanban) |
| Interview Hub | `/candidate/interviews` | Interview prep & knowledge base |
| Rejections | `/candidate/rejections` | Rejection intelligence & patterns |
| Offers | `/candidate/offers` | Side-by-side offer comparison |
| Analytics | `/candidate/analytics` | Search metrics & conversion funnel |
| Insights | `/candidate/insights` | Data-driven recommendations |

Legacy routes `/candidate/passport` and `/candidate/applications` redirect to the new modules.

### Candidate API Routes

```
GET/PATCH  /api/candidate/profile
GET/POST   /api/candidate/opportunities
PATCH      /api/candidate/opportunities/[id]
GET/POST   /api/candidate/resumes
GET/POST   /api/candidate/job-workspaces
GET/POST   /api/candidate/interviews
GET/POST   /api/candidate/rejections
GET/POST   /api/candidate/offers
```

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── candidate/         # Candidate portal
│   ├── recruiter/         # Recruiter portal
│   ├── hiring-manager/    # Hiring manager portal
│   ├── admin/             # Agency admin portal
│   └── platform/          # Platform admin portal
├── components/
│   ├── ui/                # ShadCN UI components
│   └── layouts/           # Dashboard layouts
├── lib/
│   ├── auth/              # Auth.js configuration
│   ├── rbac/              # Role-based access control
│   ├── security/          # Rate limiting, security events
│   ├── audit/             # Audit logging
│   ├── encryption/        # AES-256 field encryption
│   ├── notifications/     # In-app & email notifications
│   ├── resume/            # Resume generation (PDF/DOCX)
│   ├── scoring/           # Rule-based candidate ranking
│   ├── reporting/         # Analytics & metrics
│   └── validations/       # Zod schemas & privacy rules
└── middleware.ts           # Auth, RBAC, CSRF, rate limiting
```

## Security Features

- **RBAC** — 5 roles with granular permissions
- **Multi-tenant** — Row-level organization isolation
- **Encryption** — AES-256-GCM for sensitive fields
- **Audit logging** — All CRUD operations tracked
- **Security events** — Login history, device tracking
- **Rate limiting** — Per-IP API throttling
- **CSRF protection** — Origin validation on mutations
- **Session management** — Configurable expiration
- **Privacy-first** — Forbidden fields enforced at validation layer

## Privacy Principles

**Required fields only:** First name, last name, email

**Optional fields:** Phone, LinkedIn, portfolio, GitHub, city, country

**Never collected:** Home address, government IDs, SSN, birth date, gender, marital status, race, religion, political affiliation

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, ShadCN UI |
| State | React Query, Zustand |
| Backend | Next.js API Routes, Server Actions |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | Auth.js (NextAuth v5) |
| Files | UploadThing |
| Email | Resend |
| Payments | Stripe |
| Container | Docker, Docker Compose |

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires running app)
npm run test:e2e
```

## Deployment

### Vercel (Recommended)

`localhost:5432` only works on your machine. Production **must** use a hosted Postgres URL.

1. Create a database on [Neon](https://neon.tech), Supabase, or Railway.
2. Import the repo in Vercel.
3. Link **Neon** in Vercel (or paste Neon’s generated variables). Map like this:

| PassaPortal / Prisma | Neon variable |
|----------------------|---------------|
| `DATABASE_URL` | Neon **pooled** URL (`*-pooler` host) |
| `DATABASE_URL_UNPOOLED` | Neon **unpooled** URL (`DATABASE_URL_UNPOOLED`) |

Also set: `AUTH_SECRET`, `AUTH_URL` (your Vercel URL), `ENCRYPTION_KEY`.

**Important — remove bad vars from Vercel:**

- Delete any `DATABASE_URL` that contains `localhost` (often copied from local `.env`)
- Do **not** set `NODE_ENV=development` on Vercel (Vercel sets production automatically)

If you linked Neon, Vercel may only inject `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` — the app picks those up automatically. Optionally mirror them:

- `DATABASE_URL` = `POSTGRES_PRISMA_URL` (pooled)
- `DATABASE_URL_UNPOOLED` = `POSTGRES_URL_NON_POOLING` (unpooled)

4. Apply the schema to the **production** database (from your laptop, one time):

```bash
export DATABASE_URL="your-neon-pooled-url"
export DATABASE_URL_UNPOOLED="your-neon-unpooled-url"
npx prisma db push
```

5. Redeploy on Vercel (Deployments → … → Redeploy) so the new env vars are picked up.

**Common mistake:** leaving `DATABASE_URL` as `localhost:5432` — Vercel cannot reach your local Docker Postgres.

### Docker Production

1. On the server, copy `.env.example` to `.env` and set **strong, unique** values for every `CHANGE_ME` entry.
2. Set `AUTH_URL` to your public URL (e.g. `https://app.passaportal.com`).
3. Set `NODE_ENV=production` and `ALLOW_DEMO_SEED=false`.
4. Generate fresh secrets (do not reuse development values):

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY (64 hex chars)
```

5. Deploy:

```bash
docker compose build app
docker compose up app postgres redis -d
```

### Environment Variables

All credentials and secrets live in `.env` only. The repository ships `.env.example` as a template with no real secrets.

| Variable | Required | Notes |
|----------|----------|-------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Yes | Defaults in `.env.example`: `passaportal` / `passaportal` |
| `DATABASE_URL` | Yes | Local: `localhost`. Production: Neon **pooled** URL (never `localhost`) |
| `DATABASE_URL_UNPOOLED` | Yes | Same as `DATABASE_URL` locally; Neon **unpooled** URL in production |
| `AUTH_SECRET` | Yes | Auth.js session signing |
| `AUTH_URL` | Yes | Public app URL |
| `ENCRYPTION_KEY` | Yes | 64-char hex AES-256 key |
| `REDIS_URL` | Yes | Rate limiting / caching |
| `SEED_DEMO_PASSWORD` | Seed only | Demo user password; never set in production |
| `ALLOW_DEMO_SEED` | Seed only | Must be `false` in production |

Optional integrations: `UPLOADTHING_*`, `RESEND_*`, `STRIPE_*` — see `.env.example`.

## License

Proprietary — All rights reserved.

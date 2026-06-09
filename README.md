# PassaPortal

Privacy-first Talent Relationship Management (TRM) platform built with Next.js 15, PostgreSQL, and Docker.

## Quick Start with Docker

```bash
# 1. Clone and configure
cp .env.example .env

# 2. Start PostgreSQL and Redis
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

## Demo Accounts

All accounts use password: `Password123!`

| Role | Email |
|------|-------|
| Platform Admin | admin@talentos.app |
| Agency Admin | admin@acme.com |
| Recruiter | recruiter@acme.com |
| Hiring Manager | hm@acme.com |
| Candidate | alex@example.com |
| Candidate | jordan@example.com |

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

1. Push to GitHub
2. Import in Vercel
3. Set environment variables from `.env.example`
4. Connect PostgreSQL (Neon, Supabase, or Railway)
5. Deploy

### Docker Production

```bash
docker compose build app
docker compose up app postgres redis -d
```

### Environment Variables

See `.env.example` for all required variables. Generate secrets:

```bash
# AUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY (64 hex chars)
openssl rand -hex 32
```

## License

Proprietary — All rights reserved.

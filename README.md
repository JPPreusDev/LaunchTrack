# LaunchTrack — Client Onboarding Management SaaS

A multi-tenant SaaS for agencies to manage client onboarding: automate asset collection, track
time-to-launch, and eliminate "waiting on client" delays.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + ShadCN UI |
| Database | Supabase (Postgres + Auth + Storage) |
| Auth | Supabase Auth |
| Payments | Stripe Subscriptions |
| Email | Resend |
| Deployemnt | Vercel |

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Stripe account + CLI
- Resend account

### 1. Clone and install

```bash
git clone <your-repo>
cd launchtrack
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See the Environment Variables section below.

### 3. Set up Supabase

```bash
# Initialize local Supabase
supabase start

# Run migrations
supabase db push

# Or apply manually:
psql <connection_string> -f supabase/migrations/001_schema.sql
psql <connection_string> -f supabase/migrations/002_rls.sql

# Optional: Load demo seed data (requires auth users to exist first)
psql <connection_string> -f supabase/seed.sql
```

### 4. Create Supabase Storage Bucket

In the Supabase Dashboard:
1. Go to Storage → Create bucket
2. Name it `project-files`
3. Set to **public** (for file downloads) or private with signed URLs
4. Set file size limit: 50MB

### 5. Set up Stripe

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Create products and prices
stripe products create --name="LaunchTrack Starter"
stripe prices create --product=<prod_id> --unit-amount=4900 --currency=usd --recurring[interval]=month

# Repeat for Growth ($149) and Scale ($299)
# Copy price IDs to .env.local
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_GROWTH_PRICE_ID=price_...
STRIPE_SCALE_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Integrations
CLICKUP_CLIENT_ID=...
CLICKUP_CLIENT_SECRET=...
TEAMWORK_CLIENT_ID=...
TEAMWORK_CLIENT_SECRET=...
MONDAY_CLIENT_ID=...
MONDAY_CLIENT_SECRET=...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_SIGNING_SECRET=...

# Encryption (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
INTEGRATION_ENCRYPTION_KEY=your-32-byte-hex-string

# Cron security
CRON_SECRET=your-cron-secret
```

---

## Deployment — Vercel + Supabase

### 1. Push database to Supabase

```bash
supabase db push --db-url=postgres://postgres:<password>@db.<project>.supabase.co:5432/postgres
```

### 2. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo in the Vercel dashboard.

### 3. Set environment variables in Vercel

Go to: Project → Settings → Environment Variables
Add all variables from `.env.example`.

### 4. Configure Stripe webhook endpoint

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### 5. Configure integration OAuth redirect URIs

For each provider, set the redirect URI to:
- ClickUp: `https://yourdomain.com/api/integrations/clickup/callback`
- Slack: `https://yourdomain.com/api/integrations/slack/callback`
- Monday: `https://yourdomain.com/api/integrations/monday/callback`
- Teamwork: `https://yourdomain.com/api/integrations/teamwork/callback`

### 6. Vercel Cron (automation engine)

The `vercel.json` already configures a cron job to run automation rules hourly.
Make sure to set `CRON_SECRET` in Vercel env vars.

---

## Project Structure

```
launchtrack/
├── app/
│   ├── (auth)/                  # Login, register pages
│   ├── (dashboard)/             # Agency staff dashboard
│   │   ├── dashboard/           # KPI overview
│   │   ├── clients/             # Client management
│   │   ├── projects/[id]/       # Project detail
│   │   ├── templates/           # Onboarding templates
│   │   ├── settings/            # Settings + integrations
│   │   └── billing/             # Stripe subscription
│   ├── (client-portal)/         # Client-facing portal
│   │   └── portal/[projectId]/  # Project timeline + tasks
│   └── api/
│       ├── auth/                # Auth helpers
│       ├── billing/             # Stripe checkout/portal
│       ├── webhooks/            # Stripe, ClickUp, Slack, etc.
│       ├── integrations/        # OAuth callbacks
│       └── cron/                # Scheduled jobs
├── components/
│   ├── dashboard/               # Sidebar, TopBar
│   ├── billing/                 # Checkout/portal buttons
│   ├── client-portal/           # Client task/asset lists
│   ├── projects/                # Status badge, asset cards
│   ├── tasks/                   # Task row component
│   └── shared/                  # Integration cards
├── lib/
│   ├── supabase/                # Client/server/middleware
│   ├── stripe/                  # Stripe client + helpers
│   ├── resend/                  # Email client
│   └── crypto/                  # Token encryption
├── services/
│   ├── automation/              # Automation engine
│   ├── integrations/            # ClickUp, Slack, Monday, Teamwork
│   └── notifications/           # Email + in-app notifications
├── types/                       # TypeScript types
├── supabase/
│   ├── migrations/              # SQL schema + RLS policies
│   └── seed.sql                 # Demo data
└── vercel.json                  # Cron job config
```

---

## Multi-Tenant Security

- **RLS (Row Level Security)** is enforced on every table
- Agency staff can only see their organization's data
- Clients can only see their specific project (via `client_portal_access`)
- **Internal notes** on tasks are never exposed to clients (excluded from client policies and portal view)
- Integration tokens are encrypted at rest using AES-256-GCM
- Stripe webhook signatures are validated on every request

---

## Plan Limits

| Plan | Projects | Price/mo |
|---|---|---|
| Starter | 5 | $49 |
| Growth | 20 | $149 |
| Scale | Unlimited | $299 |

Limits are enforced at both the API level (`check_plan_project_limit()` function) and UI level.

---

## Key Features

- Multi-tenant agency + client architecture
- Onboarding templates with phases and tasks
- Client portal with timeline view (zero internal data leakage)
- Asset request system with file uploads
- Approval checkpoints
- Automation engine (overdue alerts, asset reminders, stuck project alerts)
- In-app + email notifications (Resend)
- Stripe subscription management (3 tiers)
- Integrations: ClickUp, Slack, Monday.com, Teamwork
- Real-time notifications via Supabase subscriptions

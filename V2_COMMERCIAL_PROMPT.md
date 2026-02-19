# PhysioLens V2 — Commercial Transformation Brief
## Paste this entire file as your opening prompt in the project VS Code session

---

## WHO YOU ARE AND WHAT YOU ARE WORKING ON

You are working on **PhysioLens** — a production-quality web application already
built and tested. The project lives in this monorepo. It is a browser-based
computer vision platform that lets physiotherapists and orthopaedic clinicians
measure joint Range-of-Motion (ROM) using a webcam, powered by Google MediaPipe
running fully in-browser.

**What is already built and working (do not rebuild these):**
- Next.js 15 + React 19 frontend (`apps/web/`) running on port 4500
- Express 4 TypeScript REST API (`apps/api/`) with JWT auth, rate limiting, HIPAA-aligned audit trail
- MediaPipe Pose CV pipeline (in-browser, no server cost) — real-time joint angle measurement
- Dual-camera WebRTC system (QR-pair a phone as second camera)
- AI interpretation via OpenAI GPT-4o / Anthropic Claude (server-side route `/api/interpret`)
- Database schema in Drizzle ORM (`apps/api/src/db/schema.ts`) — organizations, users, sessions, measurements, notes
- 46 normative ROM entries (AMA6/AAOS) for shoulder, elbow, knee, hip
- 23 clinical special tests database (shoulder, knee, hip)
- Clinical note auto-generation + rich NoteRenderer with copy/print export
- 29/29 tests passing, 0 TypeScript errors
- Zod domain contracts in `packages/shared-types/`

**What is missing (this is your entire job):**
The app has zero commercial infrastructure. There is no pricing, no subscription,
no landing page, no onboarding funnel, no trial system, no clinic invite workflow,
no usage metering, and no Stripe integration. The dashboard uses mock data.
This brief tells you exactly how to fix every one of those gaps.

Read `AI_CONTEXT.md` for full codebase detail before writing any code.

---

## MARKET RESEARCH CONTEXT (Use this to inform copy and feature prioritisation)

This research was conducted specifically for PhysioLens across Reddit
(r/physicaltherapy, r/orthopaedics, r/ChronicPain, r/AskDocs), Product Hunt,
Indie Hackers, G2, and Capterra. Use these insights when writing landing page
copy, pricing tiers, and UI microcopy.

### Validated Pain Points (that PhysioLens directly solves)

**#1 — PT Workflow Disruption from AI-Generated Patient Questions** (r/physicaltherapy, 394+ upvotes)
> "Patient came in with 4 pages of AI-generated questions — I barely had time to take measurements during their evaluation."

PhysioLens saves clinicians time by measuring faster and generating notes
automatically. Lean into this in marketing: **"Spend your session treating, not typing."**

**#2 — Manual Goniometry is Slow and Inconsistent**
Clinicians cite measuring + documenting a multi-joint exam as 15–25 minutes of
overhead per patient. PhysioLens reduces this to under 5 minutes. This is the
core ROI message: **"Save 20 minutes per patient. That's 2 extra patients per day."**

**#3 — No Lightweight Clinical Tool for Independent Clinics**
Competitors (Jane App: CAD $79/mo, SimplePractice: $79/mo) are practice
management suites that don't do CV measurement. Epic/Cerner are enterprise-only.
PhysioLens fills a narrow but deep gap: **AI measurement + note generation, 
nothing else, under $100/month.** Independent physiotherapists will pay for this.

**#4 — No Consumer-Facing Post-Surgery ROM Tracker**
r/ACL (73K members), r/kneeInjuries, r/scoliosis communities are full of
patients measuring their own ROM with rulers and guesswork. No consumer-grade
CV tool exists for this. V2 should introduce a **Patient Self-Assessment mode**
(the shell already exists at `/exam/self-guided`) as a separate lower-priced tier
or patient add-on sold through clinics.

### Competitive Gaps (why PhysioLens wins)
- **Hinge Health ($6B):** 100% locked behind employer contracts. Individuals cannot buy.
- **Kaia Health:** Abandoned the US/NZ/AU market. EU-only DiGA model.
- **RecoveryOne:** B2B only, no real-time CV, no clinician tooling.
- **SimplePractice / Jane:** No movement analysis, no CV, mental-health focused.
- **No competitor** offers: browser-based CV + clinical notes + AI interpretation + patient self-assessment in one tool under $100/month.

### Target Market (Primary: NZ/AU, Secondary: US/UK)
- ~8,000 physiotherapy clinics in Australia, ~3,000 in NZ
- Independent and small-group clinics (1–5 clinicians) are the sweet spot — no IT
  department, no long procurement cycles, credit card purchase decisions
- Clinician-owners make buying decisions; break-even calculation: 1 extra patient
  per day × 5 days × $80 consult = $400/week additional revenue vs $79/month tool cost

---

## V2 COMMERCIAL TRANSFORMATION — WHAT TO BUILD

You must implement the following in order of priority. Do not skip steps.
Complete each section fully before moving to the next.

---

## SECTION 1 — STRIPE SUBSCRIPTION INTEGRATION

### 1.1 Install Stripe

```bash
cd apps/web && pnpm add stripe @stripe/stripe-js
cd apps/api && pnpm add stripe
```

### 1.2 Pricing Tiers to Implement

Create these exact three tiers. All prices in NZD (display USD equivalent for
international visitors using a static rate of 1 NZD = 0.60 USD):

| Tier | Name | Price | Who it's for |
|------|------|-------|-------------|
| Free | Starter | NZD $0/month | Solo physios wanting to trial |
| Pro | Clinician | NZD $49/month or $420/year | Independent physiotherapists |
| Clinic | Practice | NZD $129/month or $1,100/year | Clinics with 2–8 clinicians |

**Starter (Free) Limits:**
- 10 sessions per month
- 1 clinician seat only
- CV measurement + basic note export
- No AI interpretation
- No phone/dual camera
- Watermarked PDF export ("Generated with PhysioLens Free")

**Clinician Pro (NZD $49/month):**
- Unlimited sessions
- 1 clinician seat
- Full CV pipeline including dual-camera
- AI interpretation (Claude Haiku for summaries)
- PDF export without watermark
- Session history (90 days)
- Email support

**Practice (NZD $129/month):**
- Unlimited sessions
- Up to 8 clinician seats
- Everything in Pro
- Clinic admin dashboard (manage clinicians, view all sessions)
- Patient invite portal (self-guided home measurement links)
- Outcome trend charts across patient cohort
- CSV/JSON data export for audit
- Priority support + onboarding call

### 1.3 Stripe Implementation in the API

Add to `apps/api/src/db/schema.ts` — new table:

```typescript
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  plan: varchar('plan', { length: 64 }).notNull().default('free'), // 'free' | 'pro' | 'practice'
  status: varchar('status', { length: 64 }).notNull().default('active'), // 'active' | 'past_due' | 'cancelled'
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Also add `monthlySessionCount` and `billingCycleStart` to the `organizations` table
for enforcing the Free tier limit.

Create `apps/api/src/routes/billing.ts`:
- `POST /api/billing/checkout` — creates a Stripe Checkout Session, returns URL
- `POST /api/billing/portal` — creates Stripe Customer Portal session
- `POST /api/billing/webhook` — handles `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`
- `GET /api/billing/subscription` — returns current org plan + limits + usage

Create `apps/api/src/middleware/plan-guard.ts`:
- Middleware that checks `organizationId` subscription tier
- For Free tier, count sessions this billing cycle and reject if > 10 with:
  `{ error: 'SESSION_LIMIT_REACHED', upgradeUrl: '/billing/upgrade' }`
- Attach `req.plan` to every authenticated request

Apply `planGuard('pro')` to the `/api/interpret` endpoint.
Apply `planGuard('practice')` to any multi-seat or admin endpoints.

### 1.4 Stripe Webhook Setup

Add env vars to `apps/api/.env.example`:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_PRACTICE_MONTHLY=price_...
STRIPE_PRICE_ID_PRACTICE_YEARLY=price_...
```

Webhook handler must update `subscriptions` table on every status change
and sync the `plan` field so `planGuard` always reads correctly.

---

## SECTION 2 — MARKETING LANDING PAGE

### 2.1 Create `/` as the Public Marketing Page

Currently `apps/web/src/app/page.tsx` is the dashboard. Move the dashboard to
`/dashboard`. Make `/` a public-facing marketing landing page (no auth required).

The new root `page.tsx` must be a `'use client'` page with no sidebar layout.
Create a separate layout for marketing pages: `apps/web/src/app/(marketing)/layout.tsx`
that renders a simple top nav (logo + "Sign In" + "Start Free") without the 
clinical sidebar.

Move the current dashboard to `apps/web/src/app/dashboard/page.tsx`.
Update the Sidebar links accordingly.

### 2.2 Landing Page Sections

Build the landing page with these exact sections in this order:

**Section 1 — Hero**
Headline: `Measure Joint ROM in Real Time. Generate Clinical Notes in Seconds.`
Subheadline: `PhysioLens uses AI computer vision in your browser — no hardware, no software install. Designed for physiotherapists who want to spend less time documenting and more time treating.`
CTA buttons: `[Start Free — No Card Required]` and `[Watch 60-Second Demo]`
Hero visual: A short looping video placeholder (dark card with animated skeleton/pose overlay animation using pure CSS/Framer Motion — show a stick figure with a highlighted glowing knee joint angle reading "127°")

**Section 2 — Social Proof Strip**
Three short quotes (fabricate realistic ones for now with [PLACEHOLDER] note):
- "I save 20 minutes per session compared to manual goniometry. Game changer." — Sarah K., Physiotherapist, Auckland
- "The note generation alone is worth it. I used to dread documentation." — James R., Sports Physio, Sydney  
- "My clinic upgraded from paper forms to PhysioLens in one afternoon." — Dr. M. Patel, Orthopaedic Clinic, Melbourne
Add a note: `// TODO: Replace with verified customer quotes before launch`

**Section 3 — Problem/Solution**
Two-column layout:
Left (Problem): 
- Manual goniometry takes 3–5 minutes per joint
- Handwritten notes eat 25+ minutes per patient
- Measurement inconsistency between clinicians
- No objective progression tracking for patients

Right (Solution — PhysioLens):
- AI measures all visible joints in real time
- Structured notes generated from measurements automatically
- Standardised AMA/AAOS normative comparison on every reading
- Patient trend charts show recovery objectively

**Section 4 — Feature Cards (3 cards)**
Card 1: "Real-Time Computer Vision" — "Point your webcam. PhysioLens detects your patient's pose and measures joint angles instantly. No goniometer. No manual entry." Icon: `Zap`
Card 2: "Auto-Generated Clinical Notes" — "Every measurement automatically builds a structured exam note. Copy to clipboard or print to PDF in one click." Icon: `FileText`  
Card 3: "AI Clinical Interpretation" — "Claude AI analyses your measurements against normative data and recommends relevant clinical special tests." Icon: `Sparkles`

**Section 5 — Pricing Table**
Implement the three tiers from Section 1.3 above.
Use a Monthly/Annual toggle (annual = 30% off, highlight savings).
Highlight the "Clinician Pro" tier as "Most Popular" with a badge.
Each card: plan name, price, feature list with check/cross icons, CTA button.
Free: "Start Free" → `/auth/register`
Pro: "Start Free Trial" → Stripe Checkout
Practice: "Start Free Trial" → Stripe Checkout
Add below: `"All plans include a 14-day free trial of Pro features. No credit card required to start."`

**Section 6 — FAQ** (accordion, 6 questions)
1. Q: Is PhysioLens a certified medical device? A: No. PhysioLens is a clinical workflow and documentation tool, not a diagnostic medical device. All measurements are labeled as assistive data and require clinician review and confirmation before use in patient records.
2. Q: Does it work on a phone? A: Yes. PhysioLens works in mobile Chrome and Safari. You can also pair your phone as a second camera for 3D measurement — no app download needed.
3. Q: Is patient data secure? A: All data is encrypted in transit (TLS) and at rest. We maintain a full audit trail. Our architecture is HIPAA-aligned and Privacy Act compliant for NZ/AU.
4. Q: Can I use it without the clinic subscription for multiple clinicians? A: The Clinician Pro plan supports one clinician seat. For teams, the Practice plan supports up to 8 seats and includes a shared clinic dashboard.
5. Q: What joints does PhysioLens measure? A: Shoulder, elbow, knee, hip — covering the most common physiotherapy presentations. Wrist, ankle, and cervical spine are on the roadmap.
6. Q: How does the AI interpretation work? A: Measurements are sent to Claude AI which compares them against published normative ranges, identifies deficits, and recommends relevant clinical special tests (e.g., Hawkins-Kennedy, Lachman's, FABER). No patient identifiers are sent.

**Section 7 — Footer**
Links: Product | Pricing | For Clinics | Privacy Policy | Terms of Service | Contact
Copyright: © 2026 PhysioLens Ltd. All rights reserved.
Disclaimer: PhysioLens is a clinical workflow tool. It does not provide medical diagnoses or replace clinical judgment.

---

## SECTION 3 — AUTHENTICATION & ONBOARDING FLOW

### 3.1 Auth Pages

Create these new pages (all in the `(marketing)` layout group, no sidebar):
- `app/(auth)/login/page.tsx` — email + password, link to register
- `app/(auth)/register/page.tsx` — name, clinic name, email, password, role dropdown (Physiotherapist / Sports Medicine / Chiropractor / Orthopedic Surgeon / Other)
- `app/(auth)/verify-email/page.tsx` — "Check your email" holding page

On register success: Create organization (using clinic name) + user via the existing `/api/auth/register` endpoint. Then redirect to the onboarding flow.

### 3.2 Onboarding Wizard (Post-Registration, 3 Steps)

Create `app/onboarding/page.tsx` — a linear 3-step wizard shown only on first login:

**Step 1 — Setup Your Profile**
- Display name (pre-filled from registration)
- Specialty (dropdown)
- Country (NZ / AU / UK / US / Other)
- Primary use case: "For my clinic" | "For personal practice" | "For research"

**Step 2 — Choose Your Plan**
- Show the same 3-tier pricing cards from the landing page
- "Continue with Free" (skip Stripe, go to step 3)
- "Start Pro Trial" (redirect to Stripe Checkout, return URL = `/onboarding?step=3&success=true`)
- "Start Practice Trial" (same)

**Step 3 — Take Your First Measurement**
- Short animated explainer: "Your camera, your patient, your notes — ready in 60 seconds"
- Single CTA: "Start Your First Session →" (links to `/sessions/new`)
- Confetti animation on page load (use `canvas-confetti` package)

Store onboarding completion in user record: add `onboardingCompleted: boolean` to the users table.
After `/dashboard` loads, check `onboardingCompleted` — if false, redirect to `/onboarding`.

### 3.3 Post-Auth Redirect Logic

In `apps/web/src/middleware.ts` (create if not exists), protect all routes under
`/dashboard`, `/sessions`, `/onboarding`, `/billing` — redirect to `/login` if
no valid JWT cookie.

Public routes: `/`, `/login`, `/register`, `/verify-email`, `/pricing`, `/camera/remote`

Store the JWT in an `httpOnly` cookie (not localStorage) for security.

---

## SECTION 4 — BILLING UI

### 4.1 Billing Page

Create `app/dashboard/billing/page.tsx`:
- Show current plan name, status, next renewal date
- Show this billing period's session count (Free tier shows "X / 10 sessions used" with progress bar)
- "Upgrade Plan" button → Stripe Checkout
- "Manage Subscription" button → Stripe Customer Portal
- "View Invoices" button → Stripe Customer Portal (invoices tab)

### 4.2 Upgrade Prompt

When a Free user hits the session limit (planGuard returns 429), show a toast/modal:
> "You've used all 10 free sessions this month. Upgrade to Clinician Pro for unlimited sessions — from NZD $49/month."
> [Upgrade Now] [Maybe Later]

When a Free user clicks the AI Interpretation button in NoteRenderer:
Show a modal:
> "AI Clinical Interpretation is a Pro feature."
> "Upgrade to unlock AI-powered deficit analysis and clinical test recommendations."
> [See Plans] [Not now]

### 4.3 Add Billing Link to Sidebar

In `apps/web/src/components/layout/Sidebar.tsx`, add:
- "Billing & Plan" link with a `CreditCard` icon
- Show the current plan badge (e.g., "FREE", "PRO", "PRACTICE") as a coloured chip next to the user avatar

---

## SECTION 5 — CLINIC DASHBOARD (Practice Tier)

Create `app/dashboard/clinic/page.tsx` — visible only to `clinic_admin` role:

### Clinician Management Table
Columns: Name | Email | Role | Sessions This Month | Last Active | Status
Actions: Invite New Clinician (email invite), Remove Clinician, Change Role

### Invite Flow
`POST /api/clinic/invite` — creates an invite token and sends an email with:
> "You've been invited to join [Clinic Name] on PhysioLens. Click here to create your account."

Accept URL: `/register?invite=<token>` — pre-fills clinic association.

### Aggregate Outcome Metrics
Summary cards (Practice tier only):
- Total sessions across all clinicians this month
- Average AI confidence score across recent sessions
- Most common joint assessed this month (bar chart)
- Clinician utilisation rate (sessions per clinician per week)

Add these API endpoints:
- `GET /api/clinic/clinicians` — list clinicians in org
- `GET /api/clinic/stats` — aggregate stats for admin dashboard
- `POST /api/clinic/invite` — create invite
- `DELETE /api/clinic/clinicians/:id` — remove clinician from org

---

## SECTION 6 — PATIENT SELF-ASSESSMENT MODE (Practice Tier Add-On)

A shell already exists at `apps/web/src/app/exam/self-guided/`. Build it out:

### What to Build
A guided home measurement experience for patients, distributed via a unique link
generated by the clinic. No patient login required — link contains a one-time
session token.

Flow:
1. Clinic admin generates a patient link from the clinic dashboard: "Send Home Assessment" button per historical session
2. Patient opens link on their phone
3. Simple 3-step guided flow: "Stand 2 metres from the camera" → "Raise your [RIGHT ARM/LEFT KNEE/etc.]" → "Hold still for 3 seconds"
4. Single ROM measurement per link
5. Result sent back to clinic's PhysioLens session history automatically
6. Clinician reviews in their dashboard

### API Changes
- `POST /api/patient-links` — generate a one-time patient measurement link (Practice tier only)
- `GET /api/patient-links/:token` — validate token, return procedure context
- `POST /api/patient-links/:token/measurement` — submit measurement from patient device (no auth, token-scoped)

### Patient Link Page
`app/patient/[token]/page.tsx`:
- No sidebar, clean minimal UI
- Brand logo + "Powered by PhysioLens"
- Full-screen camera UI (guided flow)
- "Your physiotherapist will review your measurement" completion screen

---

## SECTION 7 — USAGE ANALYTICS & RETENTION

### 7.1 Real Dashboard Data

Replace ALL mock data in `apps/web/src/app/dashboard/page.tsx` with real API calls:

Replace the STATS mock array with a `useEffect` that calls `GET /api/dashboard/stats`:
```typescript
// Returns:
{
  totalSessions: number,
  totalMeasurements: number,
  sessionChange: string, // '+12%' etc
  avgConfidenceScore: number,
  // Plan usage
  sessionsThisMonth: number,
  sessionLimit: number | null // null = unlimited
}
```

Replace RECENT_SESSIONS mock with real `GET /api/sessions?limit=5&sort=desc`.

Add the API endpoint `GET /api/dashboard/stats` to the Express API, scoped by `organizationId`.

### 7.2 Progress Charts

In the dashboard, add a ROM Trend chart using **Recharts** (install: `pnpm add recharts`):
A line chart showing average ROM score across sessions over the last 30 days.
Data from: `GET /api/dashboard/rom-trend?days=30`

### 7.3 Session Export for Clinic Audit

Add a button to the sessions list page: "Export All Sessions (CSV)".
This calls `GET /api/sessions/export/csv` which returns a CSV file with:
Session ID, Patient ID, Date, Joint, ROM Value, Confidence Score, Note Status, Clinician

---

## SECTION 8 — COMMERCIAL COPY & POSITIONING

### 8.1 Rename and Brand Consistently

The app is called **PhysioLens**. Ensure the name appears consistently:
- Browser tab title: "PhysioLens — AI-Powered ROM Measurement"
- Sidebar logo text: "PhysioLens"
- Dashboard heading: "PhysioLens Dashboard"
- Emails: "The PhysioLens Team"
- Footer: "PhysioLens Ltd."

### 8.2 Microcopy Upgrades

Update these specific UI strings for commercial impact:

In `CameraSetupWizard.tsx`:
- Step 1 heading: Change to "What are we measuring today?" (more conversational)
- Add below joint selector: "PhysioLens will automatically identify landmarks and calculate angles — no calibration needed."

In `MeasurementPanel.tsx`:
- Add to each measurement row below the angle: a small chip showing deficit %
  e.g., "14° below normal (AAOS)" in amber if deficit, green tick if within normal

In `NoteRenderer.tsx`:
- Change the AI interpretation button label from whatever it is to:
  "✦ Get AI Clinical Interpretation" (with Sparkles icon)
- Under the button (Free tier only): "(Pro feature — upgrade to unlock)"

In `SessionNew` page:
- After session completes and note is generated, add:
  "📋 Note ready. Your session took [X] minutes — [Y] minutes saved vs manual documentation."

### 8.3 Email Templates

Create `apps/api/src/services/email.ts` with a minimal email service using
**Resend** (install: `pnpm add resend`, free tier: 3,000 emails/month).

Add env: `RESEND_API_KEY=re_...` and `FROM_EMAIL=hello@physiolens.io`

Templates to implement (as plain HTML strings):
1. `welcomeEmail(name, clinicName)` — sent on registration
2. `inviteEmail(inviterName, clinicName, inviteUrl)` — clinic seat invite
3. `trialExpiringEmail(name, daysLeft)` — 3 days before 14-day trial ends
4. `paymentFailedEmail(name, retryUrl)` — on Stripe payment failure

Trigger emails:
- Registration → `welcomeEmail`
- Clinic invite → `inviteEmail`
- Stripe `customer.subscription.trial_will_end` webhook → `trialExpiringEmail`
- Stripe `invoice.payment_failed` webhook → `paymentFailedEmail`

---

## SECTION 9 — SEO & DISCOVERABILITY

### 9.1 Next.js Metadata

In `apps/web/src/app/(marketing)/layout.tsx`, add:
```typescript
export const metadata = {
  title: 'PhysioLens — AI ROM Measurement for Physiotherapists',
  description: 'Browser-based computer vision that measures joint Range-of-Motion in real time and generates structured clinical notes automatically. No hardware. No install.',
  keywords: ['physiotherapy software', 'ROM measurement tool', 'clinical documentation', 'joint angle measurement', 'physio AI'],
  openGraph: {
    title: 'PhysioLens — Measure ROM. Generate Notes. Instantly.',
    description: 'AI-powered ROM measurement for physiotherapists. Browser-based, no hardware required.',
    url: 'https://physiolens.io',
    siteName: 'PhysioLens',
    type: 'website',
  },
}
```

### 9.2 Structured Data

Add JSON-LD to the landing page `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PhysioLens",
  "applicationCategory": "HealthApplication",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "129",
    "priceCurrency": "NZD",
    "offerCount": "3"
  },
  "operatingSystem": "Web Browser",
  "description": "AI-powered ROM measurement tool for physiotherapists"
}
```

---

## SECTION 10 — ENVIRONMENT & DEPLOYMENT PREP

### 10.1 New Environment Variables

Add to `apps/api/.env.example`:
```
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_PRACTICE_MONTHLY=price_...
STRIPE_PRICE_ID_PRACTICE_YEARLY=price_...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=hello@physiolens.io

# App URLs
NEXT_PUBLIC_APP_URL=https://app.physiolens.io
NEXT_PUBLIC_MARKETING_URL=https://physiolens.io
APP_URL=https://app.physiolens.io

# Feature flags
ENABLE_PATIENT_PORTAL=true
ENABLE_USAGE_ANALYTICS=true
```

Add to `apps/web/.env.local.example`:
```
# Add to existing .env.local.example
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://app.physiolens.io
```

### 10.2 Vercel Deployment Config

Create `apps/web/vercel.json`:
```json
{
  "buildCommand": "turbo run build --filter=@physiolens/web",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["syd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

Add `apps/api/railway.json` (Railway.app for the API — NZD ~$10/month):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" },
  "deploy": {
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## IMPLEMENTATION ORDER & TESTING

Implement sections in this exact order:
1. Section 1 (Stripe + DB schema changes) — foundation everything else depends on
2. Section 3 (Auth pages + onboarding) — users need to be able to sign up
3. Section 2 (Landing page) — public face of the product
4. Section 4 (Billing UI + upgrade prompts) — revenue capture
5. Section 7.1 (Real dashboard data — replace mocks) — credibility
6. Section 8 (Copy upgrades + branding) — commercial polish
7. Section 5 (Clinic dashboard — Practice tier) — upsell path
8. Section 6 (Patient self-assessment) — product differentiation
9. Section 7.2–7.3 (Charts + CSV export) — retention
10. Section 9 (SEO) — discoverability
11. Section 10 (Deployment config) — launch readiness

After implementing each section, run:
```bash
pnpm typecheck && pnpm lint && pnpm test
```
All 29 existing tests must continue passing. Add new tests for billing middleware
and Stripe webhook handler.

---

## REVENUE TARGETS (Know These While Building)

| Month | Target | How |
|-------|--------|-----|
| Month 1 | NZD $500 MRR | 10 Pro subscribers via Reddit/physio Facebook groups |
| Month 3 | NZD $3,000 MRR | 2 Practice clinics + 30 Pro users |
| Month 6 | NZD $10,000 MRR | 10 Practice clinics + 100 Pro users |
| Month 12 | NZD $30,000 MRR | 30 Practice clinics + 250 Pro users |

Break-even on infrastructure (Vercel Pro $35 + Railway $15 + Supabase $25 + Anthropic API $50 = ~NZD $220/month) requires just **5 Pro subscribers**. Everything above that is profit.

---

## CRITICAL DECISIONS (Do Not Change These)

1. **No Firebase/Supabase auth** — the existing JWT system in `apps/api/src/auth/jwt.ts` is complete and HIPAA-aligned. Use it.
2. **No app store** — web-only. Mobile browser with `getUserMedia()`. Faster deployment, no 30% cut.
3. **NZD pricing** — do not default to USD. Show NZD with USD in brackets. This is correct.
4. **14-day free Pro trial** — not a credit card at signup. Lower barrier = more signups = more conversion.
5. **Stripe Checkout** (not Elements) — fastest implementation, Stripe handles all card validation and PCI scope.
6. **Claude Haiku for AI summaries** (cheapest), **Claude Sonnet for live interpretation** (where quality matters). Never GPT-4 as the default — Claude is already integrated.
7. **Plan enforcement in API middleware** — not in the frontend. Frontend gates are UX sugar only; the API is the real enforcement layer.
8. **Keep the existing test suite green** — do not refactor existing passing code while adding new features.

---

## FILES TO CREATE (Complete List)

```
apps/web/src/app/(marketing)/layout.tsx          # Public layout (no sidebar)
apps/web/src/app/(marketing)/page.tsx            # NEW landing page (replaces /)
apps/web/src/app/(auth)/login/page.tsx           # Login page
apps/web/src/app/(auth)/register/page.tsx        # Register page
apps/web/src/app/(auth)/verify-email/page.tsx    # Email verification holding
apps/web/src/app/dashboard/page.tsx              # Moved from / (real data)
apps/web/src/app/dashboard/billing/page.tsx      # Billing management
apps/web/src/app/dashboard/clinic/page.tsx       # Clinic admin (Practice tier)
apps/web/src/app/onboarding/page.tsx             # 3-step post-signup wizard
apps/web/src/app/patient/[token]/page.tsx        # Patient self-assessment
apps/web/src/middleware.ts                        # Auth route protection
apps/web/src/lib/stripe.ts                        # Stripe.js client init

apps/api/src/routes/billing.ts                   # Stripe checkout/portal/webhook
apps/api/src/routes/clinic.ts                    # Clinic admin endpoints
apps/api/src/routes/patient-links.ts             # Patient measurement links
apps/api/src/routes/dashboard-stats.ts           # Real stats endpoint
apps/api/src/middleware/plan-guard.ts            # Subscription enforcement
apps/api/src/services/email.ts                   # Resend email service
apps/api/src/services/stripe.ts                  # Stripe SDK wrapper

apps/web/vercel.json                              # Vercel deployment config
apps/api/railway.json                            # Railway deployment config
```

---

*This brief was generated on 18 February 2026 based on deep market research
across Reddit, Product Hunt, G2, Capterra, and competitive analysis of Hinge
Health, Kaia, RecoveryOne, SimplePractice, and Jane App. PhysioLens v1 (MVP)
is fully built and tested. This document describes v2 commercial transformation
only — do not rebuild existing features.*

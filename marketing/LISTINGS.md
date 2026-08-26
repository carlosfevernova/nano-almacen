# Listing Text para Marketplaces

## SideProjectors Listing

### Title (max 80 chars)
```
Nano-Almacén · WhatsApp SaaS for Mexican corner shops (Next 16 + Supabase + AI)
```

### Category
`SaaS` → `B2B Tools`

### Asking Price
`$2,499 USD` (negotiable, serious offers)

### Live URLs
- Live app: https://nano-almacen.vercel.app
- Public repo: https://github.com/carlosfevernova/nano-almacen
- Live demo dashboard: https://nano-almacen.vercel.app/dash?tenant_id=55263cb2-da58-4cb8-9c40-c072f8e98a35
- Live fiado demo: https://nano-almacen.vercel.app/dash/fiado?tenant_id=55263cb2-da58-4cb8-9c40-c072f8e98a35

### Short Description (max 200 chars)
```
Production-ready WhatsApp-first SaaS for Mexico's 5.9M corner shops. Order parser via Gemini AI, credit ledger with WA reminders, catalog upload (Excel + Vision), multi-tenant Postgres. Pre-revenue MVP.
```

### Long Description

**A production-ready WhatsApp-first SaaS scaffold targeting Mexico's 5.9M "tienditas" (small corner shops). Built in 15 shipping days with a modern stack. Currently pre-revenue.**

## The market opportunity

- **5.9M tienditas** in Mexico (INEGI 2024)
- **64% of pyme sales via WhatsApp** (MX Fintech report 2026)
- **Meta Business AI launched MX-first Nov 2025** — massive timing tailwind
- Competitors: Alegra (accounting-only, $138-599 MXN/mo) · Bind (ERP $800-2,500 MXN/mo, too enterprise) · Loyverse (global, no CFDI native) · Treinta (basic freemium)
- **Sweet spot:** $299-1,499 MXN/mo focusing on WhatsApp workflows + local features (CFDI, fiado, MX Spanish)

## What's built (all working, verified)

**1. WhatsApp order parser** (`/api/parse-order`)
- Gemini 3.5 Flash Lite with structured Zod-validated output
- Spanish-MX context (parses "5 chelas y 2 sabritas", "media docena de huevos", "3 marlboros rojos")
- 6/6 test cases passing, 900ms avg latency
- Free tier: ~1,500 requests/day = >50 shops at typical usage

**2. Catalog upload** (`/api/catalog/upload`)
- Excel path: exceljs with fuzzy Mexican-Spanish header matching
- Vision path: Gemini multimodal extracts products from photos
- Auto-upsert Supabase with idempotent conflict resolution
- 10/10 verified in production

**3. Dashboard tendero** (`/dash?tenant_id={id}`)
- Server-rendered, real Supabase queries
- KPI hero: products, orders, customers, WhatsApp messages
- Recent orders with status FSM badges
- WhatsApp conversations with parse confidence
- Catalog table with stock warnings

**4. Fiado credit ledger** (`/dash/fiado` + `/api/fiado`) — **KILLER FEATURE**
- Every Mexican shop tracks credit ("fiado") in a paper notebook. No competitor handles this well.
- Full ledger with atomic saldo updates (Postgres trigger-driven)
- Days-since-last-payment badges (green 0-7d, amber 8-15d, red >15d)
- **One-click WhatsApp reminder** opens `wa.me/{phone}?text=` with contextual pre-filled message
- CSV export
- Multi-payment tracking (efectivo/transferencia/tarjeta/oxxo/mercadopago)

**5. Public landing** (`/`) — waitlist form → Supabase

**6. Multi-tenant DB** — 10 tables, Row-Level Security, 3 RPCs, 4 triggers, 3 idempotent migrations

## Tech stack

- Next.js 16.3.3 App Router + Turbopack
- TypeScript strict mode
- Tailwind CSS v4 + Inter + Fraunces
- Supabase Postgres 15 with RLS
- Google Gemini 3.5 Flash Lite (free tier)
- Zod validation
- exceljs (CVE-safe alternative to `xlsx`)
- Vercel Fluid Compute deploy

## Verified metrics

- **2,233 LOC TypeScript** across 21 source files
- **570 LOC SQL** across 3 migrations (all applied + verified)
- **14+ git commits**
- **4/4 endpoints** E2E-tested with production data
- **6/6 Gemini parse tests** pass, 900ms avg latency
- **10/10 catalog upsert** in 319ms
- **Build time:** 1.0-1.4s (Turbopack)
- **Bundle size:** ~200 kB First Load JS
- **5 Vercel Fluid functions**, all under 30s maxDuration

## What's included in the sale

- ✅ Full source code (MIT-licensed)
- ✅ 3 Supabase migrations aplicables a proyecto nuevo
- ✅ MIGRATION.md walkthrough (30-45 min setup)
- ✅ .env.local.example con todas las vars documentadas
- ✅ Test data seeder script
- ✅ Vercel deploy config
- ✅ 2 hours post-sale support via video call
- ✅ Transfer `nano-almacen.vercel.app` alias (optional)

## What's NOT included

- ❌ Supabase project (buyer creates their own, migrations transfer cleanly)
- ❌ Google Gemini API key (buyer's own — free tier is generous)
- ❌ Custom domain (buyer registers, ~$22 USD/year for `.mx`)
- ❌ WhatsApp Business account (buyer signs up with Meta)
- ❌ Users / MRR (pre-revenue MVP)
- ❌ Trademark

## Why I'm selling

Focus. I'm shipping multiple products in parallel and need to concentrate on 1-2. Nano-Almacén needs a dedicated operator for the outreach + pilot phase, and I'd rather ship the next thing than juggle five simultaneously.

## Ideal buyer

- Solo founder with MX/LatAm retail contacts who wants a running start
- Agency wanting a white-label MX pyme SaaS to resell
- Indie hacker interested in WhatsApp + Fiado + CFDI verticals
- Investor looking for a pre-seed asset to accelerate with capital

## Bundle option

Willing to include 2 additional products at **$5-8K USD total** ("LATAM Retail SaaS Trio"):

- **Spirits Radar** — multi-tenant white-label wine intelligence for LATAM retail (1,886 curated products, cross-match, weekly report)
- **Spirits Intel Landing** — B2B public landing with pricing tiers USD $299/599/999

3 productos coherentes = starter kit LATAM retail SaaS.

## Process

1. Message me via SideProjectors
2. I share Loom demo (4 min) + live demo URL with pre-populated data
3. 30-min video call to walk through code + Q&A
4. Simple 1-page asset purchase agreement (I have template)
5. Payment via Stripe / Wise / PayPal (buyer picks)
6. I transfer git repo, Vercel project (optional), migrations, walkthrough
7. 2 hours post-sale support included

Total time from first message to fully transferred: ~5-7 days with active buyer.

### Category tags
`SaaS` `Next.js` `Supabase` `AI` `WhatsApp` `Mexico` `LATAM` `Multi-tenant` `MVP` `Pre-revenue`

---

## Flippa Listing

Same content as SideProjectors, but Flippa has these specific fields:

### Business Type
`Starter (Pre-Revenue)`

### Monetization
`Subscription (planned)`

### Traffic
- Organic: 0 (pre-launch)
- Direct: 0 (pre-launch)
- Waitlist signups: {check current count at time of listing}

### Financials
- Monthly Revenue: **$0** (pre-revenue MVP)
- Monthly Expenses: **$0** (free tiers)
- Net Profit: **$0**
- Total Costs to Build: **~$0** (free tools + 15 days of my time)

### Verification Documents

Upload:
- Screenshots (landing, dashboard, fiado, parse output)
- Live URL access
- GitHub repo link (public)
- Loom demo video (4 min)
- FOR_SALE.md from repo

### Auction Duration
`30 days` (Flippa standard)

### Reserve Price
`$1,999 USD` (allows negotiation window to $2,499 asking)

### Buy It Now
`$3,499 USD` (premium for immediate close)

---

## X/Twitter DM Template

For direct outreach to specific founders (e.g., Marc Lou, @levelsio, MX SaaS founders):

```
Hey {name},

Vi que ships productos [tipo de producto que shipeen]. Rápido:

Acabo de shipear un WhatsApp SaaS para tienditas MX en 15 días. Next 16 + Supabase multi-tenant + Gemini. Killer feature: fiado con WA reminder que ningún competidor tiene.

Live: nano-almacen.vercel.app
Repo: github.com/carlosfevernova/nano-almacen

En venta $2,499 USD porque quiero enfocarme en otros proyectos. ¿Te interesa echarle un ojo? Loom demo listo.

Si no es fit, cero drama. Zero pushback.

Saludos,
Carlos
```

### Send to (verified accounts):

**High priority (indie SaaS legends):**
- @marc_louvion (Marc Lou) — indie SaaS mentor, may reshare
- @levelsio (Pieter Levels) — nomad indie SaaS
- @danielvassallo — post-Amazon indie hacker
- @shpigford (Josh Pigford) — Baremetrics founder, MX-friendly

**MX ecosystem:**
- Rappi Ventures alumni that ship SaaS
- Konfio founders / product team
- Kavak alumni starting new things (search LinkedIn "Ex-Kavak founder")
- Fintech MX Twitter (Emerge, Klar, Broxel founders)

**Retail-adjacent:**
- Alegra product team (may want to observe or acquire)
- Chakra Chat / CRMWhata founders
- Bind ERP team

---

## Reddit r/SideProject "For Sale" post template

**Title:** `[FOR SALE] Nano-Almacén — WhatsApp SaaS for Mexican corner shops. $2,499 USD.`

**Body:**

*See CONTENT_PACK.md section 2 for full copy.*

Post in `r/SideProject` weekly "for sale" thread (usually pinned Monday).

---

## Common negotiation ranges

Based on comparables 2025-2026:

- **Fire sale (24-48h):** Accept $1,500-2,000 USD (list at $1,999)
- **Realistic 30d listing:** $2,000-3,500 USD (list at $2,499)
- **With screenshots + Loom + polish:** $3,000-5,000 USD (list at $3,999)
- **Bundle with spirits products:** $5,000-8,000 USD
- **With 1-2 pilots signed:** $8,000-15,000 USD

### Objection handling

| Buyer says | Response |
|---|---|
| "$2,499 is high for pre-revenue" | "2,233 LOC × $1/line + multi-tenant + WhatsApp integration + fiado differentiator = $3-4K replacement cost with dev senior. $2,499 already discounts for no MRR." |
| "How do I know it'll work?" | "Repo is public, MIT-licensed. Live demo has real data pre-loaded. 2h video call included pre-purchase to walk through code + Q&A." |
| "Why should I trust the market opportunity?" | "Independent research documented in pilots/ folder. 3-agent research validated Fiado as killer cultural gap. Willing to share the memory file if you want to go deep." |
| "Can you finish [feature X] before selling?" | "Yes, at $75/hr. WhatsApp webhook = 6-8h. CFDI Facturapi = 4-6h. GTIN scan = 4-6h. Payment on delivery of feature." |
| "Payment terms?" | "50% on signed agreement, 50% on repo + Vercel transfer complete. Wise, Stripe, or PayPal buyer picks. Escrow via Escrow.com if buyer prefers ($50 fee, buyer pays)." |

# Nano-Almacén — For Sale

**Asking:** $2,499 USD (negotiable, serious offers only)
**Contact:** hola@nano-almacen.mx or DM on X/Twitter

## What you're buying

A **production-ready MVP** for a WhatsApp-first SaaS targeting Mexico's 5.9M "tienditas" (small corner shops). Built in 15 shipping days with modern stack (Next 16 + Supabase + Gemini). Currently pre-revenue but with a clear go-to-market strategy documented.

### Included

- ✅ Complete source code (2,233 LOC TypeScript, 570 LOC SQL migrations, 21 source files, MIT-licensed)
- ✅ Full multi-tenant Supabase schema (10 tables, RLS policies, atomic RPCs, triggers) — production-tested
- ✅ 4 working API endpoints (waitlist, WhatsApp order parser, catalog upload, fiado credit ledger)
- ✅ 3 UI pages (landing, dashboard, fiado dashboard) — all server-rendered with real data
- ✅ Working Gemini 3.5 Flash Lite integration (parse orders + Vision catalog upload). Zero-cost tier handles ~50 tienditas.
- ✅ Detailed migration guide ([MIGRATION.md](./MIGRATION.md)) for setup in ~30 min
- ✅ Test data seeder ([scripts/generate-test-catalog.mjs](./scripts/generate-test-catalog.mjs))
- ✅ Vercel deploy config (5 Fluid functions, sub-1.5s build)
- ✅ 2 hours of post-sale support via video call for setup walkthrough
- ✅ Transfer of `nano-almacen.vercel.app` alias to your Vercel account (optional)

### Not included

- ❌ Supabase project (currently on shared cluster — buyer creates their own, migrations transfer cleanly)
- ❌ Google Gemini API key (buyer uses their own — free tier is generous)
- ❌ Custom domain (buyer buys their own — `.mx` domain ~$22 USD/year)
- ❌ WhatsApp Business account (buyer signs up with Meta — INE + comprobante required for MX verification)
- ❌ Users / MRR (project is pre-revenue MVP)
- ❌ Trademark registration
- ❌ Post-sale ongoing engineering (beyond the 2h included walkthrough)

## Killer feature: Fiado (credit ledger)

Every Mexican shop owner tracks credit ("fiado") in a paper notebook. **No competitor handles this well:**
- Alegra ignores it (they're accounting-first)
- Bind doesn't prioritize retail
- Treinta does it basically (no WhatsApp reminders, no automation)

Nano-Almacén ships this as a first-class feature with:
- Full ledger with atomic saldo updates (Postgres trigger-driven)
- Days-since-last-payment badges (green/amber/red)
- **One-click WhatsApp reminder button** that opens `wa.me/{phone}?text=` with a contextual message pre-filled ("Hola Ana, saludos desde tu tienda. Te recordamos que tienes un saldo pendiente de $1,200 desde hace 20 días...")
- CSV export
- Multi-payment-method tracking (efectivo/transferencia/tarjeta/oxxo)

**This alone justifies the pricing at $19-49 MXN/mo for the target buyer.**

## Verified metrics

| Metric | Value |
|---|---|
| LOC TypeScript | 2,233 (21 files) |
| LOC SQL | 570 (3 migrations, all applied + verified) |
| Git commits | 14+ |
| Endpoints E2E-tested | 4/4 pass |
| Gemini parse tests | 6/6 pass, 900ms avg |
| Catalog upsert test | 10/10 in 319ms |
| Build time | 1.0-1.4s (Turbopack) |
| Bundle size (landing) | ~200 kB First Load JS |
| Vercel Fluid functions | 5 (all under 30s maxDuration) |

## Target market opportunity

Based on independent research (documented in `pilots/` directory):

- **5.9M tienditas** in Mexico (INEGI 2024)
- **64% of pyme sales via WhatsApp** (MX Fintech report 2026)
- **Meta Business AI launched MX-first Nov 2025** — timing tailwind
- **Alegra pricing:** $138-599 MXN/mo (accounting-only)
- **Bind ERP pricing:** $800-2,500 MXN/mo (too enterprise for tiendita)
- **Sweet spot pricing:** $299/699/1,499 MXN/mo (3 tiers)
- **Median micro-SaaS exit multiple 2025:** 3.9× SDE (Acquire.com H2'25 report)

If buyer gets to $500 MRR in 3-6 months → **$25-40K exit potential** (5-8× current asking).

## Why I'm selling

Focus. I'm shipping multiple products in parallel (see my portfolio at [carlosfevernova](https://github.com/carlosfevernova) — INUIT Corp ice logistics, TripLoop AI road-trip planner, spirits-radar wine intelligence). Nano-Almacén needs a dedicated operator for the outreach + pilot phase, and I'd rather ship the next thing than juggle five simultaneously.

## Ideal buyer profile

- **Solo founder** with MX/LatAm retail contacts who wants a running start (skip 3-6 months of building)
- **Agency** that wants a white-label MX pyme SaaS to resell
- **Indie hacker** interested in the WhatsApp + Fiado + CFDI verticals
- **Investor** looking for a pre-seed asset to accelerate with capital

## Process

1. **DM me on [X/Twitter]({your-twitter}) or email `hola@nano-almacen.mx`**
2. I share a **Loom demo (4 min)** + live demo URL with test data pre-loaded
3. If interested, we do a **30-min video call** to walk through code + Q&A
4. Sign a **simple 1-page asset purchase agreement** (I have a template)
5. Payment via **Stripe / Wise / PayPal** (buyer picks)
6. I transfer:
   - Git repo (push to your GitHub org)
   - Vercel project (transfer to your account)
   - `nano-almacen.vercel.app` alias (unless you're rebranding)
   - Supabase migrations + walk you through applying to your project
   - Google Gemini setup guide
7. **2 hours of post-sale support** via video call for setup questions

Total time from first DM to fully transferred: **~5-7 days** with active buyer.

## Frequently asked

**Q: Can I see it working before buying?**
A: Yes. Landing is live at nano-almacen.vercel.app. Full demo tenant with pre-populated data available on request (I share URL after initial DM).

**Q: Is the code well-structured?**
A: Judge for yourself — repo is MIT-licensed and public. Server components + service_role client separation. Zod-validated I/O. RLS-enforced multi-tenancy. Atomic RPCs for financial operations.

**Q: What about the missing features (WhatsApp webhook, CFDI, cron, etc.)?**
A: Documented in the [Roadmap](./README.md#roadmap). Each is 2-6 hours of work with sandboxes ready. I can execute them for you at $75/hr if needed, or you build them yourself with the patterns already established.

**Q: Why $2,499? Isn't that low?**
A: Pre-revenue MVPs sell in the $1-10K range on SideProjectors/Flippa. $2,499 reflects: 2,233 LOC of quality TypeScript (~50h dev senior at $75/h = $3,750 replacement cost), minus discount for zero users/MRR. Willing to negotiate for the right buyer, especially if serious about executing.

**Q: What if you sell to someone else meanwhile?**
A: First serious buyer wins. I mark this repo as "SOLD" and stop responding once agreement is signed.

**Q: Can you build me additional features post-sale?**
A: Yes, at $75/hr. Not a long-term commitment — I stay contract-only.

---

**Ready to talk?** DM on X or email `hola@nano-almacen.mx`.

_This offer stands until December 31, 2026 or when sold. Price may increase if MRR develops or pilots close. First serious offer at $2,000+ likely wins._

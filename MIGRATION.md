# Migration Guide for New Owners

If you acquired this repo, this document walks you through setting up a fresh production environment in ~30 minutes.

## Step 1: Create your Supabase project (5 min)

1. Sign up at [supabase.com](https://supabase.com) (free tier is fine to start)
2. Create a new project — pick a region close to your customers (`us-east-1` for MX/US)
3. Wait 2-3 min for provisioning
4. Go to **Settings → API** and copy:
   - Project URL (`https://xxxxx.supabase.co`)
   - Anon public key (`eyJ...`)
   - Service role secret (`eyJ...`) — **keep this private, never commit**

## Step 2: Apply migrations (5 min)

Open the Supabase SQL Editor:
`https://supabase.com/dashboard/project/{your-ref}/sql/new`

Run these in order (paste + Cmd/Ctrl+Enter each):

1. `supabase/migrations/001_initial_schema.sql` — creates 7 tables + RLS + `create_tenant()` RPC
2. `supabase/migrations/002_waitlist.sql` — waitlist_signups public table
3. `supabase/migrations/003_fiado.sql` — fiado ledger + trigger + view

Verify success with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
  AND table_name IN ('tenants','tenant_users','products','customers','orders','order_items','whatsapp_conversations','waitlist_signups','fiados','fiado_movimientos')
ORDER BY table_name;
-- Should return 10 rows
```

## Step 3: Create your first tenant (2 min)

```sql
INSERT INTO tenants (slug, name, rfc, whatsapp_display_number)
VALUES ('mi-tienda', 'Mi Tiendita', 'XAXX010101000', '+52333XXXXXXX')
RETURNING id;
```

Save the returned `id` (UUID) — you'll use it as `tenant_id` in URLs.

## Step 4: Get Google Gemini API key (3 min)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with Google
3. Click "Create API key" → name it `nano-almacen-prod`
4. Copy the key (format: `AQ.Ab8R...`)

Free tier is 1,500 requests/day. Handles ~50 tienditas at typical usage. Upgrade to paid ($0.075/1M tokens) when scaling.

## Step 5: Deploy to Vercel (5 min)

```bash
# 1. Install Vercel CLI if needed
npm i -g vercel

# 2. Login and link
vercel login
vercel link  # creates .vercel/project.json

# 3. Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste service role key

vercel env add GOOGLE_GENAI_API_KEY production
# Paste Gemini key

# 4. Deploy
vercel deploy --prod --yes
```

You'll get a URL like `https://your-project.vercel.app`. Test:
- `https://your-project.vercel.app` — landing loads
- `https://your-project.vercel.app/dash?tenant_id={your-tenant-id}` — dashboard loads
- `https://your-project.vercel.app/api/parse-order` (POST) — should return `503 ai_not_configured` if key missing, else parse

## Step 6: Custom domain (10 min)

1. Buy a domain (e.g., `nanoalmacen.mx` on Namecheap ~$22 USD/year for `.mx`, or `nano-almacen.com` ~$12 USD/year)
2. Vercel dashboard → **Project → Settings → Domains → Add**
3. Enter your domain, Vercel gives DNS records
4. Add records in your registrar:
   - **A record** apex → `76.76.21.21`
   - **CNAME** www → `cname.vercel-dns.com`
5. Wait 5-30 min for propagation
6. Vercel auto-issues SSL Let's Encrypt

## Step 7: Optional — set up integrations

### WhatsApp Cloud API (Meta Business)

1. Sign up at [business.facebook.com](https://business.facebook.com) — verify your business (INE + comprobante domicilio for MX)
2. Add WhatsApp Business Platform product
3. Get phone number → note the `phone_number_id`
4. Create permanent access token → `WHATSAPP_ACCESS_TOKEN`
5. Set webhook URL: `https://your-domain.com/api/whatsapp/webhook` (not shipped yet — see roadmap)
6. Add to Vercel env vars

### CFDI 4.0 via Facturapi

1. Sign up at [facturapi.io](https://facturapi.io)
2. Configure your RFC and CSD certificates
3. Copy sandbox API key → `FACTURAPI_KEY`
4. Test emission via API (endpoint not yet shipped — see roadmap)

### Stripe / Mercado Pago (for customer payments)

Add later when you're ready. Env vars documented in `.env.local.example`.

## Step 8: Delete demo data (30 sec)

Once you're set up, remove the demo tenant if you don't want it:
```sql
DELETE FROM tenants WHERE slug = 'test-tienda';
-- cascades to products/customers/orders/etc.
```

## Common issues

### "supabase_not_configured" 503 on API calls
Env vars not set in Vercel. Check with `vercel env ls`. Redeploy after adding: `vercel deploy --prod`.

### "tenant_not_found" on /dash
The `tenant_id` in URL doesn't exist in DB. Verify with:
```sql
SELECT id, slug, name FROM tenants;
```

### Migrations failed with "extension already exists"
Rerun the migration — the `create extension if not exists` clause is idempotent.

### Landing works but dashboard says "Falta tenant_id"
Add `?tenant_id={uuid}` to the URL. Future: add auth cookie replacing this manual step.

## Support

If you got stuck: open an issue on GitHub, or reach out to the original author (see README credits).

Estimated setup time: **30-45 minutes** if all signups go smoothly.

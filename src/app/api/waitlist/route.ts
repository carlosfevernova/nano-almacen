import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WaitlistPayload {
  email: string;
  whatsapp_phone?: string | null;
  business_name?: string | null;
  city?: string | null;
  source?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: WaitlistPayload;
  try {
    body = (await request.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Supabase not wired yet — accept the signup silently so the form UX is clean.
    console.warn("[waitlist] Supabase env vars missing; signup dropped", { email });
    return NextResponse.json({ ok: true, pending: true });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("waitlist_signups").insert({
    email,
    whatsapp_phone: body.whatsapp_phone?.trim() || null,
    business_name: body.business_name?.trim() || null,
    city: body.city?.trim() || null,
    source: body.source ?? "landing",
    utm_source: body.utm_source ?? null,
    utm_medium: body.utm_medium ?? null,
    utm_campaign: body.utm_campaign ?? null,
  });

  if (error) {
    // 23505 = unique violation (email already in list) — treat as success for UX.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("[waitlist] insert failed", error);
    return NextResponse.json({ error: "storage_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

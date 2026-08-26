import { NextResponse } from "next/server";
import { parseOrder, isAiConfigured } from "@/lib/claude/parse-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ParsePayload {
  message?: string;
  tenantName?: string;
  customerName?: string | null;
}

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "ai_not_configured", hint: "Set GOOGLE_GENAI_API_KEY in Vercel env vars" },
      { status: 503 }
    );
  }

  let body: ParsePayload;
  try {
    body = (await request.json()) as ParsePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length > 2000) {
    return NextResponse.json(
      { error: "invalid_message", hint: "message required, ≤ 2000 chars" },
      { status: 400 }
    );
  }

  try {
    const started = Date.now();
    const parsed = await parseOrder({
      message,
      tenantName: body.tenantName,
      customerName: body.customerName ?? null,
    });
    const elapsed_ms = Date.now() - started;

    return NextResponse.json({ ok: true, parsed, elapsed_ms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[parse-order] failed", err);
    return NextResponse.json(
      { error: "parse_failed", detail: message },
      { status: 500 }
    );
  }
}

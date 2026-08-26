"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

interface WaitlistFormProps {
  variant?: "hero" | "cta";
}

export default function WaitlistForm({ variant = "hero" }: WaitlistFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      whatsapp_phone: String(formData.get("whatsapp_phone") ?? "").trim() || null,
      business_name: String(formData.get("business_name") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      source: variant,
    };

    if (!payload.email) {
      setState("error");
      setMessage("Necesitamos tu correo para avisarte.");
      return;
    }

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No pudimos guardar tu registro.");
      }

      setState("success");
      setMessage("¡Listo! Te escribimos cuando abramos tu ciudad.");
      form.reset();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Algo salió mal, inténtalo de nuevo.");
    }
  }

  const isCta = variant === "cta";

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full ${isCta ? "max-w-xl" : "max-w-lg"} space-y-3`}
      aria-label="Únete a la lista de espera"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="business_name"
          placeholder="Nombre de tu tiendita"
          autoComplete="organization"
          className="h-12 rounded-lg border border-neutral-200 bg-white px-4 text-base placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none"
        />
        <input
          type="text"
          name="city"
          placeholder="Ciudad (GDL, CDMX...)"
          autoComplete="address-level2"
          className="h-12 rounded-lg border border-neutral-200 bg-white px-4 text-base placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          name="email"
          required
          placeholder="tu@correo.com"
          autoComplete="email"
          className="h-12 rounded-lg border border-neutral-200 bg-white px-4 text-base placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none"
        />
        <input
          type="tel"
          name="whatsapp_phone"
          placeholder="WhatsApp (opcional)"
          autoComplete="tel"
          className="h-12 rounded-lg border border-neutral-200 bg-white px-4 text-base placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={state === "submitting"}
        className="h-12 w-full rounded-lg bg-emerald-600 px-5 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Guardando..." : "Apártame un lugar gratis"}
      </button>

      {message && (
        <p
          role="status"
          className={`text-sm ${state === "success" ? "text-emerald-700" : "text-red-600"}`}
        >
          {message}
        </p>
      )}

      <p className="text-xs text-neutral-500">
        Sin spam. Te avisamos solo cuando abrimos tu ciudad.
      </p>
    </form>
  );
}

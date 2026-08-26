import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

const FEATURES = [
  {
    title: "Pedidos por WhatsApp que se entienden solos",
    desc: "Tu cliente escribe «5 coronas y 2 sabritas» y Nano-Almacén lo convierte en una orden lista. Sin que tú captures nada.",
    icon: "💬",
  },
  {
    title: "Factura al SAT sin salir del chat",
    desc: "Cuando el cliente paga, emitimos su CFDI 4.0 automáticamente. RFC, uso fiscal y método — todo mapeado.",
    icon: "🧾",
  },
  {
    title: "Tu catálogo, cargado en 5 minutos",
    desc: "Súbenos tu Excel o mándanos fotos de tus productos. Reconocemos precios, marcas y códigos por ti.",
    icon: "📦",
  },
  {
    title: "Todo tu día en un dashboard",
    desc: "Cuánto vendiste, qué falta en anaquel, quién te compra más. Sin abrir ocho apps distintas.",
    icon: "📊",
  },
  {
    title: "OXXO, transferencia o tarjeta",
    desc: "Cobra como quieras. Stripe y Mercado Pago integrados. Los cambios se registran solos.",
    icon: "💳",
  },
  {
    title: "Para tienditas que no tienen tiempo",
    desc: "Un WhatsApp. Un token. Un click. No aprendes software nuevo — sigues trabajando como siempre.",
    icon: "⚡",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Conecta tu WhatsApp",
    desc: "Autorizas Nano-Almacén con tu número de WhatsApp Business. Toma 3 minutos.",
  },
  {
    step: "2",
    title: "Sube tu catálogo",
    desc: "Arrastra tu Excel o tómale foto a tus productos. Nosotros armamos el catálogo por ti.",
  },
  {
    step: "3",
    title: "Empieza a vender",
    desc: "Cuando llegue un mensaje, tú solo confirmas. Nosotros generamos la orden, cobramos y facturamos.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$299",
    period: "MXN / mes",
    tagline: "Para tienditas que apenas empiezan a vender por WA.",
    features: [
      "Hasta 300 pedidos/mes",
      "100 facturas CFDI incluidas",
      "1 número de WhatsApp",
      "Dashboard básico",
      "Soporte por email",
    ],
    cta: "Empezar Starter",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$699",
    period: "MXN / mes",
    tagline: "Cuando el WhatsApp ya no da abasto y necesitas orden.",
    features: [
      "Hasta 1,000 pedidos/mes",
      "500 facturas CFDI incluidas",
      "1 número de WhatsApp + repartidor",
      "Reportes de ventas y clientes",
      "Soporte prioritario WhatsApp",
    ],
    cta: "Empezar Growth",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$1,499",
    period: "MXN / mes",
    tagline: "Para tiendas con varios repartidores o sucursales.",
    features: [
      "Pedidos ilimitados",
      "2,000 facturas CFDI incluidas",
      "PWA repartidor con rutas",
      "Multi-usuario (dueño + staff)",
      "Integración con tu proveedor",
    ],
    cta: "Empezar Pro",
    highlighted: false,
  },
];

const FAQS = [
  {
    q: "¿Necesito computadora?",
    a: "No. Todo funciona desde tu WhatsApp normal y tu celular. Un dashboard web opcional para ver reportes.",
  },
  {
    q: "¿Es legal facturar así al SAT?",
    a: "Sí. Emitimos CFDI 4.0 timbrado a través de Facturapi, un PAC autorizado por el SAT. Cada factura tiene su UUID válido.",
  },
  {
    q: "¿Y si mi cliente no quiere factura?",
    a: "Perfecto. Solo se genera factura si el cliente la pide y da su RFC. Los demás pedidos se registran sin CFDI.",
  },
  {
    q: "¿Cuánto tarda en estar listo?",
    a: "El mismo día lo dejamos funcionando. Nosotros te ayudamos con el catálogo, el WhatsApp Business y el primer pedido.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. No hay contrato, no hay penalización. Pagas mes a mes.",
  },
];

export default function Home() {
  return (
    <>
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              N
            </span>
            Nano-Almacén
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-neutral-700 md:flex">
            <a href="#como-funciona" className="hover:text-neutral-950">Cómo funciona</a>
            <a href="#features" className="hover:text-neutral-950">Funciones</a>
            <a href="#precios" className="hover:text-neutral-950">Precios</a>
            <a href="#faq" className="hover:text-neutral-950">Preguntas</a>
          </nav>

          <a
            href="#waitlist"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Apártate gratis
          </a>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="grain-hero border-b border-neutral-200/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Beta abierta — GDL, CDMX y Monterrey
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-6xl">
              Pedidos por WhatsApp <br className="hidden sm:block" />
              con factura al SAT, <span className="text-emerald-600">sin capturar nada.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 sm:text-xl">
              Nano-Almacén lee los mensajes de tus clientes, arma el pedido, cobra y factura automático.
              Hecho para tienditas y abarrotes de México que no tienen tiempo de aprender otra app.
            </p>

            <div className="mt-10 flex justify-center" id="waitlist">
              <WaitlistForm variant="hero" />
            </div>

            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-500">
              <span>✓ CFDI 4.0 timbrado (Facturapi)</span>
              <span>✓ WhatsApp Cloud API oficial</span>
              <span>✓ Sin contrato ni penalización</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona ───────────────────────────────────────────── */}
      <section id="como-funciona" className="border-b border-neutral-200/70 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Tres pasos. Un mismo día.
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              No hay curso, no hay migración. Solo conectas tu WhatsApp y sigues trabajando como siempre.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 font-display text-xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-neutral-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-neutral-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────── */}
      <section id="features" className="border-b border-neutral-200/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Todo lo que hoy haces manual, automático.
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Escribir el pedido en un cuaderno, ir al Excel, capturar en la máquina de facturas, cobrar por
              transferencia — todo eso desaparece.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 font-display text-lg font-semibold text-neutral-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────── */}
      <section id="precios" className="border-b border-neutral-200/70 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Precios claros, en pesos.
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Sin trucos, sin cargos por usuario, sin tarifas ocultas. Cancelas cuando quieras.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-2xl border p-8 ${
                  tier.highlighted
                    ? "border-emerald-600 bg-white shadow-lg ring-1 ring-emerald-600"
                    : "border-neutral-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <span className="mb-4 inline-flex w-fit rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    Más popular
                  </span>
                )}

                <h3 className="font-display text-2xl font-semibold text-neutral-950">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{tier.tagline}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-neutral-950">
                    {tier.price}
                  </span>
                  <span className="text-sm text-neutral-500">{tier.period}</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-neutral-700">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#waitlist"
                  className={`mt-8 rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-neutral-500">
            ¿Facturas más? Plan Enterprise personalizado. <a href="mailto:hola@nano-almacen.mx" className="underline">Hablemos</a>.
          </p>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-neutral-200/70">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Preguntas que nos hacen seguido.
          </h2>

          <dl className="mt-14 space-y-8">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border-b border-neutral-200 pb-6 last:border-none">
                <dt className="font-display text-lg font-semibold text-neutral-950">{faq.q}</dt>
                <dd className="mt-2 text-neutral-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── CTA final ───────────────────────────────────────────────── */}
      <section className="border-b border-neutral-200/70 bg-neutral-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Empieza gratis, sin tarjeta.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
            Los primeros 50 negocios en GDL, CDMX y Monterrey reciben 3 meses de plan Growth gratis
            + onboarding con nosotros. Solo tienes que registrar tu tiendita.
          </p>

          <div className="mt-10 flex justify-center">
            <WaitlistForm variant="cta" />
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Nano-Almacén. Hecho en México.</p>
          <div className="flex gap-6">
            <a href="mailto:hola@nano-almacen.mx" className="hover:text-neutral-900">Contacto</a>
            <a href="/privacidad" className="hover:text-neutral-900">Privacidad</a>
            <a href="/terminos" className="hover:text-neutral-900">Términos</a>
          </div>
        </div>
      </footer>
    </>
  );
}

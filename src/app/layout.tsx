import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nano-almacen.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nano-Almacén · Pedidos por WhatsApp con factura automática para tu tiendita",
    template: "%s · Nano-Almacén",
  },
  description:
    "Recibe pedidos por WhatsApp, tu catálogo se llena solo, y cada venta se factura al SAT sin capturar nada. Hecho para tienditas y abarrotes en México.",
  keywords: [
    "WhatsApp pedidos",
    "CFDI 4.0",
    "factura tiendita",
    "punto de venta WhatsApp",
    "SaaS abarrotes México",
    "software tiendita",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "Nano-Almacén",
    title: "Pedidos por WhatsApp con factura al SAT — sin capturar nada",
    description:
      "Cada mensaje se convierte en orden. Cada orden en factura. Para tienditas que no tienen tiempo de aprender otro software.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nano-Almacén · WhatsApp + CFDI para tienditas MX",
    description: "Pedidos por WhatsApp con factura automática al SAT.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}

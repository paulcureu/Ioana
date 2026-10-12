import type { Metadata, Viewport } from "next";

// fonturi găzduite local (fără cereri către Google Fonts), cu diacritice românești
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Portofoliu studențesc — Bude Ioana Nicola",
  description:
    "Portofoliul studențesc al Ioanei Nicola Bude, An 2, Facultatea de Arhitectură și Urbanism Cluj-Napoca — răsfoit ca o carte.",
  openGraph: {
    title: "Portofoliu studențesc — Bude Ioana Nicola",
    description: "Arhitectură, An 2 · FAU Cluj-Napoca · 2025—2026. Răsfoiește portofoliul ca pe o carte.",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    locale: "ro_RO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#d6bc95",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preload" as="image" href="/textures/desk-oak.webp" />
        <link rel="preload" as="image" href="/textures/linen.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Caveat, Rajdhani } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Usada só nos números do placar da skin "Arena" (rank e %) — dá o tom de
// scoreboard/gaming que o resto do app (texto corrido, em Geist) não tem.
const orbitron = Orbitron({
  variable: "--font-arena-display",
  subsets: ["latin"],
  weight: ["700", "900"],
});

// Usada só nos bilhetes rabiscados dos cantos da skin "Zoeira" — dá o tom
// de post-it/marcador escrito à mão que o resto do app (Geist) não tem.
const caveat = Caveat({
  variable: "--font-zoeira-doodle",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Usada nos valores/números da skin "Futurista" — combina com o Orbitron
// (--font-arena-display, reaproveitado pros nomes/rótulos dessa skin) pro
// tom de HUD de painel de nave que o resto do app não tem.
const rajdhani = Rajdhani({
  variable: "--font-futurista-body",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ranking de Vendas",
  description: "Sistema de Ranking e Gamificação de Vendas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${caveat.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

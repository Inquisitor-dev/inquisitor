import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Inquisitor — Listen. Analyze. Condemn.",
  description:
    "An AI-driven detective simulation. Interrogate villagers powered by living AI agents, expose contradictions, and condemn the guilty.",
  keywords: ["AI game", "detective simulation", "The Inquisitor", "inquisitor ai", "LLM game"],
  openGraph: {
    title: "The Inquisitor",
    description: "Nobody in this village is what they seem.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

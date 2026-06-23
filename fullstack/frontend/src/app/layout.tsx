import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import FloatingChat from "@/components/FloatingChat";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParkPulse — Parking Enforcement Intelligence for Bengaluru",
  description:
    "Turning 298,000 parking-violation records into targeted enforcement: detect hotspots, " +
    "score their traffic impact, forecast them, and deploy patrols. Gridlock Hackathon 2.0.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark h-full antialiased ${inter.variable}`}>
      <body className="h-full bg-background text-foreground">
        <div className="flex h-screen flex-col md:flex-row">
          <Nav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <FloatingChat />
      </body>
    </html>
  );
}

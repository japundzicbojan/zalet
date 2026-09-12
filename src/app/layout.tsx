import type { Metadata } from "next";
import { Instrument_Serif, Sora } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sans = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Zalet — Founders build. Zalet gives them a push.",
  description:
    "Paste your product URL. Get a full UGC content market strategy, filming guide, and production pack: 7-day plan, on-camera scripts, stills, and a zip ready to shoot.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} relative antialiased`}
      >
        <div className="relative z-[1] min-h-screen">{children}</div>
      </body>
    </html>
  );
}

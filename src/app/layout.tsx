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
  title: "Zalet: Founders build. Zalet gives them a push.",
  description:
    "Paste your product URL for a UGC market strategy, filming guide, on-camera scripts, stills, optional video, and a zip pack. Refine or generate next week on the same board.",
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

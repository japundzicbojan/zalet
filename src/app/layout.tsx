import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Zalet: a week of promo for founders who sell their own product",
  description:
    "Paste your product URL. Get a 7-day plan, scripts you can film, creatives, and a Daytona pack.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} relative antialiased`}>
        <div className="relative z-[1] min-h-screen">{children}</div>
      </body>
    </html>
  );
}

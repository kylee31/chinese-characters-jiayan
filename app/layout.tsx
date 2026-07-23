import type { Metadata } from "next";
import { Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const notoSerifSc = Noto_Serif_SC({
  display: "swap",
  variable: "--font-noto-serif-sc",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Jiayan Analyzer",
  description: "Classical Chinese analysis with Next.js, FastAPI, and Jiayan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased ${notoSerifSc.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

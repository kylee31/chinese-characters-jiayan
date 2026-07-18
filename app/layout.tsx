import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

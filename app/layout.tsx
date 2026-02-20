import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHADOW_NET // TERMINAL v4.2.1",
  description: "Advanced Penetration Framework",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

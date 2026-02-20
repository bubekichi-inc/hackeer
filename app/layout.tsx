import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHADOW_NET",
  description: "パソコンに詳しい人っぽく見えるWebサイト",
  openGraph: {
    title: "SHADOW_NET",
    description: "パソコンに詳しい人っぽく見えるWebサイト",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SHADOW_NET",
    description: "パソコンに詳しい人っぽく見えるWebサイト",
    images: ["/og.png"],
  },
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

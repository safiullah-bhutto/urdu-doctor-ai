import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "اردو ڈاکٹر AI",
  description: "آپ کی زبان میں، آپ کا پہلا صحت مشیر",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl" className="notranslate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="font-inter min-h-screen">{children}</body>
    </html>
  );
}

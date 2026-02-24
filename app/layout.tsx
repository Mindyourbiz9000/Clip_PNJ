import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickClip — Generate Video Clips",
  description:
    "Paste a direct video URL, pick start/end times, choose a format, and download your clip as MP4.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

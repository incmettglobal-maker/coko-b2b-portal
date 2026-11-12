import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COKO Jewellery — Wholesale",
  description:
    "Wholesale ordering portal for COKO Jewellery / Zevar by COKO. Businesses only — request access to see trade pricing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}

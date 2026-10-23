import type { Metadata } from "next";
import "../globals.css";
import { jakarta } from "../fonts";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration TMT" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="min-h-dvh bg-paper antialiased">{children}</body>
    </html>
  );
}

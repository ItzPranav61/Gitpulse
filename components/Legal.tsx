import type { ReactNode } from "react";

/** Set NEXT_PUBLIC_COMPANY_NAME and NEXT_PUBLIC_SUPPORT_EMAIL in your environment before launch. */
export const LEGAL = {
  product: "GitPulse",
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || "the GitPulse team",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  updated: "13 October 2026",
};

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>{title}</h1>
      <p style={{ opacity: 0.6, marginTop: 0 }}>Last updated: {LEGAL.updated}</p>
      {children}
    </main>
  );
}

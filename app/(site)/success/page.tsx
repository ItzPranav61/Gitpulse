import type { Metadata } from "next";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = { title: "You are on Pro", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string; demo?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="wrap" style={{ paddingBottom: 80, maxWidth: 720 }}>
      <header className="page-head">
        <h1>You are on Pro</h1>
        <p>Thank you. Here is your license key. Keep it somewhere safe.</p>
      </header>
      <SuccessClient sessionId={sp.session_id ?? ""} demo={sp.demo === "1"} />
    </main>
  );
}

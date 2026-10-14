import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <main className="wrap">
      <header className="page-head">
        <h1>Dashboard</h1>
        <p>See who views your widget, where they come from, and manage the domains it is served on. Available on Pro.</p>
      </header>
      <DashboardClient />
    </main>
  );
}

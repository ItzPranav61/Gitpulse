import type { Metadata } from "next";
import Link from "next/link";
import "../widget.css";
import "./site.css";
import { PulseIcon } from "@/components/icons";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: your GitHub activity on your portfolio`, template: `%s | ${SITE.name}` },
  description:
    "An embeddable widget that shows your GitHub streak, contribution graph and top projects on any website or Notion page. One snippet, always current.",
  icons: { icon: "/favicon.svg" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <nav className="nav" aria-label="Main">
            <Link href="/" className="logo">
              <span className="logo-mark">
                <PulseIcon width={18} height={18} />
              </span>
              {SITE.name}
            </Link>
            <div className="nav-links">
              <Link href="/docs" className="hide-sm">Docs</Link>
              <Link href="/#pricing" className="hide-sm">Pricing</Link>
              <Link href="/dashboard" className="hide-sm">Dashboard</Link>
              <Link href="/studio" className="btn btn-sm">Build your widget</Link>
            </div>
          </nav>
        </div>
        {children}
        <div className="wrap">
          <footer className="footer">
            <span>{SITE.name}. Reads public GitHub data only. Not affiliated with GitHub.</span>
            <span>
              <Link href="/docs">Docs</Link>
              <Link href="/studio">Studio</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refunds">Refunds</Link>
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}

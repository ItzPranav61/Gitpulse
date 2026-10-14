import type { Metadata } from "next";
import "../widget.css";
import "./embed.css";

export const metadata: Metadata = {
  title: "GitHub activity",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import StudioClient from "./StudioClient";

export const metadata: Metadata = {
  title: "Widget studio",
  description: "Customize your GitHub activity widget and copy the embed code.",
};

export default function StudioPage() {
  return (
    <main className="wrap">
      <header className="page-head">
        <h1>Widget studio</h1>
        <p>Enter your GitHub username, adjust the look, and copy the code for your site, Notion page or README.</p>
      </header>
      <StudioClient />
    </main>
  );
}

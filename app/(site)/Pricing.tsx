"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/config";

export default function Pricing() {
  const [plan, setPlan] = useState<PlanId>("monthly");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const p = PLANS[plan];

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: email || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setBusy(false);
    }
  }

  return (
    <div className="pricing">
      <div className="tier">
        <h3>Free</h3>
        <div className="price">
          $0 <small>forever</small>
        </div>
        <p className="hint">Everything you need for a personal site.</p>
        <ul className="ticks">
          <li>Streak, contribution graph, projects, languages, activity</li>
          <li>3 themes: Midnight, Paper, Terminal</li>
          <li>Website, Notion, README and JSON embeds</li>
          <li>Refreshes from GitHub every 15 minutes</li>
          <li>Small GitPulse badge in the footer</li>
        </ul>
        <Link href="/studio" className="btn btn-quiet">
          Build a free widget
        </Link>
      </div>

      <div className="tier">
        <h3>Pro</h3>
        <div className="plan-toggle" role="group" aria-label="Billing">
          {(Object.keys(PLANS) as PlanId[]).map((id) => (
            <button key={id} aria-pressed={plan === id} onClick={() => setPlan(id)}>
              {id === "monthly" ? "Monthly" : "Pay once"}
            </button>
          ))}
        </div>
        <div className="price">
          ${p.price} <small>{p.cadence}</small>
        </div>
        <ul className="ticks">
          <li>7 more themes and any accent color you like</li>
          <li>Remove the GitPulse badge</li>
          <li>Visitor analytics: views, unique visitors, referrers</li>
          <li>Serve the widget from your own domain</li>
          <li>Use it on up to 3 GitHub usernames</li>
        </ul>
        <div className="field">
          <label htmlFor="checkout-email">Email for your license key</label>
          <input id="checkout-email" className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-signal" onClick={checkout} disabled={busy}>
          {busy ? "Opening checkout" : plan === "monthly" ? "Get Pro for $3 a month" : `Get Pro for $${p.price}`}
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

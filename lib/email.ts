/**
 * Minimal transactional email through Resend's HTTP API (no dependency).
 * Set RESEND_API_KEY and EMAIL_FROM (an address on a domain you verified in Resend).
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [input.to], subject: input.subject, text: input.text }),
  });
  if (!res.ok) throw new Error(`Email provider responded with ${res.status}`);
}

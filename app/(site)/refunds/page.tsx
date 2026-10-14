import type { Metadata } from "next";
import { LegalPage, LEGAL } from "@/components/Legal";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      {/* TODO: confirm these terms are what you actually want to offer before launch */}
      <h2>Monthly plan</h2>
      <p>
        Cancel any time; your Pro features stay active until the end of the period you already paid for, and you
        will not be charged again. If you were charged by mistake or the service did not work for you, email us
        within 7 days of the charge and we will refund it.
      </p>

      <h2>Lifetime plan</h2>
      <p>
        If the license does not work for you, email us within 14 days of purchase for a full refund. After that,
        lifetime purchases are not refundable.
      </p>

      <h2>How to ask</h2>
      <p>
        Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> from the address used at checkout and include
        your license key. Approved refunds go back to the original payment method through Stripe and can take
        5 to 10 business days to appear. A refunded license is deactivated.
      </p>
    </LegalPage>
  );
}

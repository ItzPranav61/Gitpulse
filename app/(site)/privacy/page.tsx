import type { Metadata } from "next";
import { LegalPage, LEGAL } from "@/components/Legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what {LEGAL.product} (operated by {LEGAL.company}) collects when you use the
        website, the embeddable widget and the paid Pro features.
      </p>

      <h2>Visitors to a page that shows a widget</h2>
      <p>
        When a widget is loaded, we count one view. We do not use cookies or any persistent identifier. To count
        unique visitors we compute a one-way hash from the visitor&apos;s IP address and browser details combined
        with a secret and the current date. The hash changes every day, cannot be reversed, and is used only to
        count unique visitors per day for the widget owner&apos;s analytics. We also record the referring site and
        the date. We do not store IP addresses.
      </p>

      <h2>Widget owners</h2>
      <p>
        The widget displays public GitHub data (contributions, repositories, languages, events) for the username
        you choose, fetched through GitHub&apos;s API. We do not ask for access to your GitHub account and do not
        read private repositories. Private contribution counts appear only if you have enabled them on your own
        GitHub profile. GitHub data is cached for up to 15 minutes.
      </p>

      <h2>Customers (Pro)</h2>
      <p>
        When you buy Pro, payment is handled by Stripe. We never see or store your card number. We store the
        email address and Stripe customer and subscription identifiers Stripe gives us, your license key, the
        GitHub usernames the key is used with (up to three), and any custom domain you connect.
      </p>

      <h2>How we use data</h2>
      <p>
        Only to run the service: rendering widgets, showing you analytics, issuing and validating licenses,
        processing payments, preventing abuse and answering support requests. We do not sell personal data and do
        not use it for advertising.
      </p>

      <h2>Service providers</h2>
      <p>
        Stripe (payments), GitHub (source of widget data) and our hosting provider. These providers process data
        under their own privacy policies.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Daily visitor hashes and view counts are kept only as long as needed for analytics. License and billing
        records are kept while your license is active and as long as the law requires for accounting. To have your
        data deleted, email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for access to, correction of, or deletion of the personal data we hold about you by emailing
        us. If you are in the EU, UK or India you may have additional rights under local data protection law.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalPage>
  );
}

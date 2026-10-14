import type { Metadata } from "next";
import { LegalPage, LEGAL } from "@/components/Legal";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        By using {LEGAL.product}, operated by {LEGAL.company} (&quot;we&quot;), you agree to these terms. If you do
        not agree, do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        {LEGAL.product} provides an embeddable widget, image card and JSON API that display public GitHub activity.
        A free tier is available. Pro features (extra themes, custom accent colors, badge removal, analytics and
        custom domains) require a paid license.
      </p>

      <h2>Licenses</h2>
      <p>
        A Pro license is personal to the purchaser and may be used with up to three GitHub usernames. Do not share,
        resell or publish your key beyond embedding it in your own pages. We may disable keys that are shared or
        abused. A monthly license renews until cancelled. A lifetime license is valid for as long as we operate the
        service.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not attempt to disrupt the service, bypass rate limits or license checks, scrape it at scale, or use it
        to display content you do not have the right to show. Custom domains must be domains you control.
      </p>

      <h2>Third-party data</h2>
      <p>
        Widget data comes from GitHub and may be delayed, incomplete or unavailable. We are not affiliated with or
        endorsed by GitHub. GitHub is a trademark of its owner.
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep the service running but do not guarantee uninterrupted availability. Features may change.
        If we discontinue the service, we will give notice and, for monthly plans, stop billing.
      </p>

      <h2>Cancellation and refunds</h2>
      <p>
        You can cancel a monthly plan at any time; it stays active until the end of the paid period. See the{" "}
        <a href="/refunds">Refund Policy</a>.
      </p>

      <h2>Liability</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties. To the maximum extent permitted by law, our
        total liability is limited to the amount you paid us in the 12 months before the claim.
      </p>

      <h2>Changes and governing law</h2>
      <p>
        We may update these terms; continued use means you accept the changes. {/* TODO: add governing law and jurisdiction after review by a lawyer */}
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalPage>
  );
}

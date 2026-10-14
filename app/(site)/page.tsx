import Link from "next/link";
import { demoData } from "@/lib/demo";
import { getActivity } from "@/lib/github";
import { SITE } from "@/lib/config";
import HeroDemo from "./HeroDemo";
import Pricing from "./Pricing";

export const revalidate = 900;

export default async function Landing() {
  // The marketing page must never fail because GitHub (or the token) is having a bad day.
  const data = await getActivity("octocat").catch(() => demoData("octocat"));

  return (
    <main>
      <div className="wrap">
        <section className="hero">
          <div>
            <h1>Show your GitHub work on your portfolio. It keeps itself up to date.</h1>
            <p className="lead">
              Paste one snippet. {SITE.name} draws your streak, contribution graph and best projects straight from GitHub, and refreshes them every
              15 minutes.
            </p>
            <div className="cta-row">
              <Link href="/studio" className="btn btn-signal">
                Build your widget
              </Link>
              <Link href="/docs" className="btn btn-quiet">
                Read the docs
              </Link>
            </div>
            <p className="hero-note">Free for personal sites. Works in Notion, Framer, Webflow, plain HTML and your README.</p>
          </div>
          <HeroDemo data={data} />
        </section>
      </div>

      <section className="section" id="install">
        <div className="wrap install">
          <div>
            <h2>One snippet. Any page you control.</h2>
            <p className="sub">Add a placeholder and the script. The widget sizes itself to its content and loads lazily, so it never slows your page down.</p>
            <pre className="code" aria-label="Embed snippet">
              <span className="c">{"<!-- 1. where the widget appears -->"}</span>
              {"\n"}
              {"<div "}
              <span className="k">data-gitpulse</span>={'"'}
              <span className="s">your-username</span>
              {'"'} <span className="k">data-config</span>={'"'}
              <span className="s">t=dracula</span>
              {'"></div>'}
              {"\n\n"}
              <span className="c">{"<!-- 2. once per page -->"}</span>
              {"\n"}
              {"<script async src="}
              {'"'}
              <span className="s">{SITE.url}/embed.js</span>
              {'"></script>'}
            </pre>
          </div>
          <ul className="where">
            <li>
              <b>Websites</b>
              <span>Next.js, Astro, Framer, Webflow, WordPress or hand-written HTML. Anywhere you can add a script.</span>
            </li>
            <li>
              <b>Notion</b>
              <span>Type /embed and paste your widget link. It renders live inside the page.</span>
            </li>
            <li>
              <b>GitHub README</b>
              <span>Use the SVG card as an image. No script needed, so it works where scripts cannot run.</span>
            </li>
            <li>
              <b>Your own code</b>
              <span>The JSON API returns the same data the widget draws, with CORS enabled.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Built for people who ship in public</h2>
          <p className="sub">The details that make a profile widget worth keeping on your site.</p>
          <dl className="rows">
            <div className="row">
              <dt>Always current</dt>
              <dd>Data comes from the official GitHub GraphQL API and is cached for 15 minutes. If GitHub has a bad moment, visitors still see your last good numbers.</dd>
            </div>
            <div className="row">
              <dt>Streaks that are fair</dt>
              <dd>Today counts as still in progress. Your streak does not reset at 9 a.m. just because you have not pushed yet, and the widget tells you when it is at risk.</dd>
            </div>
            <div className="row">
              <dt>You pick what shows</dt>
              <dd>Header, stats, streak, contribution graph, languages, pinned or most-starred projects, recent activity. Turn each on or off and choose a wide or compact layout.</dd>
            </div>
            <div className="row">
              <dt>Matches your site</dt>
              <dd>Ten themes, adjustable corner radius, a transparent background, and a custom accent color on Pro. It stays readable on light and dark pages.</dd>
            </div>
            <div className="row">
              <dt>Private by design</dt>
              <dd>Only public GitHub data is read. Visitor analytics use a hash that changes every day, with no cookies and nothing personal stored.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="wrap">
          <h2>Free to start. $3 a month to make it yours.</h2>
          <p className="sub">Pro adds themes, analytics and your own domain. Cancel any time and the widget keeps working on the free plan.</p>
          <Pricing />
        </div>
      </section>

      <section className="section">
        <div className="wrap faq">
          <h2>Questions</h2>
          <details>
            <summary>Does it need access to my GitHub account?</summary>
            <p>No. You only type your username. The widget reads public information, so there is nothing to authorize and nothing private is ever shown.</p>
          </details>
          <details>
            <summary>Will private repository contributions show up?</summary>
            <p>Your contribution graph counts private activity only if you turn on private contributions in your GitHub profile settings. Private repositories are never listed.</p>
          </details>
          <details>
            <summary>How often does it update?</summary>
            <p>Every 15 minutes at most. Results are cached so your page loads fast and GitHub rate limits are never an issue.</p>
          </details>
          <details>
            <summary>What happens if I cancel Pro?</summary>
            <p>The widget falls back to the free look: a free theme and the GitPulse badge. Nothing breaks and your snippet keeps working.</p>
          </details>
          <details>
            <summary>Is my license key safe to put in my site's HTML?</summary>
            <p>The key is visible to anyone who views your page source, so each key only works for up to 3 GitHub usernames. Share it with nobody and it stays yours.</p>
          </details>
        </div>
      </section>
    </main>
  );
}

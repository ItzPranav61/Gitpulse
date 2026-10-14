import type { CSSProperties } from "react";
import { ErrorCard, Widget } from "@/components/Widget";
import { GitHubError, USERNAME_RE, getActivity } from "@/lib/github";
import { verifyKey } from "@/lib/license";
import { enforcePlan, parseOptions } from "@/lib/options";
import { resolveTheme } from "@/lib/themes";
import EmbedClient from "./EmbedClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WidgetPage({ params, searchParams }: Props) {
  const { username } = await params;
  const requested = parseOptions(await searchParams);

  const pro = requested.key ? verifyKey(requested.key, username).valid : false;
  const opts = enforcePlan(requested, pro);
  const theme = resolveTheme(opts.theme, opts.accent);

  let body: React.ReactNode;
  let ok = false;
  if (!USERNAME_RE.test(username)) {
    body = <ErrorCard title="Invalid username" message="GitHub usernames use letters, numbers and single hyphens." />;
  } else {
    try {
      const data = await getActivity(username);
      body = <Widget data={data} opts={opts} pro={pro} />;
      ok = true;
    } catch (err) {
      const status = err instanceof GitHubError ? err.status : 500;
      body = (
        <ErrorCard
          title={status === 404 ? "GitHub user not found" : "Can't reach GitHub right now"}
          message={
            status === 404
              ? `There is no GitHub account named "${username}". Check the spelling in your embed snippet.`
              : "The widget will retry on the next page load."
          }
        />
      );
    }
  }

  return (
    <div className="gp-stage" style={{ "--gp-page": theme.page } as CSSProperties}>
      {body}
      <EmbedClient username={username} track={ok} />
    </div>
  );
}

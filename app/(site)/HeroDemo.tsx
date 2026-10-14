"use client";

import { useState } from "react";
import { Widget } from "@/components/Widget";
import { DEFAULT_OPTIONS } from "@/lib/options";
import { THEMES, resolveTheme } from "@/lib/themes";
import type { ActivityData } from "@/lib/types";

const SHOWN = ["midnight", "paper", "terminal", "dracula", "sunset", "nord"];

export default function HeroDemo({ data }: { data: ActivityData }) {
  const [theme, setTheme] = useState("dracula");
  const t = resolveTheme(theme);

  return (
    <div>
      <div className="stage" style={{ background: t.page }}>
        <Widget
          data={data}
          opts={{ ...DEFAULT_OPTIONS, theme, sections: ["header", "stats", "streak", "heatmap", "repos"], repoCount: 2 }}
          pro
        />
      </div>
      <div className="chips" role="group" aria-label="Preview theme">
        {THEMES.filter((x) => SHOWN.includes(x.id)).map((x) => (
          <button key={x.id} className="chip" aria-pressed={theme === x.id} onClick={() => setTheme(x.id)}>
            <span className="chip-dots" aria-hidden>
              <i style={{ background: x.bg }} />
              <i style={{ background: x.accent }} />
              <i style={{ background: x.heat[3] }} />
            </span>
            {x.name}
            {x.pro && <span className="pro-tag">Pro</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

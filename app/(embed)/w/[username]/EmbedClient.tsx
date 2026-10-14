"use client";

import { useEffect } from "react";

let tracked = false; // module level so React strict mode does not double count

export default function EmbedClient({ username, track }: { username: string; track: boolean }) {
  useEffect(() => {
    const inFrame = window.self !== window.top;
    document.documentElement.dataset.standalone = inFrame ? "0" : "1";
    const id = new URLSearchParams(location.search).get("id") ?? "";

    const postHeight = () => {
      if (!inFrame) return;
      window.parent.postMessage({ type: "gitpulse:height", id, height: document.body.scrollHeight }, "*");
    };
    const ro = new ResizeObserver(postHeight);
    ro.observe(document.body);
    postHeight();

    if (track && !tracked) {
      tracked = true;
      try {
        const body = JSON.stringify({ u: username, ref: document.referrer });
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      } catch {
        /* analytics must never break the widget */
      }
    }
    return () => ro.disconnect();
  }, [username, track]);

  return null;
}

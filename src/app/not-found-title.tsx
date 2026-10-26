"use client";

import * as React from "react";

import { documentTitleForPath } from "@/lib/router";

/** V7/M1: the reference 404s title the tab with the route's slug-cased
 *  name ("/foo-bar-baz" → "Foo Bar Baz | VeloxPOS" — live-measured). Next's
 *  client metadata manager re-applies the root layout's title once shortly
 *  after mount (probed: between the 0-50ms marks), so a bare effect write
 *  is overwritten before paint. The guarded observer wins the LAST write:
 *  it only rewrites when the title actually differs (no mutation loop), and
 *  it disconnects on unmount so client-side navigation away titles
 *  normally. */
export function NotFoundTitle() {
  React.useEffect(() => {
    const apply = () => {
      const desired = documentTitleForPath(window.location.pathname);
      if (document.title !== desired) document.title = desired;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

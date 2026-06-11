import { NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function noStorePostAuthRedirect(url: URL) {
  const href = url.toString();
  const safeHref = escapeHtml(href);
  const response = new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${safeHref}"><title>Opening Grapply</title></head><body><script>window.location.replace(${JSON.stringify(href)});</script><a href="${safeHref}">Continue</a></body></html>`,
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );

  return response;
}

/** Public app URL for QR links and shareable assets. */
export function getAppUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://bjj-lemon.vercel.app";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

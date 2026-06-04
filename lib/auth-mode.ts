export function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

export function isMockAuthFallbackAllowed() {
  return !isProductionRuntime();
}

export function isAutomaticDemoLoginEnabled() {
  return isMockAuthFallbackAllowed() && process.env.GRAPPLY_DEMO_AUTO_LOGIN === "true";
}

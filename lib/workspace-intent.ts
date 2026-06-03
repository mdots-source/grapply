const routeLabels: Record<string, string> = {
  "/admin": "Team",
  "/competitions": "Competitions",
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/rankings": "Rankings",
  "/schedule": "Schedule",
  "/settings": "Settings",
  "/training-camps": "Training Camps",
  "/training-feed": "Training Feed",
  "/tv": "TV Screen",
};

const fallbackWorkspacePath = "/schedule";
const blockedWorkspacePaths = new Set(["/", "/login", "/register", "/clubs"]);

export function normalizeWorkspaceReturnTo(returnTo?: string | null): string {
  if (!returnTo?.startsWith("/")) return fallbackWorkspacePath;

  try {
    const destination = new URL(returnTo, "https://grapply.local");

    if (destination.pathname === "/clubs") {
      return normalizeWorkspaceReturnTo(destination.searchParams.get("returnTo"));
    }

    if (destination.pathname.startsWith("/api") || blockedWorkspacePaths.has(destination.pathname)) {
      return fallbackWorkspacePath;
    }

    if (!routeLabels[destination.pathname] && !destination.pathname.startsWith("/members/")) {
      return fallbackWorkspacePath;
    }

    return `${destination.pathname}${destination.search}`;
  } catch {
    return fallbackWorkspacePath;
  }
}

export function getWorkspaceIntentLabel(returnTo: string) {
  const normalizedReturnTo = normalizeWorkspaceReturnTo(returnTo);
  const [pathname, query = ""] = normalizedReturnTo.split("?");
  const params = new URLSearchParams(query);

  if (pathname === "/members" && params.get("add") === "1") return "add a member";
  if (pathname === "/members" && params.get("filter") === "promotion") return "review promotions";
  if (pathname === "/schedule" && params.get("create") === "class") return "create a class";
  if (pathname === "/training-feed" && params.get("create") === "post") return "publish a training post";

  return routeLabels[pathname] ? `open ${routeLabels[pathname]}` : "open your workspace";
}

export function getWorkspaceDestinationLabel(returnTo: string) {
  const [pathname] = normalizeWorkspaceReturnTo(returnTo).split("?");
  return routeLabels[pathname] ?? "this workspace area";
}

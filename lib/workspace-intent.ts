const routeLabels: Record<string, string> = {
  "/account": "Account",
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
const workspacePaths = new Set(Object.keys(routeLabels));
const blockedWorkspacePaths = new Set(["/", "/login", "/register", "/clubs"]);
const ownerOnlyPaths = new Set(["/admin", "/settings"]);
const staffOnlyPaths = new Set(["/tv"]);

export function splitOrganizationWorkspacePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [, ...rest] = segments;
  const workspacePath = normalizeLegacyWorkspacePath(`/${rest.join("/")}`);
  const basePath = normalizeLegacyWorkspacePath(`/${rest[0] ?? ""}`);

  if (workspacePaths.has(basePath) || basePath === "/members") {
    return {
      organizationId: segments[0],
      workspacePath,
      basePath,
    };
  }

  return null;
}

function getWorkspacePathname(pathname: string) {
  return splitOrganizationWorkspacePath(pathname)?.workspacePath ?? normalizeLegacyWorkspacePath(pathname);
}

function normalizeLegacyWorkspacePath(pathname: string) {
  if (pathname === "/students") return "/members";
  if (pathname.startsWith("/students/")) return `/members/${pathname.slice("/students/".length)}`;
  return pathname;
}

export function scopeWorkspaceReturnTo(returnTo: string, organizationId: string) {
  const normalizedReturnTo = normalizeWorkspaceReturnTo(returnTo);
  const [pathname, query = ""] = normalizedReturnTo.split("?");
  const workspacePath = getWorkspacePathname(pathname);
  return `/${organizationId}${workspacePath}${query ? `?${query}` : ""}`;
}

export function normalizeWorkspaceReturnTo(returnTo?: string | null): string {
  if (!returnTo?.startsWith("/")) return fallbackWorkspacePath;

  try {
    const destination = new URL(returnTo, "https://grapply.local");

    if (destination.pathname === "/clubs") {
      return normalizeWorkspaceReturnTo(destination.searchParams.get("returnTo"));
    }

    const workspacePathname = getWorkspacePathname(destination.pathname);

    if (workspacePathname.startsWith("/api") || blockedWorkspacePaths.has(workspacePathname)) {
      return fallbackWorkspacePath;
    }

    if (!routeLabels[workspacePathname] && !workspacePathname.startsWith("/members/")) {
      return fallbackWorkspacePath;
    }

    return `${workspacePathname}${destination.search}`;
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

export function getRoleSafeWorkspaceReturnTo(returnTo: string, role?: string | null) {
  const normalizedReturnTo = normalizeWorkspaceReturnTo(returnTo);
  const [pathname] = normalizedReturnTo.split("?");

  if (!role || role === "owner" || role === "admin") return normalizedReturnTo;
  if (role === "coach") return ownerOnlyPaths.has(pathname) ? fallbackWorkspacePath : normalizedReturnTo;
  if (pathname.startsWith("/members/")) return normalizedReturnTo;

  return ownerOnlyPaths.has(pathname) || staffOnlyPaths.has(pathname) ? fallbackWorkspacePath : normalizedReturnTo;
}

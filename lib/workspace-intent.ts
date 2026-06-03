const routeLabels: Record<string, string> = {
  "/admin": "Team",
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/schedule": "Schedule",
  "/settings": "Settings",
  "/training-feed": "Training Feed",
};

export function getWorkspaceIntentLabel(returnTo: string) {
  const [pathname, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);

  if (pathname === "/members" && params.get("add") === "1") return "add a member";
  if (pathname === "/members" && params.get("filter") === "promotion") return "review promotions";
  if (pathname === "/schedule" && params.get("create") === "class") return "create a class";
  if (pathname === "/training-feed" && params.get("create") === "post") return "publish a training post";

  return routeLabels[pathname] ? `open ${routeLabels[pathname]}` : "open your workspace";
}

export function getWorkspaceDestinationLabel(returnTo: string) {
  const [pathname] = returnTo.split("?");
  return routeLabels[pathname] ?? "this workspace area";
}

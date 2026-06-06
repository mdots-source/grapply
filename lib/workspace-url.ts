export function getWorkspaceHref(path: string, organizationId?: string | null) {
  if (!organizationId) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const organizationPrefix = `/${organizationId}`;
  if (normalizedPath === organizationPrefix || normalizedPath.startsWith(`${organizationPrefix}/`)) return normalizedPath;
  return `/${organizationId}${normalizedPath}`;
}

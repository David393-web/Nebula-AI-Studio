export const ADMIN_DASHBOARD_PATH = "/admin";
export const USER_DASHBOARD_PATH = "/dashboard";

export function resolveLoginDestination(user, requestedPath) {
  if (user?.role === "ADMIN") return ADMIN_DASHBOARD_PATH;
  if (requestedPath && requestedPath !== ADMIN_DASHBOARD_PATH) return requestedPath;
  return USER_DASHBOARD_PATH;
}

export function resolveAuthenticatedDestination(user) {
  return user?.role === "ADMIN" ? ADMIN_DASHBOARD_PATH : USER_DASHBOARD_PATH;
}

export function canAccessAdminDashboard(user) {
  return user?.role === "ADMIN";
}

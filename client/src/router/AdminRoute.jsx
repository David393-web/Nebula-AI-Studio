import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/authStore";
import { canAccessAdminDashboard } from "@/router/authRouting";

export default function AdminRoute() {
  const user = useAuthStore((state) => state.user);
  if (canAccessAdminDashboard(user)) return <Outlet />;
  return <Navigate to="/dashboard" replace />;
}

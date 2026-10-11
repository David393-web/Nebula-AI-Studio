import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/authStore";
import { resolveAuthenticatedDestination } from "@/router/authRouting";

export default function GuestRoute() {
  const { status, user } = useAuthStore();
  if (status === "loading") return <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-400">Loading…</div>;
  if (status === "authenticated") return <Navigate to={resolveAuthenticatedDestination(user)} replace />;
  return <Outlet />;
}

import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/authStore";

export default function ProtectedRoute() {
  const { status, hydrate } = useAuthStore();
  const location = useLocation();
  useEffect(() => { if (status === "loading") hydrate(); }, [status, hydrate]);
  if (status === "loading") return <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-400">Loading your workspace…</div>;
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

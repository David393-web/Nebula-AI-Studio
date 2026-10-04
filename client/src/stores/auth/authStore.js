import { create } from "zustand";
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from "@/services/auth";

let hydrationPromise = null;

export const useAuthStore = create((set) => ({
  user: null,
  status: "loading",
  error: null,
  hydrate: async () => {
    if (hydrationPromise) return hydrationPromise;
    set({ status: "loading", error: null });
    hydrationPromise = (async () => {
      try {
        const user = await getCurrentUser();
        set({ user, status: user ? "authenticated" : "anonymous" });
        return user;
      } catch {
        set({ user: null, status: "anonymous" });
        return null;
      } finally { hydrationPromise = null; }
    })();
    return hydrationPromise;
  },
  login: async (credentials) => {
    const data = await loginRequest(credentials);
    set({ user: data?.user ?? null, status: "authenticated", error: null });
    return data?.user ?? null;
  },
  register: async (details) => {
    const data = await registerRequest(details);
    set({ user: data?.user ?? null, status: "authenticated", error: null });
    return data?.user ?? null;
  },
  logout: async () => {
    await logoutRequest();
    set({ user: null, status: "anonymous", error: null });
  },
  setUser: (user) => set({ user }),
}));

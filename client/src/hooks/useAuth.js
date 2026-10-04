import { useAuthStore } from "@/stores/auth/authStore";

export default function useAuth() {
  return useAuthStore();
}

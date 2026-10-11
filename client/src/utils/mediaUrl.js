import api from "@/services/api";

export function resolveMediaUrl(value) {
  if (!value || typeof value !== "string" || value.startsWith("data:")) return value || null;
  try {
    const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
    return new URL(value, apiOrigin).toString();
  } catch {
    return value;
  }
}

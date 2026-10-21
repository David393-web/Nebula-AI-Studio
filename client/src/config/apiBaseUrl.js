export function resolveApiBaseUrl({ mode, apiUrl } = {}) {
  const configuredUrl = typeof apiUrl === "string" ? apiUrl.trim() : "";

  if (!configuredUrl && mode === "production") {
    throw new Error(
      "VITE_API_URL is required for production builds. Set it to the deployed API base URL, for example https://api.example.com/api.",
    );
  }

  if (!configuredUrl && mode !== "production") return "";

  let parsed;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error("VITE_API_URL must be an absolute HTTP(S) URL ending in /api.");
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !parsed.pathname.replace(/\/$/, "").endsWith("/api")
  ) {
    throw new Error("VITE_API_URL must be an absolute HTTP(S) URL ending in /api.");
  }

  if (mode === "production") {
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    if (parsed.protocol !== "https:" || localHosts.has(parsed.hostname)) {
      throw new Error("VITE_API_URL must use HTTPS and cannot point to localhost in production.");
    }
  }

  return configuredUrl.replace(/\/$/, "");
}

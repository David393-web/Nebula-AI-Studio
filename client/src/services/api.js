import { resolveApiBaseUrl } from "@/config/apiBaseUrl";
import { createApiClient } from "@/config/createApiClient";

const api = createApiClient(
  import.meta.env.DEV && !import.meta.env.VITE_API_URL
    ? "http://localhost:5000/api"
    : resolveApiBaseUrl({
        mode: import.meta.env.MODE,
        apiUrl: import.meta.env.VITE_API_URL,
      }),
);

// Authentication uses the HttpOnly nebula_token cookie set by the API.
// Remove tokens left by older client versions: a stale Bearer header takes
// precedence over the valid cookie on the server and causes every request to
// fail with 401.
if (typeof window !== "undefined") {
  ["token", "accessToken", "authToken"].forEach((key) =>
    window.localStorage.removeItem(key),
  );
}

export default api;

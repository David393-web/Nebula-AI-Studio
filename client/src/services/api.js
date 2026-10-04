import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

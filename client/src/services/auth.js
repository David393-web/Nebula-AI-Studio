import api from "./api";

// LOGIN
export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);

  return response.data?.data;
}

// REGISTER
export async function register(userData) {
  const response = await api.post("/auth/register", userData);

  return response.data?.data;
}

// GET CURRENT USER
export async function getCurrentUser() {
  const response = await api.get("/auth/me");

  return response.data?.data?.user || null;
}

// LOGOUT
export function logout() {
  return api.post("/auth/logout");
}

import api from "./api";

// LOGIN
export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);

  const data = response.data?.data;

  if (data?.token) {
    localStorage.setItem("token", data.token);
  }

  if (data?.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
  }

  return data;
}

// REGISTER
export async function register(userData) {
  const response = await api.post("/auth/register", userData);

  const data = response.data?.data;

  if (data?.token) {
    localStorage.setItem("token", data.token);
  }

  if (data?.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
  }

  return data;
}

// GET CURRENT USER
export async function getCurrentUser() {
  const response = await api.get("/auth/me");

  return response.data?.data?.user || null;
}

// LOGOUT
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
}
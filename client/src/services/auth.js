import api from "./api";
import { makeResetPasswordPayload } from "@/pages/ResetPassword/resetLink";

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

export async function verifyEmail(payload) {
  const response = await api.post("/auth/verify-email", payload);
  return response.data;
}

export async function resendVerification(email) {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
}

export async function requestPasswordReset(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(payload) {
  const response = await api.post("/auth/reset-password", makeResetPasswordPayload(payload.token, payload.newPassword));
  return response.data;
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

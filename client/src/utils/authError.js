export function getLoginErrorMessage(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) return "Incorrect email or password.";
  if (status === 429) return serverMessage || "Too many sign-in attempts. Please wait and try again.";
  if (status >= 500) return serverMessage || "The sign-in service is temporarily unavailable. Please try again.";
  if (status) return serverMessage || "Unable to complete sign-in. Please try again.";
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") return "The sign-in request timed out. Please try again.";
  return "Unable to reach the sign-in service. Check your connection and try again.";
}

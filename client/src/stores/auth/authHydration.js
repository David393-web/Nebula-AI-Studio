export function resolveHydrationFailure(error) {
  if (error?.response?.status === 401) {
    return { user: null, status: "anonymous" };
  }

  return { user: null, status: "unavailable" };
}

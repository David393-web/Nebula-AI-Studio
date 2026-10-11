export function extractResetToken(location) {
  const queryToken = new URLSearchParams(location.search || "").get("token");
  if (queryToken) return queryToken;
  // Accept already-issued links while the 30-minute tokens remain valid.
  return new URLSearchParams((location.hash || "").replace(/^#/, "")).get("token") || "";
}

export function makeResetPasswordPayload(token, newPassword) {
  return { token, newPassword };
}

export function resetUrlWithoutToken(location) {
  const cleaned = new URL(location.href);
  cleaned.searchParams.delete("token");
  if (new URLSearchParams(cleaned.hash.replace(/^#/, "")).has("token")) cleaned.hash = "";
  return `${cleaned.pathname}${cleaned.search}${cleaned.hash}`;
}

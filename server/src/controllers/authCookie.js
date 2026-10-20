function getAuthCookieOptions(environment = process.env.NODE_ENV) {
  const production = environment === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function getAuthCookieClearOptions(environment = process.env.NODE_ENV) {
  const { maxAge, ...options } = getAuthCookieOptions(environment);
  return options;
}

module.exports = { getAuthCookieOptions, getAuthCookieClearOptions };

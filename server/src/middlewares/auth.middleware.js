const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Read Bearer token from Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. Fallback to authentication cookie
    if (!token) {
      token = req.cookies?.nebula_token;
    }

    // 3. No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 4. Make sure JWT secret exists
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // 5. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    // 6. Get user ID
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user could not be identified.",
      });
    }

    // 7. Attach authenticated user to request
    req.user = {
      ...decoded,
      id: userId,
      userId,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

module.exports = {
  authenticate,
};

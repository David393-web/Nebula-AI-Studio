const authService = require("../services/Auth/auth.service");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
      });

      res.cookie("nebula_token", result.token, cookieOptions);

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({
        email,
        password,
      });

      res.cookie("nebula_token", result.token, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie("nebula_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
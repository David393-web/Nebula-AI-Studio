const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userRepository = require("../../repositories/UserRepository");
const emailVerification = require("../Email/emailVerification.service");

class AuthService {
  constructor({ repository = userRepository, verification = emailVerification } = {}) {
    this.userRepository = repository;
    this.emailVerification = verification;
  }

  async register({ email, password, name }) {
    email = String(email || "").trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      if (existingUser.emailVerifiedAt == null && await bcrypt.compare(password, existingUser.passwordHash)) {
        let delivery = { sent: false };
        try { delivery = await this.emailVerification.issue(existingUser); } catch (error) {
          console.error("Registration verification request failed", { code: error?.providerCode || error?.code || "EMAIL_VERIFICATION_FAILURE" });
        }
        return { user: this.sanitizeUser(existingUser), created: false, verificationSent: delivery.sent };
      }
      return { user: null, created: false, verificationSent: false };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await this.userRepository.createUser({
        email,
        passwordHash,
        name: typeof name === "string" ? name.trim() : name,
      });
    } catch (error) {
      if (error?.code === "P2002") {
        // A concurrent registration may have won the unique-email race. Keep the
        // response indistinguishable from other registration outcomes.
        return { user: null, created: false, verificationSent: false };
      }
      throw error;
    }

    let delivery = { sent: false };
    try { delivery = await this.emailVerification.issue(user); } catch (error) {
      console.error("Registration verification request failed", { code: error?.providerCode || error?.code || "EMAIL_VERIFICATION_FAILURE" });
    }
    return { user: this.sanitizeUser(user), created: true, verificationSent: delivery.sent };
  }

  async login({ email, password }) {
    email = String(email || "").trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    if (user.emailVerifiedAt === null) {
      const error = new Error("Email verification is required before signing in.");
      error.status = 403;
      error.code = "EMAIL_NOT_VERIFIED";
      throw error;
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async resendVerification(email) {
    return this.emailVerification.resend(email);
  }

  async verifyEmail(email, code) {
    return this.emailVerification.verify(email, code);
  }

  async getUserById(id) {
    if (!id) {
      const error = new Error("User ID is required");
      error.status = 400;
      throw error;
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(id, { name }) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      const error = new Error("Name must be between 1 and 100 characters.");
      error.status = 400;
      throw error;
    }
    const user = await this.userRepository.updateUser(id, { name: name.trim() });
    return this.sanitizeUser(user);
  }

  async completeOnboarding(id) {
    const user = await this.userRepository.updateUser(id, { onboardingCompleted: true });
    return this.sanitizeUser(user);
  }

  async changePassword(id, { currentPassword, newPassword }) {
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      const error = new Error("New password must contain at least 6 characters.");
      error.status = 400;
      throw error;
    }
    const user = await this.userRepository.findById(id);
    if (!user || !(await bcrypt.compare(currentPassword || "", user.passwordHash))) {
      const error = new Error("Current password is incorrect.");
      error.status = 400;
      throw error;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updateUser(id, { passwordHash });
  }

  generateToken(user) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    if (!user?.id) {
      throw new Error("Cannot generate authentication token without a user ID");
    }

    return jwt.sign(
      {
        id: user.id,
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        algorithm: "HS256",
      }
    );
  }

  sanitizeUser(user) {
    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}

const authService = new AuthService();
module.exports = authService;
module.exports.AuthService = AuthService;

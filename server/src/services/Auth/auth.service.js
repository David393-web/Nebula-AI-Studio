const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userRepository = require("../../repositories/UserRepository");

class AuthService {
  async register({ email, password, name }) {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      const error = new Error("Email is already registered");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userRepository.createUser({
      email,
      passwordHash,
      name,
    });

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);

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

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return this.sanitizeUser(user);
  }

  generateToken(user) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
  }

  sanitizeUser(user) {
    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}

module.exports = new AuthService();
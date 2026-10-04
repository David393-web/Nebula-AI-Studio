const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/projects.routes");
const assetRoutes = require("./routes/assets.routes");
const characterRoutes = require("./routes/characters.routes");
const imageRoutes = require("./routes/image.routes");
const galleryRoutes = require("./routes/gallery.routes");
const storageRoutes = require("./routes/storage.routes");
const settingsRoutes = require("./routes/settings.routes");
const videoRoutes = require("./routes/videos.routes");
const storyboardRoutes = require("./routes/storyboards.routes");
const generationRoutes = require("./routes/generation.routes");
const videoGenerationRoutes = require("./routes/videoGeneration.routes");
const creditsRoutes = require("./routes/credits.routes");
const billingRoutes = require("./routes/billing.routes");

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);

// Request logging
app.use(morgan("dev"));

// Request parsing
app.use(express.json({ limit: "10mb", verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Static uploaded files
app.use("/uploads", (req, res, next) => {
  // The UI (5173) and API (5000) are separate origins during local development.
  // Allow browser media elements to read the public generated assets.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  acceptRanges: true,
  setHeaders(res, filePath) {
    if (/\.mp4$/i.test(filePath)) res.setHeader("Content-Type", "video/mp4");
  },
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/storyboards", storyboardRoutes);
app.use("/api/generation", generationRoutes);
app.use("/api/generation", videoGenerationRoutes);
app.use("/api/credits", creditsRoutes);
app.use("/api/billing", billingRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "Nebula AI API",
    version: "1.0.0",
    status: "running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const databaseUnavailable =
    ["P1001", "P1002", "P1017", "XX000", "ENOTFOUND"].includes(err?.code) ||
    ["PrismaClientInitializationError", "PrismaClientKnownRequestError"].includes(err?.name);
  console.error("Request failed", {
    method: req.method,
    path: req.path,
    status: databaseUnavailable ? 503 : status,
    code: err?.code || "INTERNAL_ERROR",
    name: err?.name || "Error",
  });

  res.status(databaseUnavailable ? 503 : status).json({
    success: false,
    message: databaseUnavailable
      ? "Database is temporarily unavailable. Please try again later."
      : status >= 500
        ? "Something went wrong. Please try again later."
        : err.message || "Request failed.",
  });
});

module.exports = app;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/projects.routes");
const assetRoutes = require("./routes/assets.routes");
const characterRoutes = require("./routes/characters.routes");
const imageRoutes = require("./routes/image.routes");
const galleryRoutes = require("./routes/gallery.routes");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Request logging
app.use(morgan("dev"));

// Request parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/gallery", galleryRoutes);

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
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
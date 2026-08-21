require("dotenv/config");

const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║          NEBULA AI SERVER            ║
╠══════════════════════════════════════╣
║ Status:      Running                 ║
║ Port:        ${PORT}                    ║
║ Environment: ${process.env.NODE_ENV || "development"}       ║
╚══════════════════════════════════════╝
  `);
});

process.on("SIGINT", async () => {
  console.log("\nShutting down Nebula AI server...");

  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down Nebula AI server...");

  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env") });

const app = require("./app");
const { startHttpServer } = require("./serverRuntime");

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

if (!process.env.SENDLIB_API_KEY || !process.env.SENDLIB_FROM_EMAIL) {
  console.warn("Sendlib email features are unavailable until SENDLIB_API_KEY and SENDLIB_FROM_EMAIL are configured.");
}

const server = startHttpServer(app, {
  port: PORT,
  host: HOST,
  onListening: () => {
    console.log(`
╔══════════════════════════════════════╗
║          NEBULA AI SERVER            ║
╠══════════════════════════════════════╣
║ Status:      Running                 ║
║ Port:        ${PORT}                    ║
║ Host:        ${HOST}             ║
║ Environment: ${process.env.NODE_ENV || "development"}       ║
╚══════════════════════════════════════╝
  `);
  },
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

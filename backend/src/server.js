require("dotenv").config();

const app = require("./app");
const prisma = require("./lib/prisma");
const { assertEnv, port } = require("./config/env");

assertEnv();

const server = app.listen(port, () => {
  console.log(`Maqaam backend running on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down…`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Error during shutdown:", error);
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

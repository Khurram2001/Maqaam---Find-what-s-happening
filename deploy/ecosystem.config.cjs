/**
 * PM2 process file for single-EC2 deployment.
 * Run from repo root: pm2 start deploy/ecosystem.config.cjs
 */
const path = require("path");

const root = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "maqaam-api",
      cwd: path.join(root, "backend"),
      script: "src/server.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "5000",
      },
    },
    {
      name: "maqaam-user",
      cwd: path.join(root, "frontend-user"),
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "maqaam-admin",
      cwd: path.join(root, "frontend-admin"),
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};

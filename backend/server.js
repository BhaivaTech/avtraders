// server.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/* ---- load .env BEFORE other imports ---- */
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve .env from the server file's directory first, then fall back to
// process.cwd() so nodemon / node started from a parent folder still works.
// `override: true` makes .env always win over any empty shell export
// (a common cause of "Missing DB_HOST" when a parent shell exports "").
const envCandidates = [
  path.resolve(__dirname, ".env"),
  path.resolve(process.cwd(), ".env"),
];
const envPath = envCandidates.find((p) => fs.existsSync(p));
if (!envPath) {
  // eslint-disable-next-line no-console
  console.error(
    `[startup] ⛔  No .env file found. Looked in:\n  ${envCandidates.join("\n  ")}\n` +
    `Run from the backend/ folder, or copy .env.example to .env.`
  );
  process.exit(1);
}
const dotenvResult = dotenv.config({ path: envPath, override: true });
if (dotenvResult.error) {
  // eslint-disable-next-line no-console
  console.error(`[startup] ⛔  Failed to read ${envPath}:`, dotenvResult.error.message);
  process.exit(1);
}
const loadedKeys = dotenvResult.parsed ? Object.keys(dotenvResult.parsed).length : 0;
// eslint-disable-next-line no-console
console.log(`[startup] ✅ Loaded ${loadedKeys} env vars from ${envPath}`);

/* ---- validate critical env vars immediately after loading .env ---- */
await import("./src/config/env.js");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import compression from "compression";
import session from "express-session";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const MySQLStore = require("express-mysql-session")(session);
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

/* ---- Structured logging (Pino) ---- */
import logger from "./src/utils/logger.js";

/* ---- CSRF protection ---- */
import { csrfCookieSetter, csrfProtect, csrfTokenEndpoint } from "./src/middlewares/csrf.js";
import { apiLimiter } from "./src/middlewares/rateLimiter.js";

/* ---- Sentry (optional) ---- */
import { captureException } from "./src/utils/sentry.js";

/* ---- Migrations ---- */
import { runMigrations } from "./src/utils/migrations.js";

import paymentRouter from "./src/routes/payment.js";
import phonepeRouter from "./src/routes/phonepe.js";
import announcementRoutes from "./src/routes/announcements.js";

const app = express();
const prod = (process.env.NODE_ENV || "").trim() === "production";

/* ✅ Backend port */
const PORT = Number(process.env.PORT || 5100);

/* ✅ IMPORTANT: Do NOT bind to "localhost" (can become IPv6 ::1 and break Vite proxy)
   Bind to 127.0.0.1 for local dev, 0.0.0.0 for production if needed.
*/
let HOST = (process.env.HOST || "").trim();
if (!HOST) HOST = prod ? "0.0.0.0" : "127.0.0.1";
if (HOST === "localhost") HOST = "127.0.0.1";

/* ------------ CORS ------------ */
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5100",
  "http://127.0.0.1:5100",
  "https://avtradersagriclinic.com",
  "https://www.avtradersagriclinic.com",
];

const EXPLICIT = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsCheck = (origin, cb) => {
  if (!origin) return cb(null, true);
  cb(null, EXPLICIT.includes(origin));
};

app.use(
  cors({
    origin: corsCheck,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);
app.options("*", cors({ origin: corsCheck, credentials: true }));

/* ---------- Security ---------- */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: prod ? { maxAge: 31536000, includeSubDomains: true, preload: true } : undefined,
}));

/* ---------- Compression ---------- */
app.use(compression({
  threshold: 1024,           // Only compress responses > 1 KB
  level: 6,                  // zlib compression level (1-9)
  filter: (req, res) => {
    // Don't compress if the client doesn't want it
    if (req.headers['x-no-compression']) return false;
    // Use compression's default filter for everything else
    return compression.filter(req, res);
  },
}));

/* ---------- Cookie parser (needed for CSRF double-submit cookie) ---------- */
app.use(cookieParser());

/* ---------- Request Logging (Pino replaces Morgan) ---------- */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        ms: Date.now() - start,
        ip: req.ip,
      },
      "request"
    );
  });
  next();
});

/* ---------- Parsers ----------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ---------- CSRF Protection ---------- */
// Set CSRF cookie on all requests; enforce on state-changing routes
app.use(csrfCookieSetter);
// Expose CSRF token endpoint for the frontend to fetch
app.get("/api/csrf-token", csrfTokenEndpoint);

/* ---------- Sessions ---------- */
app.set("trust proxy", prod ? 2 : 0);
const DEFAULT_SESSION_MS = Number(process.env.SESSION_MAX_AGE_MS || 10 * 24 * 60 * 60 * 1000);

let store;
if (prod) {
  const sessionOptions = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    createDatabaseTable: true,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 20000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
  store = new MySQLStore(sessionOptions);
  store.on("error", (err) => logger.error({ err }, "[session-store] error"));
} else {
  store = new session.MemoryStore();
}

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  store,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? "none" : "lax",
    maxAge: DEFAULT_SESSION_MS,
  },
});

app.use(sessionMiddleware);

/* --------- Static uploads (public) -------- */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads"), {
    setHeaders: (res) => {
      const origin = res.req?.headers?.origin;
      if (origin && EXPLICIT.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

/* -------- Health (with DB ping) -------- */
app.get("/api/health", async (_req, res) => {
  try {
    const { pool } = await import("./src/config/db.js");
    await pool.query("SELECT 1");
    res.json({ ok: true, env: process.env.NODE_ENV || "development", db: true });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err?.message || "DB unreachable" });
  }
});

/* -------- Migration status endpoint (admin only) -------- */
app.get("/api/admin/migrations", async (req, res) => {
  if (!req.session?.admin) return res.status(401).json({ ok: false });
  try {
    const { migrationStatus } = await import("./src/utils/migrations.js");
    const status = await migrationStatus();
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* --------- Routes --------- */
const { default: adminRoutes } = await import("./src/routes/admin.js");
const { default: authRoutes } = await import("./src/routes/auth.js");
const chatMod = await import("./src/routes/chat.js");
const chatRoutes = chatMod.default;
const { attachChatSocket } = chatMod;
const { default: quotesRoutes } = await import("./src/routes/quotes.js");
const { default: farmersRoutes } = await import("./src/routes/farmers.js");

/* ✅ NEW: dealer routes */
const { default: dealerRoutes } = await import("./src/routes/dealer.js");

/* Import requireAdminIfAdminRole from shared middleware (no more duplicate) */
const { requireAdminIfAdminRole } = await import("./src/middlewares/auth.js");

/* ---------- Global rate limiting + CSRF protection on API routes ---------- */
app.use("/api", apiLimiter(), csrfProtect);

/* Mount API routes UNDER /api */
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", requireAdminIfAdminRole, chatRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/payment", paymentRouter);
app.use("/api/phonepe", phonepeRouter);
app.use("/api/announcements", announcementRoutes);
app.use("/api/farmers", farmersRoutes);

/* ✅ Dealer portal base: /api/dealer */
app.use("/api/dealer", dealerRoutes);

/* ✅ Products (public + admin CRUD) */
const { default: productsRoutes } = await import("./src/routes/products.js");
app.use("/api/products", productsRoutes);


/* -------- HTTP + Socket.IO -------- */
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: { origin: corsCheck, methods: ["GET", "POST"], credentials: true },
  pingInterval: 25000,
  pingTimeout: 60000,
});

attachChatSocket(io);

/* ---- Periodic OTP cleanup (every 15 min) ---- */
async function cleanupExpiredOtps() {
  try {
    const { pool } = await import("./src/config/db.js");
    const [farmer] = await pool.query('DELETE FROM farmer_otps WHERE expires_at < NOW()');
    const [admin] = await pool.query('DELETE FROM admin_otps WHERE expires_at < NOW()');
    const [dealer] = await pool.query('DELETE FROM dealer_otp_sessions WHERE expires_at < NOW()');
    const total = (farmer.affectedRows || 0) + (admin.affectedRows || 0) + (dealer.affectedRows || 0);
    if (total > 0) {
      logger.info({ farmer: farmer.affectedRows, admin: admin.affectedRows, dealer: dealer.affectedRows }, '[otp-cleanup] removed expired OTPs');
    }
  } catch (err) {
    logger.error({ err }, '[otp-cleanup] failed');
  }
}
const OTP_CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
const otpCleanupTimer = setInterval(cleanupExpiredOtps, OTP_CLEANUP_INTERVAL);
otpCleanupTimer.unref();
// Run once on startup after a short delay
setTimeout(cleanupExpiredOtps, 30_000).unref();

/* ---- WebSocket auth: share Express session, reject unauthenticated ---- */
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});
io.use((socket, next) => {
  const sess = socket.request.session;
  const isAdmin  = !!sess?.admin;
  const isFarmer = !!(sess?.farmer?.id || sess?.user?.id);
  if (!isAdmin && !isFarmer) {
    logger.warn({ ip: socket.handshake.address }, "[socket] rejected unauthenticated connection");
    return next(new Error('UNAUTHENTICATED'));
  }
  socket.isAdmin  = isAdmin;
  socket.isFarmer = isFarmer;
  next();
});

io.on('connection', () => {});

/* ---------- Global JSON error handler ---------- */
// Must be defined AFTER all routes. Catches any next(err) calls.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  logger.error({ status, err }, "unhandled error");

  // Report to Sentry in production
  if (prod) {
    captureException(err);
  }

  // Never leak internal error details to the client in production
  const message = prod && status === 500
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  res.status(status).json({ ok: false, message });
});

/* -------------- Boot -------------- */
logger.info({ origins: EXPLICIT }, "[CORS] allowed origins");

// Run database migrations before starting
try {
  await runMigrations();
} catch (err) {
  logger.error({ err }, "Migration failed");
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  logger.info({ host: HOST, port: PORT }, `Backend listening on http://${HOST}:${PORT}`);
});

/* ---------- Graceful shutdown ---------- */
async function gracefulShutdown(signal) {
  logger.info({ signal }, "Shutdown signal received — closing server...");

  // Stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed.");

    // Close database pool
    try {
      const { pool } = await import("./src/config/db.js");
      await pool.end();
      logger.info("Database pool closed.");
    } catch (err) {
      logger.error({ err }, "Error closing database pool");
    }

    // Clear OTP cleanup timer
    clearInterval(otpCleanupTimer);

    process.exit(0);
  });

  // Force exit after 10s if connections linger
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

/* ---------- Uncaught exception / unhandled rejection handlers ---------- */
process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'Uncaught exception — shutting down');
  if (prod) captureException(err, { origin: 'uncaughtException' });
  // Exit after logging (Node state is unreliable after uncaughtException)
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
  if (prod) captureException(reason instanceof Error ? reason : new Error(String(reason)), { origin: 'unhandledRejection' });
  // Don't exit — just log (Node.js will deprecate crashing on unhandledRejection)
});

export default app;

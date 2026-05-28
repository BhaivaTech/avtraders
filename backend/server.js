// server.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/* ---- load .env BEFORE other imports ---- */
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });
console.log("[env] loaded:", envPath, "exists:", fs.existsSync(envPath));

import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import session from "express-session";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const MySQLStore = require("express-mysql-session")(session);
import { Server } from "socket.io";

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
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors({ origin: corsCheck, credentials: true }));

/* ---------- Security ---------- */
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

/* ---------- Parsers ----------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ---------- Sessions ---------- */
app.set("trust proxy", prod ? 1 : 0);
const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;

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
  store.on("error", (err) => console.error("[session-store]", err?.message || err));
} else {
  store = new session.MemoryStore();
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: prod,
      sameSite: "lax",
      domain: prod ? process.env.COOKIE_DOMAIN || undefined : undefined,
      maxAge: TEN_DAYS,
    },
  })
);

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

/* -------- Health -------- */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || "development" })
);

/* --------- Routes --------- */
const { default: adminRoutes } = await import("./src/routes/admin.js");
const { default: authRoutes } = await import("./src/routes/auth.js");
const chatMod = await import("./src/routes/chat.js");
const chatRoutes = chatMod.default;
const { attachChatSocket } = chatMod;
const { default: quotesRoutes } = await import("./src/routes/quotes.js");
const { ensureTables } = await import("./src/utils/ensureTables.js");
const { default: farmersRoutes } = await import("./src/routes/farmers.js");

/* ✅ NEW: dealer routes */
const { default: dealerRoutes } = await import("./src/routes/dealer.js");

function requireAdminIfAdminRole(req, res, next) {
  const qRole = (req.query.role || "").toLowerCase();
  const bRole = (req.body?.role || req.body?.sender_role || "").toLowerCase();
  if (qRole === "admin" || bRole === "admin") {
    if (req.session && req.session.admin) return next();
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

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

/* -------- HTTP + Socket.IO -------- */
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: { origin: corsCheck, methods: ["GET", "POST"], credentials: true },
  pingInterval: 25000,
  pingTimeout: 60000,
});

attachChatSocket(io);
io.on("connection", () => {});

/* -------------- Boot -------------- */
console.log("[CORS] allowed:", EXPLICIT);

ensureTables()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Backend listening on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to ensure tables:", err);
    process.exit(1);
  });

export default app;
// backend/src/app.js
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import { ensureTables } from './utils/ensureTables.js';

import authRouter from './routes/auth.js';
import chatRouter, { attachChatSocket } from './routes/chat.js';
import dealerRouter from './routes/dealer.js';
import internalRouter from './routes/internal.js';
import paymentRouter from './routes/payment.js';
import quotesRouter from './routes/quotes.js';
import translateRouter from './routes/translate.js';
import adminRouter from './routes/admin.js';
import farmersRouter from "./routes/farmers.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import announcementRoutes from './routes/announcements.js';
const app = express();

/* ---------- CORS ---------- */
const defaultOrigins = [
  'http://localhost:5173',   // Vite dev
  'http://localhost:5100',   // same-origin dev
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);

/* ---------- Body parsers ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Session ---------- */
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

/* ---------- Static uploads (files & images) ---------- */
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
  })
);

/* ---------- API routes (ALL under /api/...) ---------- */
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/dealer', dealerRouter);
app.use('/api/internal', internalRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/translate', translateRouter);
app.use('/api/admin', adminRouter);
app.use("/api/farmers", farmersRouter);
/* ---------- Health check ---------- */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/* ---------- Start HTTP + Socket.IO server ---------- */
const PORT = Number(process.env.PORT) || 5100;

async function start() {
  try {
    await ensureTables();

    const server = http.createServer(app);

    const io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: origins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Attach Socket.IO to chat routes
    attachChatSocket(io);

    server.listen(PORT, () => {
      console.log(`✅ API + Socket.IO running on http://localhost:${PORT}`);
      console.log('   Allowed origins:', origins.join(', '));
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;

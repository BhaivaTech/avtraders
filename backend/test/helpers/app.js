// test/helpers/app.js
// Builds an Express app instance wired the same way as server.js
// but without the listening socket, Sentry, migrations runner, or
// graceful-shutdown handlers — so the test runner can mount it under
// supertest quickly and exit cleanly.
//
// How it works:
//   1. Vitest's module mocker replaces `../src/config/db.js` with our
//      in-memory pool BEFORE any controller / model imports it.
//   2. We require every other module normally; because all of them
//      pull `pool` from `config/db.js`, they transparently get the
//      mock pool.
//   3. Sessions use the default in-memory store (good for tests;
//      production code switches to MySQL store via the env flag).
//   4. The Socket.IO layer is skipped — REST only.

import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { csrfCookieSetter, csrfTokenEndpoint, csrfProtect } from '../../src/middlewares/csrf.js';

import adminRoutes from '../../src/routes/admin.js';
import authRoutes from '../../src/routes/auth.js';
import quotesRoutes from '../../src/routes/quotes.js';
import farmersRoutes from '../../src/routes/farmers.js';
import chatRoutes from '../../src/routes/chat.js';
import dealerRoutes from '../../src/routes/dealer.js';
import paymentRouter from '../../src/routes/payment.js';
import phonepeRouter from '../../src/routes/phonepe.js';
import announcementRoutes from '../../src/routes/announcements.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    hsts: false,
  })
);
app.use(compression({ threshold: 1024 }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(csrfCookieSetter);
app.get('/api/csrf-token', csrfTokenEndpoint);

// Use a deterministic, long secret so tests are reproducible.
// Note: tests don't run server.js, so config/env.js (which would
// require SESSION_SECRET) is never imported.
app.use(
  session({
    secret: 'test-session-secret-please-do-not-use-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60_000 },
  })
);

app.use('/api', csrfProtect);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/phonepe', phonepeRouter);
app.use('/api/announcements', announcementRoutes);
app.use('/api/farmers', farmersRoutes);
app.use('/api/dealer', dealerRoutes);

app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ ok: false, message: err.message || 'error' });
});

export default app;

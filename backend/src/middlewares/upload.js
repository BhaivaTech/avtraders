// src/middlewares/upload.js
// Centralised multer upload configurations.

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/* ------------------------------------------------------------------ */
/*  Chat / message media upload                                          */
/* ------------------------------------------------------------------ */

const mediaDir = path.join(process.cwd(), 'uploads', 'images');
fs.mkdirSync(mediaDir, { recursive: true });

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mediaDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || '');
    cb(null, `${ts}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const chatUpload = multer({ storage: chatStorage });

/* ------------------------------------------------------------------ */
/*  Quotation file upload                                                */
/* ------------------------------------------------------------------ */

const qdir = path.join(process.cwd(), 'uploads', 'quotes');
fs.mkdirSync(qdir, { recursive: true });

const quotesStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, qdir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || '');
    cb(null, `${ts}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const quotesUpload = multer({ storage: quotesStorage });

/* ------------------------------------------------------------------ */
/*  Dealer private document upload                                       */
/* ------------------------------------------------------------------ */

const PRIVATE_UPLOAD_ROOT =
  process.env.PRIVATE_UPLOAD_ROOT || path.join(process.cwd(), 'uploads_private');
const DOCS_DIR = path.join(PRIVATE_UPLOAD_ROOT, 'dealer_docs');
fs.mkdirSync(DOCS_DIR, { recursive: true });

const allowedDealerMime = new Set(['application/pdf', 'image/jpeg', 'image/png']);

const dealerDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${Date.now()}_${crypto.randomBytes(10).toString('hex')}${ext}`);
  },
});

export const dealerDocUpload = multer({
  storage: dealerDocStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!allowedDealerMime.has(file.mimetype)) {
      return cb(new Error('Only PDF, JPG and PNG files are allowed'));
    }
    cb(null, true);
  },
});

export { DOCS_DIR, PRIVATE_UPLOAD_ROOT };

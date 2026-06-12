// src/middlewares/upload.js
// Centralised multer upload configurations.

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/* ------------------------------------------------------------------ */
/*  MIME → safe extension map                                            */
/* ------------------------------------------------------------------ */

const CHAT_ALLOWED_MIME = new Map([
  ['image/jpeg',       '.jpg'],
  ['image/png',        '.png'],
  ['image/gif',        '.gif'],
  ['image/webp',       '.webp'],
  ['video/mp4',        '.mp4'],
  ['video/quicktime',  '.mov'],
  ['audio/mpeg',       '.mp3'],
  ['audio/ogg',        '.ogg'],
  ['audio/webm',       '.webm'],
  ['audio/wav',        '.wav'],
  ['application/pdf',  '.pdf'],
]);

const QUOTES_ALLOWED_MIME = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg',      '.jpg'],
  ['image/png',       '.png'],
  ['image/webp',      '.webp'],
]);

const DEALER_ALLOWED_MIME = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg',      '.jpg'],
  ['image/png',       '.png'],
]);

/* ------------------------------------------------------------------ */
/*  Secure filename helper — UUID + MIME-derived extension              */
/* ------------------------------------------------------------------ */
function secureFilename(mimeMap, file) {
  const ext = mimeMap.get(file.mimetype) || '';
  return `${crypto.randomUUID()}${ext}`;
}

/* ------------------------------------------------------------------ */
/*  Chat / message media upload                                          */
/* ------------------------------------------------------------------ */

const mediaDir = path.join(process.cwd(), 'uploads', 'images');
fs.mkdirSync(mediaDir, { recursive: true });

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mediaDir),
  filename: (_req, file, cb) => cb(null, secureFilename(CHAT_ALLOWED_MIME, file)),
});

export const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (!CHAT_ALLOWED_MIME.has(file.mimetype)) {
      return cb(Object.assign(new Error('File type not allowed'), { status: 400 }));
    }
    cb(null, true);
  },
});

/* ------------------------------------------------------------------ */
/*  Quotation file upload                                                */
/* ------------------------------------------------------------------ */

const qdir = path.join(process.cwd(), 'uploads', 'quotes');
fs.mkdirSync(qdir, { recursive: true });

const quotesStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, qdir),
  filename: (_req, file, cb) => cb(null, secureFilename(QUOTES_ALLOWED_MIME, file)),
});

export const quotesUpload = multer({
  storage: quotesStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (!QUOTES_ALLOWED_MIME.has(file.mimetype)) {
      return cb(Object.assign(new Error('Only PDF and image files are allowed'), { status: 400 }));
    }
    cb(null, true);
  },
});

/* ------------------------------------------------------------------ */
/*  Dealer private document upload                                       */
/* ------------------------------------------------------------------ */

const PRIVATE_UPLOAD_ROOT =
  process.env.PRIVATE_UPLOAD_ROOT || path.join(process.cwd(), 'uploads_private');
const DOCS_DIR = path.join(PRIVATE_UPLOAD_ROOT, 'dealer_docs');
fs.mkdirSync(DOCS_DIR, { recursive: true });

const dealerDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCS_DIR),
  filename: (_req, file, cb) => cb(null, secureFilename(DEALER_ALLOWED_MIME, file)),
});

export const dealerDocUpload = multer({
  storage: dealerDocStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 2 }, // 8 MB, max 2 files
  fileFilter: (_req, file, cb) => {
    if (!DEALER_ALLOWED_MIME.has(file.mimetype)) {
      return cb(Object.assign(new Error('Only PDF, JPG and PNG files are allowed'), { status: 400 }));
    }
    cb(null, true);
  },
});

export { DOCS_DIR, PRIVATE_UPLOAD_ROOT };

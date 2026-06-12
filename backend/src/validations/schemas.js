// src/validations/schemas.js
// Zod validation schemas for all API endpoints.
//
// Usage in controllers:
//   import { sendOtpSchema, mobileSchema } from '../validations/schemas.js';
//   const parsed = sendOtpSchema.safeParse(req.body);
//   if (!parsed.success) return res.status(400).json({ ok: false, errors: parsed.error.flatten() });

import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Reusable primitives                                                  */
/* ------------------------------------------------------------------ */

/** 10-digit Indian mobile number */
export const mobileSchema = z
  .string()
  .transform((v) => String(v || '').replace(/\D/g, ''))
  .pipe(
    z.string().regex(/^\d{10}$/, 'Must be a valid 10-digit mobile number')
  );

/** 6-digit OTP code */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be a 6-digit number');

/** Positive amount (INR) */
export const amountSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().positive('Amount must be greater than zero').max(10_00_000, 'Amount too large'));

/** Chat ID (positive integer) */
export const chatIdSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().int().positive('Invalid chat ID'));

/** Message ID */
export const messageIdSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().int().positive('Invalid message ID'));

/** Payment ID */
export const paymentIdSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().int().positive('Invalid payment ID'));

/** GST number pattern */
export const gstSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GST number format'
  );

/** 6-digit pincode */
export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Invalid pincode');

/** Sender role */
export const senderRoleSchema = z.enum(['farmer', 'admin', 'dealer', 'system']);

/* ------------------------------------------------------------------ */
/*  Auth endpoints                                                       */
/* ------------------------------------------------------------------ */

export const sendOtpSchema = z.object({
  mobile: mobileSchema,
});

export const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  code: otpCodeSchema,
  name: z.string().max(120).optional(),
  address: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  mobile: mobileSchema,
});

/* ------------------------------------------------------------------ */
/*  Admin endpoints                                                      */
/* ------------------------------------------------------------------ */

export const adminLoginStartSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().trim().min(1, 'Password is required'),
});

export const adminVerifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  code: otpCodeSchema,
});

/* ------------------------------------------------------------------ */
/*  Chat endpoints                                                       */
/* ------------------------------------------------------------------ */

export const postMessageSchema = z.object({
  mobile: mobileSchema,
  sender_role: senderRoleSchema.default('farmer'),
  text: z.string().max(10_000).optional().nullable(),
  reply_to: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().int().positive()).optional().nullable(),
  last_spray_date: z.string().max(20).optional().nullable(),
  last_chemical: z.string().max(120).optional().nullable(),
  last_dosage: z.string().max(60).optional().nullable(),
  audio_duration: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().positive()).optional().nullable(),
  original_name: z.string().max(255).optional().nullable(),
});

export const deleteMessageSchema = z.object({
  role: z.enum(['farmer', 'admin']).default('farmer'),
  mode: z.enum(['me', 'everyone']).default('me'),
});

export const clearChatSchema = z.object({
  chat_id: chatIdSchema,
  role: z.enum(['farmer', 'admin']).default('admin'),
  scope: z.literal('me').default('me'),
});

export const chatStatusSchema = z.object({
  chat_id: chatIdSchema,
  status: z.enum(['UNREAD', 'READ', 'SENT']),
});

export const sendLRSchema = z.object({
  chat_id: chatIdSchema,
  lr_number: z.string().trim().min(1, 'LR number is required').max(50),
  tracking_link: z.string().url().max(500).optional().or(z.literal('')).transform((v) => v || ''),
});

/* ------------------------------------------------------------------ */
/*  Quotation endpoints                                                  */
/* ------------------------------------------------------------------ */

export const uploadQuotationSchema = z.object({
  chat_id: chatIdSchema,
  amount: amountSchema.default(0),
  original_name: z.string().max(255).optional().nullable(),
});

/* ------------------------------------------------------------------ */
/*  Payment endpoints                                                    */
/* ------------------------------------------------------------------ */

export const createPaymentSchema = z.object({
  chat_id: chatIdSchema,
  amount: amountSchema,
  mode: z.enum(['REDIRECT', 'IFRAME']).default('REDIRECT'),
  quotation_id: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().int().positive()).optional().nullable(),
  quote_id: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().int().positive()).optional().nullable(),
});

/* ------------------------------------------------------------------ */
/*  Dealer endpoints                                                     */
/* ------------------------------------------------------------------ */

export const dealerSendOtpSchema = z.object({
  phone: mobileSchema,
});

export const dealerVerifyOtpSchema = z.object({
  phone: mobileSchema,
  otp: otpCodeSchema,
});

export const dealerRegisterSchema = z.object({
  phone: mobileSchema,
  dealer_name: z.string().trim().min(1, 'Dealer name is required').max(120),
  firm_name: z.string().trim().min(1, 'Firm name is required').max(180),
  email: z.string().trim().email('Invalid email').max(160).optional().or(z.literal('')).transform((v) => v || null),
  gst: gstSchema,
  village_post: z.string().trim().min(1, 'Village/Post is required').max(160),
  taluk: z.string().trim().min(1, 'Taluk is required').max(120),
  district: z.string().trim().min(1, 'District is required').max(120),
  pincode: pincodeSchema,
  confirm_true: z.literal('true', {
    errorMap: () => ({ message: 'Please confirm the information is true' }),
  }),
});

/* ------------------------------------------------------------------ */
/*  Announcement endpoints                                               */
/* ------------------------------------------------------------------ */

export const postAnnouncementSchema = z.object({
  type: z.enum(['UPDATE', 'ALERT', 'INFO', 'PROMO']).default('UPDATE'),
  title: z.string().max(200).optional().nullable(),
  body: z.string().trim().min(1, 'Message body is required').max(5000),
  link_url: z.string().url().max(500).optional().or(z.literal('')).transform((v) => v || null),
});

/* ------------------------------------------------------------------ */
/*  Farmer profile endpoints                                             */
/* ------------------------------------------------------------------ */

export const saveFarmerProfileSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  whatsapp: z.string().max(15).optional().nullable(),
  village: z.string().trim().min(1, 'Village is required').max(120),
  taluk: z.string().trim().min(1, 'Taluk is required').max(120),
  district: z.string().trim().min(1, 'District is required').max(120),
  pincode: pincodeSchema,
  land_size: z.string().max(60).optional().nullable(),
  crops_text: z.string().max(2000).optional().nullable(),
});

/* ------------------------------------------------------------------ */
/*  PhonePe (manual) endpoints                                           */
/* ------------------------------------------------------------------ */

export const phonepeCreateSchema = z.object({
  amount: amountSchema,
  mobile: mobileSchema.optional().nullable(),
  name: z.string().max(120).optional().nullable(),
  orderId: z.string().trim().min(1, 'orderId is required').max(50),
});

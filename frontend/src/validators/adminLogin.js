// src/validators/adminLogin.js
// Zod schema for the admin OTP login form. Mirrors the backend
// validation in src/validations/schemas.js — kept as a copy for
// now (Zod major mismatch is resolved in a follow-up).

import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.'),
});

export default adminLoginSchema;

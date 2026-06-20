// src/validators/dealerRegister.js
// Zod schema for the dealer registration form. Mirrors the
// validation already inlined in Dealers.jsx.

import { z } from 'zod';

const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const dealerRegisterSchema = z.object({
  dealer_name:   z.string().trim().min(2, 'Dealer name is required.'),
  firm_name:     z.string().trim().min(2, 'Firm / Company name is required.'),
  email:         z.string().trim().email('Enter a valid email.').optional().or(z.literal('')),
  gst:           z
    .string()
    .trim()
    .toUpperCase()
    .regex(GST_RE, 'Enter a valid GST number.'),
  village_post:  z.string().trim().min(2, 'Village / Post is required.'),
  taluk:         z.string().trim().min(2, 'Taluk is required.'),
  district:      z.string().trim().min(2, 'District is required.'),
  pincode:       z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Pin Code.'),
  confirm_true:  z.literal(true, {
    errorMap: () => ({ message: 'Please confirm that the information is true.' }),
  }),
});

export default dealerRegisterSchema;

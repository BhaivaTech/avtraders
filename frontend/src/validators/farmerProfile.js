// src/validators/farmerProfile.js
// Zod schema for the farmer profile form.

import { z } from 'zod';

export const farmerProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required.'),
  mobile:    z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number.'),
  whatsapp:  z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit WhatsApp number.'),
  village:   z.string().trim().min(2, 'Village is required.'),
  taluk:     z.string().trim().min(2, 'Taluk is required.'),
  district:  z.string().trim().min(2, 'District is required.'),
  pincode:   z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Pin Code.'),
  land_size: z.string().optional().or(z.literal('')),
  crops_text: z.string().optional().or(z.literal('')),
});

export default farmerProfileSchema;

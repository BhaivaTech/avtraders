// src/controllers/dealer/pricelist.js
// Dealer pricelist and download endpoints.
// Extracted from the monolithic dealerController.js.

import crypto from 'crypto';
import fs from 'fs';
import {
  findDealerByPhone,
  getActivePricelist,
  insertDownloadToken,
  getDownloadTokenRow,
} from '../../models/dealerModel.js';

/* ------------------------------------------------------------------ */
/*  GET /api/dealer/pricelist                                            */
/* ------------------------------------------------------------------ */

export async function getPricelist(req, res) {
  try {
    if (req.dealerAuth.status !== 'approved') {
      return res
        .status(403)
        .json({ message: 'Price list is available only after admin approval' });
    }

    const dealer = await findDealerByPhone(req.dealerAuth.phone);
    if (!dealer || dealer.status !== 'approved') {
      return res.status(403).json({ message: 'Dealer is not approved' });
    }

    const price = await getActivePricelist();
    if (!price)
      return res.status(404).json({ message: 'Price list is not uploaded yet' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await insertDownloadToken(token, dealer.id, price.id, expiresAt);

    return res.json({
      ok: true,
      file_name: price.file_name,
      uploaded_at: price.uploaded_at,
      download_url: `/api/dealer/pricelist/download?token=${token}`,
      expires_at: expiresAt,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message || 'Unable to get price list' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/dealer/pricelist/download                                   */
/* ------------------------------------------------------------------ */

export async function downloadPricelist(req, res) {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).send('Missing download token');

    const row = await getDownloadTokenRow(token);
    if (!row) return res.status(404).send('Invalid download token');
    if (row.status !== 'approved')
      return res.status(403).send('Dealer is not approved');
    if (Date.now() > new Date(row.expires_at).getTime())
      return res.status(410).send('Download link expired');

    try {
      await fs.promises.access(row.file_path);
    } catch {
      return res.status(404).send('Price list file not found');
    }

    return res.download(row.file_path, row.file_name);
  } catch (err) {
    return res.status(500).send(err?.message || 'Download failed');
  }
}

import fs from 'fs';
import path from 'path';
import { pool } from '../../config/db.js';
import { notifyDealerDecision } from '../../services/dealerNotifications.js';

export async function listDealers(req, res, next) {
  try {
    const status = req.query.status || 'pending';
    if (!['pending', 'approved', 'rejected', 'all'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const [dealers] = await pool.query(`SELECT * FROM dealers ${status === 'all' ? '' : 'WHERE status = ?'} ORDER BY created_at DESC LIMIT 500`, status === 'all' ? [] : [status]);
    const [[{ pending }]] = await pool.query("SELECT COUNT(*) AS pending FROM dealers WHERE status = 'pending'");
    res.json({ dealers, pending });
  } catch (err) { next(err); }
}

export async function dealerDetails(req, res, next) {
  try {
    const [[dealer]] = await pool.query('SELECT * FROM dealers WHERE id = ?', [req.params.id]);
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    const [documents] = await pool.query('SELECT id, type, file_name, uploaded_at FROM dealer_documents WHERE dealer_id = ?', [dealer.id]);
    const [audit] = await pool.query('SELECT * FROM dealer_audit WHERE dealer_id = ? ORDER BY id DESC LIMIT 50', [dealer.id]);
    res.json({ dealer, documents, audit });
  } catch (err) { next(err); }
}

export async function dealerDocument(req, res, next) {
  try {
    const [[doc]] = await pool.query('SELECT * FROM dealer_documents WHERE id = ? AND dealer_id = ?', [req.params.docId, req.params.id]);
    if (!doc || !fs.existsSync(doc.file_path)) return res.status(404).json({ message: 'Document not found' });
    res.set('Cache-Control', 'private, no-store');
    res.download(path.resolve(doc.file_path), doc.file_name);
  } catch (err) { next(err); }
}

export async function decideDealer(req, res, next) {
  const status = req.path.endsWith('/approve') ? 'approved' : 'rejected';
  const reason = String(req.body?.reason || '').trim();
  if (status === 'rejected' && (!reason || reason.length > 2000)) return res.status(400).json({ message: 'Enter a rejection reason (maximum 2000 characters)' });
  let connection;
  let dealer;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    [[dealer]] = await connection.query('SELECT * FROM dealers WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!dealer || dealer.status !== 'pending' || dealer.blocked) {
      await connection.rollback();
      return res.status(409).json({ message: 'Only pending, unblocked applications can be reviewed' });
    }
    const actor = String(req.adminId || req.session.adminEmail || 'admin');
    await connection.query('UPDATE dealers SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = ?, updated_at = NOW() WHERE id = ?', [status, status === 'rejected' ? reason : null, status === 'approved' ? actor : null, status === 'approved' ? new Date() : null, dealer.id]);
    await connection.query('INSERT INTO dealer_audit (dealer_id, action, actor_role, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [dealer.id, status.toUpperCase(), 'admin', actor, reason || 'Application approved']);
    await connection.commit();
  } catch (err) { if (connection) await connection.rollback(); return next(err); }
  finally { connection?.release(); }
  const notification_warning = await notifyDealerDecision(dealer, status, reason);
  res.json({ ok: true, notification_warning });
}

export async function listPriceLists(req, res, next) {
  try {
    const [files] = await pool.query('SELECT id, file_name, active, uploaded_at, uploaded_by FROM price_lists ORDER BY id DESC LIMIT 100');
    res.json({ files });
  } catch (err) { next(err); }
}

export async function uploadPriceList(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'Choose an Excel file' });
  let connection;
  try {
    // Excel XLSX files are ZIP containers; reject renamed non-workbooks.
    const buffer = await fs.promises.readFile(req.file.path);
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50 || !buffer.includes(Buffer.from('xl/workbook.xml'))) {
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({ message: 'Upload a valid .xlsx workbook' });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query('SELECT id FROM dealer_portal_lock WHERE id = 1 FOR UPDATE');
    await connection.query('UPDATE price_lists SET active = 0');
    await connection.query('INSERT INTO price_lists (file_path, file_name, active, uploaded_at, uploaded_by) VALUES (?, ?, 1, NOW(), ?)', [req.file.path, req.file.originalname, String(req.adminId || req.session.adminEmail || 'admin')]);
    await connection.commit();
    res.json({ ok: true });
  } catch (err) { if (connection) await connection.rollback(); await fs.promises.unlink(req.file.path).catch(() => {}); next(err); }
  finally { connection?.release(); }
}

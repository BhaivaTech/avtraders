// src/controllers/auditController.js
// Business logic for admin audit log endpoints.

import { getAuthAuditLogs, getDealerAuditLogs } from '../models/auditModel.js';
import logger from '../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  GET /api/admin/audit/auth                                            */
/* ------------------------------------------------------------------ */
export async function listAuthAudit(req, res) {
  try {
    const { page = 1, limit = 50, actorType, success } = req.query;
    const result = await getAuthAuditLogs({
      page: Number(page),
      limit: Math.min(Number(limit), 200),
      actorType,
      success,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    logger.error({ err }, '[audit] listAuthAudit failed');
    res.status(500).json({ ok: false, message: 'Failed to load audit logs' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/admin/audit/dealer                                          */
/* ------------------------------------------------------------------ */
export async function listDealerAudit(req, res) {
  try {
    const { page = 1, limit = 50, dealerId } = req.query;
    const result = await getDealerAuditLogs({
      page: Number(page),
      limit: Math.min(Number(limit), 200),
      dealerId: dealerId ? Number(dealerId) : undefined,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    logger.error({ err }, '[audit] listDealerAudit failed');
    res.status(500).json({ ok: false, message: 'Failed to load dealer audit logs' });
  }
}

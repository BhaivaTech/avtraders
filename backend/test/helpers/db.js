// test/helpers/db.js
// In-memory MySQL stub. The real `mysql2/promise` pool is replaced at
// import-time with a Map-backed store that supports the small surface
// the app actually uses (query with `?` placeholders, getConnection,
// end, execute for INSERT, JSON helpers).
//
// This lets the test suite run without a live MySQL or migrations
// runner. It is NOT a complete MySQL simulator — only the queries
// the controllers/models we test actually issue are supported.

import { vi } from 'vitest';

/* ------------------------------------------------------------------ */
/*  Table registry                                                      */
/* ------------------------------------------------------------------ */

const TABLES = {
  users: [],
  farmer_profiles: [],
  otps: [],
  farmer_otps: [],
  admin_otps: [],
  chats: [],
  messages: [],
  attachments: [],
  quotations: [],
  payments: [],
  products: [],
  dealer_orders: [],
  dealer_order_items: [],
  dealer_otp_sessions: [],
  dealers: [],
  dealer_documents: [],
  price_lists: [],
  dealer_download_tokens: [],
  dealer_audit: [],
  auth_audit: [],
  announcements: [],
  schema_migrations: [],
};

let _autoinc = {};
const _reset = () => {
  for (const k of Object.keys(TABLES)) TABLES[k] = [];
  _autoinc = {};
};
_reset();

/* ------------------------------------------------------------------ */
/*  Tiny SQL executor                                                   */
/* ------------------------------------------------------------------ */

/**
 * Replace `?` placeholders with the supplied values. We deliberately
 * use the *driver*'s own escaping elsewhere (we don't run user SQL),
 * so a naïve `?`-to-value swap is safe for the queries the app issues.
 */
function bind(sql, params = []) {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const v = params[i++];
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? '1' : '0';
    return `'${String(v).replace(/'/g, "''")}'`;
  });
}function matchRow(row, where) {
  for (const [k, v] of Object.entries(where)) {
    if (row[k] !== v) return false;
  }
  return true;
}

function nextId(table) {
  _autoinc[table] = (_autoinc[table] || 0) + 1;
  return _autoinc[table];
}

/* ------------------------------------------------------------------ */
/*  Public execute() / query()                                          */
/* ------------------------------------------------------------------ */

function execute(sqlRaw, params = []) {
  const sql = sqlRaw.trim().replace(/;$/, '');
  const upper = sql.toUpperCase();

  // CREATE / ALTER / DROP — silently succeed (idempotent in test env)
  if (upper.startsWith('CREATE ') || upper.startsWith('ALTER ') || upper.startsWith('DROP ')) {
    return [[], { affectedRows: 0 }];
  }
  // BEGIN / COMMIT / ROLLBACK / SET
  if (/^(BEGIN|COMMIT|ROLLBACK|START TRANSACTION|SET\s+)/i.test(upper)) {
    return [[], { affectedRows: 0 }];
  }
  // SELECT DATABASE()
  if (upper === 'SELECT DATABASE() AS DB') {
    return [[{ db: 'test_db' }], []];
  }
  // SHOW TABLES LIKE ?
  if (upper.startsWith('SHOW TABLES LIKE')) {
    return [[], []];
  }
  // SELECT 1 (health check)
  if (upper === 'SELECT 1' || upper === 'SELECT 1 AS `1`') {
    return [[{ '1': 1 }], []];
  }
  // INFORMATION_SCHEMA lookups — return 0 so "create" branch fires
  if (upper.startsWith('SELECT COUNT(*) AS N FROM INFORMATION_SCHEMA')) {
    return [[{ n: 0 }], []];
  }
  // SELECT 1 FROM <table> WHERE ... (existence checks)
  if (upper.startsWith('SELECT 1 FROM')) {
    return [[{ '1': 1 }], []];
  }
  // PREPARE / EXECUTE / DEALLOCATE no-ops
  if (/^(PREPARE|EXECUTE|DEALLOCATE)\b/i.test(upper)) {
    return [[], { affectedRows: 0 }];
  }

  // INSERT
  if (upper.startsWith('INSERT INTO') || upper.startsWith('INSERT IGNORE INTO')) {
    const m = sql.match(/^INSERT\s+(?:IGNORE\s+)?INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*(.*)$/i);
    if (!m) throw new Error('Mock DB: cannot parse INSERT: ' + sql);
    const table = m[1];
    const cols = m[2].split(',').map((c) => c.trim().replace(/`/g, ''));
    const valuesBlock = m[3];
    // Single-row only; multi-row VALUES is not used in the queries we test.
    const tuple = valuesBlock.match(/^\((.*)\)$/s);
    if (!tuple) throw new Error('Mock DB: bad VALUES tuple: ' + sql);
    const vals = splitTuple(tuple[1]);
    const row = {};
    cols.forEach((c, i) => { row[c] = coerce(vals[i]); });
    // Auto-increment id column if present
    if (cols.includes('id') && row.id === undefined) row.id = nextId(table);
    if (TABLES[table]) TABLES[table].push(row);
    return [[], { insertId: row.id, affectedRows: 1 }];
  }

  // UPDATE
  if (upper.startsWith('UPDATE')) {
    const m = sql.match(/^UPDATE\s+`?(\w+)`?\s+SET\s+(.*?)(?:\s+WHERE\s+(.+))?$/is);
    if (!m) throw new Error('Mock DB: cannot parse UPDATE: ' + sql);
    const [, table, setClause, whereClause] = m;
    const setPairs = parseSet(setClause);
    const where = whereClause ? parseWhere(whereClause) : {};
    let affected = 0;
    if (TABLES[table]) {
      for (const row of TABLES[table]) {
        if (matchRow(row, where)) {
          for (const [k, v] of setPairs) row[k] = v;
          affected++;
        }
      }
    }
    return [[], { affectedRows: affected }];
  }

  // DELETE
  if (upper.startsWith('DELETE FROM')) {
    const m = sql.match(/^DELETE\s+FROM\s+`?(\w+)`?(?:\s+WHERE\s+(.+))?$/is);
    if (!m) throw new Error('Mock DB: cannot parse DELETE: ' + sql);
    const [, table, whereClause] = m;
    const where = whereClause ? parseWhere(whereClause) : {};
    if (!TABLES[table]) return [[], { affectedRows: 0 }];
    const before = TABLES[table].length;
    TABLES[table] = TABLES[table].filter((r) => !matchRow(r, where));
    return [[], { affectedRows: before - TABLES[table].length }];
  }

  // SELECT
  if (upper.startsWith('SELECT')) {
    // Hand-rolled but covers the patterns we need:
    //  - SELECT 1
    //  - SELECT * FROM <t> [WHERE ...] [ORDER BY ...] [LIMIT N]
    //  - SELECT cols FROM <t> WHERE ... ORDER BY ... LIMIT N
    //
    // The FROM clause may be preceded by a comma-joined table list
    // (e.g. SELECT a.x, b.y FROM a JOIN b ON ...). We split on the
    // first FROM and pull only the first table name.
    const fromIdx = sql.search(/\bFROM\b/i);
    if (fromIdx < 0) return [[], []];
    const afterFrom = sql.slice(fromIdx + 4);
    const tableM = afterFrom.match(/^\s*`?(\w+)`?/);
    if (!tableM) return [[], []];
    const table = tableM[1];
    // Pull WHERE / LIMIT out of the remainder.
    const rest = afterFrom.slice(tableM[0].length);
    // Strip any JOIN/INNER/LEFT/RIGHT/CROSS ... ON ... clauses first.
    const restNoJoin = rest.replace(/\b(INNER|LEFT|RIGHT|CROSS)?\s*JOIN\s+[\s\S]+?\bON\s+[\s\S]+?(?=\s+(?:WHERE|ORDER|GROUP|LIMIT|$))/i, ' ');
    // Bind the `?` placeholders in the WHERE clause using the params
    // array so the WHERE values become real literals before parsing.
    const whereM = restNoJoin.match(/\bWHERE\s+([\s\S]+?)(?=\s+(?:ORDER|GROUP|LIMIT|$))/i);
    const limitM = restNoJoin.match(/\bLIMIT\s+(\d+)/i);
    const whereClause = whereM ? bind(whereM[1], params) : null;
    const limitStr = limitM ? limitM[1] : null;
    let rows = TABLES[table] ? [...TABLES[table]] : [];
    if (whereClause) {
      const w = parseWhere(whereClause);
      rows = rows.filter((r) => matchRow(r, w));
    }
    if (limitStr) rows = rows.slice(0, parseInt(limitStr, 10));
    return [rows, []];
  }

  throw new Error('Mock DB: unsupported statement: ' + sql);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function splitTuple(str) {
  // Naïve split at top-level commas, respecting parens and quotes.
  const out = [];
  let depth = 0, cur = '', inStr = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'" && str[i - 1] !== '\\') inStr = !inStr;
    if (!inStr) {
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function coerce(v) {
  v = v.trim();
  if (v === 'NULL') return null;
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (!isNaN(Number(v))) return Number(v);
  if (v === 'TRUE') return true;
  if (v === 'FALSE') return false;
  return v;
}

function parseSet(clause) {
  // SET col = expr, col2 = expr2
  // We only handle column = literal (and col = col +/- 1, which we map to a JS expression)
  return splitTuple(clause).map((p) => {
    const [k, ...rest] = p.split('=');
    const expr = rest.join('=').trim();
    if (/^\w+\s*\+\s*1$/.test(expr)) {
      const col = expr.match(/^(\w+)\s*\+\s*1$/)[1];
      return [k.trim().replace(/`/g, ''), { __increment: col }];
    }
    return [k.trim().replace(/`/g, ''), coerce(expr)];
  });
}

function parseWhere(clause) {
  // We only support: col = <literal> joined by AND
  const out = {};
  for (const part of clause.split(/\s+AND\s+/i)) {
    const m = part.match(/^`?(\w+)`?\s*=\s*(.+)$/);
    if (m) out[m[1]] = coerce(m[2]);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Mock pool                                                           */
/* ------------------------------------------------------------------ */

export const pool = {
  query: vi.fn(async (sql, params) => {
    const [rows, fieldsOrResult] = execute(sql, params);
    return [rows, fieldsOrResult];
  }),
  execute: vi.fn(async (sql, params) => {
    const [rows, result] = execute(sql, params);
    return [rows, result];
  }),
  getConnection: vi.fn(async () => ({
    query: vi.fn(async (sql, params) => {
      const [rows, result] = execute(sql, params);
      return [rows, result];
    }),
    beginTransaction: vi.fn(async () => {}),
    commit: vi.fn(async () => {}),
    rollback: vi.fn(async () => {}),
    release: vi.fn(() => {}),
  })),
  end: vi.fn(async () => {}),
  ping: vi.fn(async () => {}),
};

/* ------------------------------------------------------------------ */
/*  Test utility API                                                    */
/* ------------------------------------------------------------------ */

export function _resetDb() {
  _reset();
  pool.query.mockClear();
  pool.execute.mockClear();
  pool.getConnection.mockClear();
}

export function _getTable(name) {
  return TABLES[name] || [];
}

export function _seed(table, rows) {
  for (const r of rows) TABLES[table].push({ ...r, id: r.id ?? nextId(table) });
}

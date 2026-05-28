// Keep DB as 10-digit; build 91-prefixed MSISDN for providers.
export function normalizeMobile10(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length > 10) d = d.slice(-10);
  if (d.length !== 10) throw new Error("valid 10-digit mobile required");
  return d;
}

export function toMsisdn91(mobile10) {
  const ten = normalizeMobile10(mobile10);
  return "91" + ten; // E.164 without '+'
}

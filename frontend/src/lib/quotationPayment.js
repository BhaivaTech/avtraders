export function quotationPaymentState(meta = {}) {
  const state = String(meta.payment_status || meta.payment_state || '').toUpperCase();
  if (meta.paid_at || ['PAID', 'COMPLETED', 'SUCCESS'].includes(state)) return 'success';
  if (['FAILED', 'FAILURE', 'DECLINED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'ERROR'].includes(state)) return 'failed';
  if (['PENDING', 'PROCESSING', 'INITIATED'].includes(state)) return 'pending';
  return 'unpaid';
}

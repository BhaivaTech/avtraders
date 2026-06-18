// src/lib/toast.js
// Thin wrapper around react-hot-toast so we get one consistent
// project prefix and a tiny API that is hard to misuse.

import { toast as hotToast } from 'react-hot-toast';

function prefix(msg) {
  if (typeof msg !== 'string') return msg;
  return msg.startsWith('AV Traders') ? msg : `AV Traders: ${msg}`;
}

export const toast = {
  success: (msg, opts) => hotToast.success(prefix(msg), opts),
  error:   (msg, opts) => hotToast.error(prefix(msg), opts),
  loading: (msg, opts) => hotToast.loading(prefix(msg), opts),
  info:    (msg, opts) => hotToast(prefix(msg), opts),
  dismiss: (id) => hotToast.dismiss(id),
};

export default toast;

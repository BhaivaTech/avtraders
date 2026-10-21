import React from 'react';
import { quotationPaymentState } from '../lib/quotationPayment.js';
import './QuotationPaymentAction.css';

export default function QuotationPaymentAction({ meta, onPay, busy = false, readOnly = false }) {
  const state = quotationPaymentState(meta);
  return <div className="quotation-payment-action" aria-live="polite">
    {state === 'success' ? <button type="button" className="quotation-payment-success" disabled aria-label="Payment successful">✓ Success</button>
      : state === 'pending' || busy ? <button type="button" className="quotation-payment-pending" disabled>{busy ? 'Opening payment…' : 'Processing payment…'}</button>
      : readOnly ? <button type="button" className={state === 'failed' ? 'quotation-payment-failed' : 'quotation-payment-pending'} disabled>{state === 'failed' ? 'Payment failed' : 'Awaiting payment'}</button>
      : <>{state === 'failed' && <span className="quotation-payment-error">Payment failed</span>}<button type="button" className="quotation-payment-pay" onClick={onPay}>{state === 'failed' ? 'Pay again' : 'Pay'}</button></>}
  </div>;
}

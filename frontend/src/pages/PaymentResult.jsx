// frontend/src/pages/PaymentResult.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api"; // your axios wrapper

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const styles = {
  page: {
    minHeight: "calc(100vh - 80px)",
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(1200px 600px at -10% -10%, #ecfeff 0%, transparent 60%), radial-gradient(1200px 600px at 110% 110%, #eef2ff 0%, transparent 60%)",
    padding: "32px 16px",
  },
  card: {
    width: "min(680px, 100%)",
    background: "#fff",
    borderRadius: "20px",
    boxShadow:
      "0 20px 40px rgba(2,6,23,.08), 0 2px 10px rgba(2,6,23,.04)",
    padding: "28px",
    border: "1px solid #eef2f7",
  },
  header: { display: "flex", gap: 14, alignItems: "center", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: 0.2, margin: 0 },
  sub: { color: "#5b6876", marginTop: 2, marginBottom: 0 },
  row: { display: "flex", justifyContent: "space-between", padding: "10px 0" },
  label: { color: "#6b7280" },
  value: { fontWeight: 600 },
  hr: { border: 0, borderTop: "1px solid #eef2f7", margin: "14px 0" },
  btnRow: { display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" },
  btn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  primary: {
    background: "#0ea5e9",
    color: "#fff",
    borderColor: "#0ea5e9",
  },
  pill: (bg, fg) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    background: bg,
    color: fg,
  }),
};

const schedule = [
  { every: 3000, times: 10 }, // 3s for 30s
  { every: 6000, times: 10 }, // 6s for 60s
  { every: 10000, times: 6 }, // 10s for 60s
  { every: 30000, times: 2 }, // 30s for 60s
  { every: 60000, times: 60 }, // 1m thereafter
];

function StatusBadge({ status }) {
  if (status === "success") {
    return (
      <span style={styles.pill("#ecfdf5", "#065f46")}>
        <span>✅</span> Paid
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span style={styles.pill("#fef2f2", "#991b1b")}>
        <span>❌</span> Failed
      </span>
    );
  }
  return (
    <span style={styles.pill("#eff6ff", "#1e40af")}>
      <span>⏳</span> Pending
    </span>
  );
}

export default function PaymentResult() {
  const q = useQuery();
  const pid = Number(q.get("pid") || 0);
  const statusParam = (q.get("status") || "").toLowerCase();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [status, setStatus] = useState(
    ["success", "failed", "pending"].includes(statusParam)
      ? statusParam
      : "pending"
  );
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const schedRef = useRef({ i: 0, c: 0 });
  // Ref to track current status without stale closure issues
  const statusRef = useRef(status);
  // Keep ref in sync with state
  useEffect(() => { statusRef.current = status; }, [status]);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get(`/payment/status/${pid}`);
      if (data?.ok && data?.payment) {
        setPayment(data.payment);
        const s = (data.payment.status || "").toLowerCase();
        if (s === "success" || s === "failed") {
          setStatus(s);
          clearTimeout(timerRef.current);
        } else {
          setStatus("pending");
        }
        return s; // Return the resolved status for polling logic
      }
    } catch {}
    return null;
  };

  // boot
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const initialStatus = await fetchStatus();
      setLoading(false);
      const current = initialStatus || statusRef.current;
      if (current !== "success" && current !== "failed") {
        // schedule polling (PENDING reconciliation)
        const step = () => {
          if (!mounted) return;
          const plan = schedule[schedRef.current.i] || schedule[schedule.length - 1];
          if (schedRef.current.c >= plan.times) {
            schedRef.current.i = Math.min(schedRef.current.i + 1, schedule.length - 1);
            schedRef.current.c = 0;
          }
          schedRef.current.c += 1;
          timerRef.current = setTimeout(async () => {
            if (!mounted) return;
            const resolved = await fetchStatus();
            // Use ref instead of state to avoid stale closure
            const currentStatus = resolved || statusRef.current;
            if (currentStatus === "pending") step();
          }, plan.every);
        };
        step();
      }
    };
    if (pid) init();
    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const amount = payment ? Number(payment.amount || 0) : 0;
  const amountDisplay = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

  const merchantOrderId = (() => {
    try {
      const meta = payment?.meta ? JSON.parse(payment.meta) : {};
      return meta?.merchantOrderId || "";
    } catch {
      return "";
    }
  })();

  const title =
    status === "success"
      ? "Payment Successful"
      : status === "failed"
      ? "Payment Failed"
      : "Payment Pending";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ fontSize: 36 }}>
            {status === "success" ? "✅" : status === "failed" ? "❌" : "⏳"}
          </div>
          <div>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.sub}>
              {status === "success" &&
                "We’ve received your payment. A confirmation has been recorded."}
              {status === "failed" &&
                "Your payment did not go through. You can try again."}
              {status === "pending" &&
                "We’re waiting for confirmation. This page will auto-refresh."}
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <StatusBadge status={status} />
          </div>
        </div>

        <hr style={styles.hr} />

        <div style={styles.row}>
          <span style={styles.label}>Payment ID</span>
          <span style={styles.value}>#{pid || "-"}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Order Ref</span>
          <span style={styles.value}>{merchantOrderId || "-"}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Amount</span>
          <span style={styles.value}>{amountDisplay}</span>
        </div>

        <div style={styles.btnRow}>
          <button
            style={{ ...styles.btn, ...styles.primary }}
            onClick={() => navigate("/farmers")}
          >
            Back to Quotations
          </button>
          {status === "failed" && (
            <button
              style={styles.btn}
              onClick={() => navigate("/farmers")}
              title="Try paying again from the quotation"
            >
              Try Again
            </button>
          )}
          {status === "pending" && (
            <button style={styles.btn} onClick={fetchStatus}>
              Refresh Now
            </button>
          )}
          <button style={styles.btn} onClick={() => navigate("/")}>
            Home
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: 14, color: "#6b7280" }}>Loading…</div>
        )}
      </div>
    </div>
  );
}

// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../components/buynow.css";
import Seo from "../components/Seo.jsx";

// Static fallback data (used if API is unavailable)
const STATIC_PRODUCTS = [
  { id: "s1", name: "Hybrid Maize Seeds", price: 450, unit: "2 kg pack", sku: "SEED-MAIZE-HYB", desc: "Certified hybrid maize seeds. Net Qty: 2 kg. Recommended sowing rate: 18–20 kg/acre depending on spacing. Suitable for multiple soil types; good field emergence and vigor." },
  { id: "s2", name: "Paddy Seeds (IR64)", price: 300, unit: "5 kg pack", sku: "SEED-PADDY-IR64", desc: "IR64 paddy variety. Net Qty: 5 kg. Cleaned and graded seed with good germination. Suitable for irrigated and rain-fed conditions." },
  { id: "s3", name: "Urea", price: 600, unit: "45 kg bag", sku: "FERT-UREA", desc: "Nitrogen fertilizer (Urea, 46% N). Net Qty: 45 kg bag. Promotes rapid vegetative growth; apply as per crop schedule and soil test." },
  { id: "s4", name: "DAP", price: 1350, unit: "50 kg bag", sku: "FERT-DAP", desc: "Di-Ammonium Phosphate (18-46-0). Net Qty: 50 kg bag. Ensures strong root development and early growth; basal dose recommended." },
  { id: "s5", name: "Neem Oil", price: 250, unit: "1 L bottle", sku: "PEST-NEEM", desc: "Cold-pressed neem oil (Azadirachtin source). Net Qty: 1 litre. Natural bio-pesticide for sucking and chewing pests; suitable for organic use." },
  { id: "s6", name: "Fungicide Pack", price: 750, unit: "500 g pack", sku: "PEST-FUNGIPACK", desc: "Broad-spectrum fungicide formulation. Net Qty: 500 g. Prevents and controls common fungal diseases; follow label dose per crop." },
  { id: "s7", name: "Soil Testing", price: 500, unit: "per sample (≤500 g)", sku: "SRV-SOILTEST", desc: "Comprehensive soil analysis. Sample size: up to 500 g, properly labeled. Report includes pH, EC, N-P-K and fertilizer recommendations." },
  { id: "s8", name: "Crop Consultation", price: 1000, unit: "per visit (up to 60 min)", sku: "SRV-CONSULT", desc: "On-farm agronomist visit (within local limits). Includes diagnosis, crop plan, pest/disease management and fertilizer schedule." },
];

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        console.warn("[Products] API unavailable, using static fallback:", err.message);
        if (!cancelled) {
          setError("Could not load live products — showing last known catalogue.");
          setProducts(STATIC_PRODUCTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <Seo pageKey="products" />
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="mt-0" style={{ marginBottom: 8 }}>Products &amp; Services</h2>
        <p style={{ color: "#334155" }}>
          Explore our range of quality seeds, fertilizers, pesticides, and agri-services.
        </p>
        {error && (
          <p style={{ color: "#b45309", fontSize: "0.85rem", marginBottom: 0 }}>⚠️ {error}</p>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading products…
        </div>
      ) : (
        <div className="grid grid-3">
          {products.map((it) => (
            <div key={it.id || it.sku} className="card soft">
              <div className="bn-cat-title">{it.name}</div>
              <ul className="bn-list">
                <li className="bn-row">
                  <div className="bn-left">
                    <div className="bn-unit">{it.unit}</div>
                    {it.desc && <div className="bn-desc" style={{ marginTop: 4, fontSize: '0.85rem', color: '#64748b' }}>{it.desc}</div>}
                  </div>
                  <div className="bn-right">
                    <div className="bn-price">₹{it.price}</div>
                    <Link
                      className="bn-mini"
                      to={`/checkout?name=${encodeURIComponent(it.name)}&price=${it.price}&sku=${it.sku || it.id}`}
                    >
                      Pay Now
                    </Link>
                  </div>
                </li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

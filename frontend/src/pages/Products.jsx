// src/pages/Products.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../components/buynow.css";

const CATS = [
  {
    title: "Seeds",
    items: [
      {
        name: "Hybrid Maize Seeds",
        price: 450,
        unit: "2 kg pack",
        sku: "SEED-MAIZE-HYB",
        desc: "Certified hybrid maize seeds. Net Qty: 2 kg. Recommended sowing rate: 18–20 kg/acre depending on spacing. Suitable for multiple soil types; good field emergence and vigor."
      },
      {
        name: "Paddy Seeds (IR64)",
        price: 300,
        unit: "5 kg pack",
        sku: "SEED-PADDY-IR64",
        desc: "IR64 paddy variety. Net Qty: 5 kg. Cleaned and graded seed with good germination. Suitable for irrigated and rain-fed conditions."
      },
    ],
  },
  {
    title: "Fertilizers",
    items: [
      {
        name: "Urea",
        price: 600,
        unit: "45 kg bag",
        sku: "FERT-UREA",
        desc: "Nitrogen fertilizer (Urea, 46% N). Net Qty: 45 kg bag. Promotes rapid vegetative growth; apply as per crop schedule and soil test."
      },
      {
        name: "DAP",
        price: 1350,
        unit: "50 kg bag",
        sku: "FERT-DAP",
        desc: "Di-Ammonium Phosphate (18-46-0). Net Qty: 50 kg bag. Ensures strong root development and early growth; basal dose recommended."
      },
    ],
  },
  {
    title: "Pesticides",
    items: [
      {
        name: "Neem Oil",
        price: 250,
        unit: "1 L bottle",
        sku: "PEST-NEEM",
        desc: "Cold-pressed neem oil (Azadirachtin source). Net Qty: 1 litre. Natural bio-pesticide for sucking and chewing pests; suitable for organic use."
      },
      {
        name: "Fungicide Pack",
        price: 750,
        unit: "500 g pack",
        sku: "PEST-FUNGIPACK",
        desc: "Broad-spectrum fungicide formulation. Net Qty: 500 g. Prevents and controls common fungal diseases; follow label dose per crop."
      },
    ],
  },
  {
    title: "Agri Services",
    items: [
      {
        name: "Soil Testing",
        price: 500,
        unit: "per sample (≤500 g)",
        sku: "SRV-SOILTEST",
        desc: "Comprehensive soil analysis. Sample size: up to 500 g, properly labeled. Report includes pH, EC, N-P-K and fertilizer recommendations."
      },
      {
        name: "Crop Consultation",
        price: 1000,
        unit: "per visit (up to 60 min)",
        sku: "SRV-CONSULT",
        desc: "On-farm agronomist visit (within local limits). Includes diagnosis, crop plan, pest/disease management and fertilizer schedule."
      },
    ],
  },
];

export default function Products() {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="mt-0" style={{ marginBottom: 8 }}>Products & Services</h2>
        <p style={{ color: "#334155" }}>
          Explore our range of quality seeds, fertilizers, pesticides, and agri-services with clear net quantities and usage guidance.
        </p>
      </div>

      <div className="grid grid-3">
        {CATS.map((cat) => (
          <div key={cat.title} className="card soft">
            <div className="bn-cat-title">{cat.title}</div>
            <ul className="bn-list">
              {cat.items.map((it) => (
                <li key={it.sku} className="bn-row">
                  <div className="bn-left">
                    <div className="bn-name">{it.name}</div>
                    <div className="bn-unit">{it.unit}</div>
                    <div className="bn-desc">{it.desc}</div>
                  </div>
                  <div className="bn-right">
                    <div className="bn-price">₹{it.price}</div>
                    <Link
                      className="bn-mini"
                      to={`/checkout?name=${encodeURIComponent(it.name)}&price=${it.price}&sku=${it.sku}`}
                    >
                      Pay Now
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

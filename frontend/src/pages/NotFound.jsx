// src/pages/NotFound.jsx

import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section
      style={{
        background: "#f7f8f5",
        minHeight: "calc(100vh - 80px)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Left Section */}
        <div>
          <div
            style={{
              color: "#6c9830",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            • Agricultural Clinic & Agri Business Center
          </div>

          <h1 className="ct-hero-title">
            Looks like this page
            <br />
            grew in the
            <br />
            <span style={{ color: "#69a92f" }}>wrong field.</span>
          </h1>

          <p className="ct-hero-sub">
            The page you're looking for may have been moved, renamed,
            or never planted here. Let's help you find the right path.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <Link
              to="/"
              style={{
                padding: "15px 28px",
                background: "#5a991f",
                color: "#fff",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Go Home →
            </Link>

            <Link
              to="/clinic"
              style={{
                padding: "15px 28px",
                background: "#fff",
                color: "#13330f",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 700,
                border: "1px solid #cfe0be",
                fontSize: 16,
              }}
            >
              Visit Clinic
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              color: "#5d8c31",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            <span>⭐ Trusted by farmers across Karnataka</span>
            <span>🌐 English & Kannada support</span>
          </div>
        </div>

        {/* Right Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
            maxWidth: 500,
            width: "100%",
            justifySelf: "center",
          }}
        >
          <div
            style={{
              background: "#165d08",
              padding: "24px 28px",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#5f9630",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                404
              </div>

              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  Page Not Found
                </div>

                <div
                  style={{
                    opacity: 0.85,
                    marginTop: 4,
                  }}
                >
                  AV Agri Clinic Support
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div
              style={{
                background: "#f6f8f2",
                borderRadius: 16,
                padding: 18,
                marginBottom: 16,
                color: "#2c2c2c",
                fontSize: 16,
              }}
            >
              🌾 The requested page could not be located.
            </div>

            <div
              style={{
                background: "#f6f8f2",
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
                color: "#2c2c2c",
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              📍 Return to the homepage or explore our Agri Clinic
              services.
            </div>

            <Link
              to="/contact"
              style={{
                display: "block",
                textAlign: "center",
                background: "#5a991f",
                color: "#fff",
                textDecoration: "none",
                padding: "15px",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
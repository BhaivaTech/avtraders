import React from "react";

export default function About() {
  return (
    <div className="card about" style={{ padding: 20 }}>
      {/* Header */}
      <div className="hdr" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
  <span style={{ fontSize:22 }}>🌱</span>
  {/* was: inline-styled h2 */}
  <h2 className="about-title">Our Story – From Farmer Fields to Farmer Success</h2>
</div>


      <p className="about-text">
        At <b>AV Traders Agri Clinic</b>, we believe farming is not just about crops – it’s about
        farmers’ growth and prosperity.
      </p>
      <p className="about-text">
        Founded by <b>Dr. A. Venugopal (M.Sc. Agriculture)</b>, with over <b>30 years</b> of
        experience in agricultural consultancy, our mission is to bring practical, affordable, and
        scientific solutions to farmers at the ground level.
      </p>

      {/* What We Do */}
      <div className="about-block about-block--green">
        <div className="about-block-head">
          <span aria-hidden>🌱</span>
          <h3>What We Do</h3>
        </div>
        <ul className="about-list">
          <li>Provide genuine agri inputs (seeds, fertilizers, crop protection, micronutrients).</li>
          <li>Offer personalized farm advisory based on local soil, crop, and climate.</li>
          <li>Help farmers reduce costs and improve yields with sustainable practices.</li>
          <li>Support dealers & retailers through our distribution network.</li>
        </ul>
      </div>

      {/* Our Experience */}
      <div className="about-block about-block--blue">
        <div className="about-block-head">
          <span aria-hidden>🎤</span>
          <h3>Our Experience</h3>
        </div>
        <ul className="about-list">
          <li>30+ years of guiding farmers across Karnataka.</li>
          <li>Guest speaker at agriculture & horticulture events.</li>
          <li>
            Active presence on YouTube:&nbsp;
            <a
              href="https://youtube.com/@dravenugopal"
              target="_blank"
              rel="noreferrer"
              title="Dr. A Venugopal on YouTube"
              style={{ fontWeight: 700, color: "#0ea5e9" }}
            >
              Dr. A Venugopal
            </a>
            , sharing farming knowledge in simple language.
          </li>
        </ul>
      </div>

      {/* Our Vision */}
      <div className="about-block about-block--amber">
        <div className="about-block-head">
          <span aria-hidden>💡</span>
          <h3>Our Vision</h3>
        </div>
        <p className="about-text mb-0">
          To be a trusted partner for every farmer – making farming more <b>profitable</b>,{" "}
          <b>sustainable</b>, and <b>future-ready</b>.
        </p>
      </div>

      {/* CTA */}
      <div className="about-cta">
        <a className="btn" href="/farmers" style={{ background: "#10b981", color: "#fff" }}>
          🌿 Explore Solutions
        </a>
        <a
          className="btn"
          href="https://youtube.com/@dravenugopal"
          target="_blank"
          rel="noreferrer"
          style={{ background: "#ef4444", color: "#fff" }}
        >
          ▶ Watch on YouTube
        </a>
      </div>
    </div>
  );
}

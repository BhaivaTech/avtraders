import React from "react";

export default function About() {
  return (
    <>
      <style>{`
        .about-page {
          max-width: 1200px;
          margin: auto;
          padding: 40px 20px 80px;
          color: #1f2937;
        }

        .hero {
          text-align: center;
          padding: 60px 20px;
          margin-bottom: 50px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #d9e8dc;
          border-radius: 999px;
          background: #fafdfb;
          color: #2f6f3e;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .hero h1 {
          font-size: clamp(2.2rem, 5vw, 4rem);
          line-height: 1.1;
          margin-bottom: 20px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .hero h1 span {
          color: #2f6f3e;
        }

        .hero p {
          max-width: 760px;
          margin: auto;
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.8;
        }

        .founder-card {
          border: 1px solid #e5eee7;
          border-radius: 24px;
          padding: 40px;
          background: #fff;
          margin-bottom: 50px;
        }

        .section-tag {
          color: #2f6f3e;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .founder-card h2 {
          margin-top: 12px;
          margin-bottom: 12px;
          font-size: 2rem;
        }

        .founder-subtitle {
          color: #64748b;
          margin-bottom: 18px;
          font-weight: 500;
        }

        .founder-card p {
          color: #475569;
          line-height: 1.8;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 60px;
        }

        .feature-card {
          border: 1px solid #e5eee7;
          border-radius: 20px;
          padding: 28px;
          background: white;
          transition: all .25s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: #b7d6be;
        }

        .feature-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #f5faf6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          margin-bottom: 12px;
          font-size: 1.2rem;
        }

        .feature-card p {
          color: #64748b;
          line-height: 1.7;
        }

        .vision {
          border: 1px solid #e5eee7;
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          margin-bottom: 60px;
        }

        .vision h2 {
          margin: 16px auto;
          max-width: 800px;
          font-size: clamp(1.8rem, 4vw, 3rem);
          line-height: 1.2;
        }

        .vision p {
          max-width: 720px;
          margin: auto;
          color: #64748b;
          line-height: 1.8;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 60px;
        }

        .stat {
          border: 1px solid #e5eee7;
          border-radius: 20px;
          padding: 30px;
          text-align: center;
          background: white;
        }

        .stat h3 {
          font-size: 2rem;
          color: #2f6f3e;
          margin-bottom: 8px;
        }

        .stat span {
          color: #64748b;
          font-size: .95rem;
        }

        .cta {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .primary-btn,
        .secondary-btn {
          padding: 14px 24px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 600;
          transition: .25s;
        }

        .primary-btn {
          background: #2f6f3e;
          color: white;
        }

        .primary-btn:hover {
          opacity: .92;
        }

        .secondary-btn {
          border: 1px solid #d9e8dc;
          color: #1f2937;
          background: white;
        }

        .secondary-btn:hover {
          background: #fafdfb;
        }

        @media (max-width: 768px) {
          .features {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .founder-card,
          .vision {
            padding: 24px;
          }
        }

        @media (max-width: 500px) {
          .stats {
            grid-template-columns: 1fr;
          }

          .hero {
            padding: 30px 0;
          }
        }
      `}</style>

      <div className="about-page">
        <section className="hero">
          <div className="badge">
            🌾 Agricultural Clinic & Agri Business Center
          </div>

          <h1>
            Empowering Farmers Through
            <br />
            <span>Scientific Agriculture</span>
          </h1>

          <p>
            AV Traders Agri Clinic combines agricultural science,
            field experience, and practical farm solutions to help
            farmers improve productivity, profitability, and long-term
            sustainability.
          </p>
        </section>

        <section className="founder-card">
          <span className="section-tag">
            Founder & Agricultural Consultant
          </span>

          <h2>Dr. A. Venugopal</h2>

          <div className="founder-subtitle">
            M.Sc. Agriculture • 30+ Years of Agricultural Consultancy
          </div>

          <p>
            With over three decades of hands-on experience working
            directly with farmers across Karnataka, Dr. A. Venugopal
            has dedicated his career to bringing scientific and
            practical agricultural solutions to the field. His mission
            is to help farmers achieve better yields, healthier crops,
            and sustainable growth through knowledge-driven farming.
          </p>
        </section>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">🌱</div>
            <h3>Farm Advisory</h3>
            <p>
              Personalized crop guidance based on soil condition,
              climate patterns, crop stage, and local farming
              practices.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌾</div>
            <h3>Quality Agri Inputs</h3>
            <p>
              Reliable seeds, fertilizers, micronutrients, and crop
              protection products sourced from trusted manufacturers.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Profitability Focus</h3>
            <p>
              Helping farmers reduce input costs, improve efficiency,
              and increase farm profitability.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Distribution Network</h3>
            <p>
              Supporting dealers and retailers with dependable product
              supply and technical agricultural expertise.
            </p>
          </div>
        </section>

        <section className="vision">
          <span className="section-tag">Our Vision</span>

          <h2>
            Building a Future Where Every Farmer Has Access to
            Knowledge, Technology, and Opportunity
          </h2>

          <p>
            We envision a sustainable agricultural ecosystem where
            innovation, education, and trusted partnerships empower
            farmers to thrive in an ever-changing world.
          </p>
        </section>

        <section className="stats">
          <div className="stat">
            <h3>30+</h3>
            <span>Years Experience</span>
          </div>

          <div className="stat">
            <h3>1000+</h3>
            <span>Farmers Guided</span>
          </div>

          <div className="stat">
            <h3>100+</h3>
            <span>Training Programs</span>
          </div>

          <div className="stat">
            <h3>24/7</h3>
            <span>Farmer Support</span>
          </div>
        </section>

        <section className="cta">
          <a href="/farmers" className="primary-btn">
            Explore Agricultural Solutions
          </a>

          <a
            href="https://youtube.com/@dravenugopal"
            target="_blank"
            rel="noreferrer"
            className="secondary-btn"
          >
            Watch Expert Farming Guidance
          </a>
        </section>
      </div>
    </>
  );
}
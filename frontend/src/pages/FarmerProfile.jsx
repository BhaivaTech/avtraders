// src/pages/FarmerProfile.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import './FarmerProfile.css';

const norm = (v) => String(v || '').replace(/\D/g, '').slice(-10);

export default function FarmerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobile, setMobile] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    whatsapp: '',
    village: '',
    taluk: '',
    district: '',
    pincode: '',
    land_size: '',
    crops_text: '',
  });

  /* ---------- lock background + make this page full-screen like chat ---------- */
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  /* -------- load mobile from localStorage (same as Farmers.jsx) -------- */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('farmerAuth') || 'null');
      if (saved?.mobile) {
        setMobile(norm(saved.mobile));
      } else {
        setError('Please login first from the AV Agro Support chat page.');
        setLoading(false);
      }
    } catch {
      setError('Please login first from the AV Agro Support chat page.');
      setLoading(false);
    }
  }, []);

  /* -------- fetch existing profile -------- */
  useEffect(() => {
    if (!mobile) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const res = await api.get('/farmers/profile/me', {
          withCredentials: true,
        });

        const profile = res?.data?.profile || null;

        if (!cancelled && profile) {
          setForm({
            full_name: profile.full_name || profile.name || '',
            whatsapp: profile.whatsapp || '',
            village: profile.village || '',
            taluk: profile.taluk || '',
            district: profile.district || '',
            pincode: profile.pincode || '',
            land_size: profile.land_size || '',
            crops_text: profile.crops_text || '',
          });
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          if (!cancelled) {
            setError(
              'Session expired. Please login again from AV Agro Support page.'
            );
          }
        } else if (status !== 404) {
          if (!cancelled) {
            setError(err?.response?.data?.message || 'Failed to load profile.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mobile]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!mobile || mobile.length !== 10) return 'Invalid mobile number';
    if (!form.village.trim()) return 'Village is required';
    if (!form.taluk.trim()) return 'Taluk is required';
    if (!form.district.trim()) return 'District is required';
    if (!form.pincode.trim()) return 'Pincode is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    try {
      await api.post(
        '/farmers/profile/save',
        {
          mobile,
          ...form,
        },
        { withCredentials: true }
      );
      setSuccess('Profile saved successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/farmers';
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Do you want to logout?');
    if (!confirmed) return;

    try {
      await api.post('/farmers/logout', {}, { withCredentials: true });
    } catch (e) {
      // ignore backend error
    }

    try {
      localStorage.removeItem('farmerAuth');
    } catch {}

    window.location.href = '/farmers';
  };

  return (
    <div className="fp-overlay">
      <div className="fp-page">
        {/* ---------- TOP GREEN BAR (inside overlay, no main site header) ---------- */}
        <header className="fp-topbar">
          <div className="fp-topbar-left">
            <button
              className="fp-icon-btn"
              onClick={goBack}
              type="button"
              aria-label="Back"
            >
              ←
            </button>

            <div className="fp-title-wrap">
              <div className="fp-title">Farmer Profile</div>
              <div className="fp-subtitle">View &amp; update your details</div>
            </div>
          </div>

          <button
            className="fp-logout-btn"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* ---------- MAIN CARD ---------- */}
        <main className="fp-main">
          {loading ? (
            <div className="fp-card fp-center">Loading profile…</div>
          ) : !mobile && error ? (
            <div className="fp-card fp-center">{error}</div>
          ) : (
            <form className="fp-card" onSubmit={handleSubmit}>
              {error && <div className="fp-banner fp-error">{error}</div>}
              {success && <div className="fp-banner fp-success">{success}</div>}

              <div className="fp-grid">
                <div className="fp-field">
                  <label>
                    Full Name <span className="fp-req">*</span>
                  </label>
                  <input
                    className="fp-input"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                  />
                </div>

                <div className="fp-field">
                  <label>
                    Mobile Number <span className="fp-req">*</span>
                  </label>
                  <input
                    className="fp-input"
                    value={mobile ? '+91 ' + mobile : ''}
                    readOnly
                  />
                  <div className="fp-hint">
                    This is your login number (read only).
                  </div>
                </div>

                <div className="fp-field">
                  <label>
                    Village <span className="fp-req">*</span>
                  </label>
                  <input
                    className="fp-input"
                    value={form.village}
                    onChange={(e) => updateField('village', e.target.value)}
                  />
                </div>

                <div className="fp-field">
                  <label>
                    Taluk <span className="fp-req">*</span>
                  </label>
                  <input
                    className="fp-input"
                    value={form.taluk}
                    onChange={(e) => updateField('taluk', e.target.value)}
                  />
                </div>

                <div className="fp-field">
                  <label>
                    District <span className="fp-req">*</span>
                  </label>
                  <input
                    className="fp-input"
                    value={form.district}
                    onChange={(e) => updateField('district', e.target.value)}
                  />
                </div>

                <div className="fp-field">
                  <label>
                    Pincode <span className="fp-req">*</span>
                  </label>
                  <input
                    className="fp-input"
                    value={form.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                  />
                </div>

                <div className="fp-field">
                  <label>Land Size (optional)</label>
                  <input
                    className="fp-input"
                    value={form.land_size}
                    onChange={(e) => updateField('land_size', e.target.value)}
                    placeholder="e.g., 2 acres, 1.5 guntas"
                  />
                </div>

                <div className="fp-field fp-full">
                  <label>Crops you grow (free text)</label>
                  <textarea
                    className="fp-input fp-textarea"
                    value={form.crops_text}
                    onChange={(e) => updateField('crops_text', e.target.value)}
                    placeholder="Example: Ragi, Paddy, Tomato, Chilli…"
                  />
                </div>
              </div>

              <div className="fp-actions">
                <button
                  type="button"
                  className="fp-btn fp-secondary"
                  onClick={goBack}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fp-btn fp-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

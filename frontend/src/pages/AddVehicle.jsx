import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaBolt, FaCar, FaBatteryHalf, FaClock, FaArrowLeft } from 'react-icons/fa';

const AddVehicle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    range: '',
    batteryCapacity: '',
    chargeTime: '',
    currentChargePercent: 80,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'currentChargePercent'
        ? Math.max(0, Math.min(100, parseInt(value || 0, 10)))
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.name || formData.range === '' || formData.batteryCapacity === '') {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      const body = {
        name: String(formData.name).trim(),
        range: Number(formData.range),
        batteryCapacity: Number(formData.batteryCapacity),
        chargeTime: formData.chargeTime !== '' ? Number(formData.chargeTime) : 480,
        currentChargePercent: formData.currentChargePercent !== '' ? Number(formData.currentChargePercent) : 80,
      };
      const config = {};
      const token = user?.token || user?.accessToken || null;
      if (token) { config.headers = { Authorization: `Bearer ${token}` }; }
      else { config.withCredentials = true; }

      const response = await api.post('/vehicles', body, config);
      if (response?.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard?tab=vehicle'), 1200);
      } else {
        setError(response?.data?.message || 'Failed to add vehicle');
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Unknown error';
      setError(serverMsg || 'Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Computed effective range
  const effectiveRange = formData.range
    ? ((Number(formData.range) * formData.currentChargePercent) / 100).toFixed(0)
    : null;

  const chargeColor =
    formData.currentChargePercent >= 70 ? '#10b981' :
    formData.currentChargePercent >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf8', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
        padding: '20px 16px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate('/dashboard?tab=vehicle')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, minHeight: 'unset' }}
          >
            <FaArrowLeft size={12} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaCar style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Add Vehicle</h1>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>Enter your EV details for smart route planning</p>
            </div>
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div style={{ maxWidth: 600, margin: '-16px auto 32px', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* ── CURRENT CHARGE SECTION (prominent at top) ── */}
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', padding: '20px 24px', borderBottom: '1px solid #a7f3d0' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#064e3b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaBatteryHalf style={{ color: chargeColor }} /> Current Battery Charge
            </p>
            <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#047857' }}>How much charge does your car have right now?</p>

            {/* Big charge display */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: chargeColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {formData.currentChargePercent}
                </div>
                <div style={{ fontSize: '1rem', color: chargeColor, fontWeight: 700 }}>%</div>
              </div>
              {effectiveRange && (
                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(8px)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>EFFECTIVE RANGE NOW</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>{effectiveRange} km</div>
                </div>
              )}
            </div>

            {/* Slider */}
            <input
              type="range"
              name="currentChargePercent"
              min="0" max="100" step="1"
              value={formData.currentChargePercent}
              onChange={handleChange}
              style={{ width: '100%', accentColor: chargeColor, height: 6, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>

            {/* Battery visual bar */}
            <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 8, height: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{
                height: '100%', width: `${formData.currentChargePercent}%`,
                background: `linear-gradient(90deg, ${chargeColor}, ${chargeColor}cc)`,
                borderRadius: 8, transition: 'width 0.2s ease, background 0.3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem' }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ Low</span>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>↔ Medium</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Good</span>
            </div>
          </div>

          {/* ── REST OF FORM ── */}
          <form onSubmit={handleSubmit} noValidate style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Vehicle Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Vehicle Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g., Tata Nexon EV, MG ZS EV"
                  required
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Range + Battery in a row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Range (km) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number" name="range" value={formData.range} onChange={handleChange}
                    placeholder="e.g., 312" min="0" step="0.1" required
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Battery (kWh) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number" name="batteryCapacity" value={formData.batteryCapacity} onChange={handleChange}
                    placeholder="e.g., 30.2" min="0" step="0.1" required
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Charge Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaClock style={{ color: '#10b981', fontSize: 12 }} /> Charge Time (minutes for 0→100%)
                </label>
                <input
                  type="number" name="chargeTime" value={formData.chargeTime} onChange={handleChange}
                  placeholder="e.g., 480 (8 hours)" min="0" step="1"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>Default: 480 minutes (8 hours) if left empty</p>
              </div>

              {/* Info preview card */}
              {(formData.name || formData.range || formData.batteryCapacity) && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: 14, padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaBolt style={{ color: '#10b981' }} /> Vehicle Preview
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.75rem' }}>
                    {formData.name && <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{formData.name}</span>}
                    {formData.range && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>🛣️ {formData.range} km</span>}
                    {formData.batteryCapacity && <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>🔋 {formData.batteryCapacity} kWh</span>}
                    <span style={{ background: chargeColor + '22', color: chargeColor, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>⚡ {formData.currentChargePercent}% charged</span>
                    {effectiveRange && <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>📍 {effectiveRange} km now</span>}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, fontSize: '0.85rem', fontWeight: 500 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                  ✅ Vehicle added! Redirecting...
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button
                  type="submit" disabled={loading}
                  style={{
                    flex: 1, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
                    fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
                  }}
                >
                  {loading ? (
                    <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'influx-spin 0.7s linear infinite', display: 'inline-block' }} /> Adding...</>
                  ) : (
                    <><FaCar /> Add Vehicle</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard?tab=vehicle')}
                  style={{ padding: '14px 20px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`@keyframes influx-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AddVehicle;
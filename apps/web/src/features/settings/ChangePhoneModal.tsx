import React, { useState } from 'react';
import { X, Phone, ArrowRight, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { settingsService } from '../../services/settings';

interface ChangePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoneNumber: string;
  onPhoneChanged?: (newPhone: string) => void;
}

export const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({
  isOpen,
  onClose,
  currentPhoneNumber,
  onPhoneChanged,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [oldPhone, setOldPhone] = useState(currentPhoneNumber || '+91 98765 43210');
  const [countryCode, setCountryCode] = useState('+91');
  const [newPhoneDigits, setNewPhoneDigits] = useState('');
  const [notifyContacts, setNotifyContacts] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullNewPhone = `${countryCode} ${newPhoneDigits.trim()}`;

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneDigits || newPhoneDigits.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 700);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      settingsService.update({ phoneNumber: fullNewPhone });
      if (onPhoneChanged) onPhoneChanged(fullNewPhone);
      setLoading(false);
      onClose();
    }, 900);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="settings-icon-badge badge-green">
              <Phone size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Change Phone Number</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '22px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(0, 168, 132, 0.12)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Phone size={28} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>
                  Migrate to a new number
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Changing your phone number will migrate your account info, groups, and settings from your old phone number.
                </p>
              </div>

              <div className="settings-card-highlight">
                <ShieldCheck size={18} color="#00a884" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Before proceeding, please verify that your new phone number can receive SMS or phone calls.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleNextStep1}>
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep2} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div className="settings-alert-danger">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Enter your old phone number
                </label>
                <input
                  type="text"
                  className="settings-input"
                  value={oldPhone}
                  onChange={(e) => setOldPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Enter your new phone number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="settings-select"
                    style={{ width: '90px', flexShrink: 0 }}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+971">+971 (AE)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+49">+49 (DE)</option>
                  </select>
                  <input
                    type="tel"
                    className="settings-input"
                    placeholder="98765 00000"
                    value={newPhoneDigits}
                    onChange={(e) => setNewPhoneDigits(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="settings-item-row" style={{ padding: '8px 0', border: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Notify contacts</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Notify chats and contacts about your new number
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifyContacts}
                    onChange={(e) => setNotifyContacts(e.target.checked)}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Verify phone number</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Enter the 6-digit verification code sent to <strong>{fullNewPhone}</strong>
                </p>
              </div>

              {error && (
                <div className="settings-alert-danger">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <input
                  type="text"
                  maxLength={6}
                  className="settings-input"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontWeight: 600 }}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Didn't receive code?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => alert('Verification SMS resent to ' + fullNewPhone)}
                >
                  Resend SMS
                </button>
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Migrate Number'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

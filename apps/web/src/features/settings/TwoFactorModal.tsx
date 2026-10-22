import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, KeyRound, Check, AlertCircle } from 'lucide-react';
import { settingsService } from '../../services/settings';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onUpdate: (enabled: boolean) => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  enabled,
  onUpdate,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPin !== pin) {
      setError('PINs do not match. Please try again.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      settingsService.update({
        twoFactorEnabled: true,
        twoFactorPin: pin,
      });
      onUpdate(true);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
        setPin('');
        setConfirmPin('');
      }, 1500);
    }, 800);
  };

  const handleDisable = () => {
    if (confirm('Are you sure you want to turn off two-step verification?')) {
      settingsService.update({
        twoFactorEnabled: false,
        twoFactorPin: '',
      });
      onUpdate(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="settings-icon-badge badge-blue">
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Two-Step Verification</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '22px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(0, 168, 132, 0.15)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Check size={32} />
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Two-Step Verification Enabled!</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Your account is now protected with a 6-digit security PIN.
              </p>
            </div>
          ) : enabled ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0, 168, 132, 0.12)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <ShieldCheck size={36} />
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                  Two-step verification is ON
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  You will need to enter your PIN when registering your phone number with WhatsApp again.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Done
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'rgba(234, 67, 53, 0.15)', color: '#ea4335' }}
                  onClick={handleDisable}
                >
                  Turn Off
                </button>
              </div>
            </div>
          ) : (
            <div>
              {error && (
                <div className="settings-alert-danger" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Enter a 6-digit PIN that you will be asked for when you register your phone number again:
                  </p>

                  <div className="form-group">
                    <input
                      type="password"
                      maxLength={6}
                      className="settings-input"
                      style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                      placeholder="••••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={pin.length !== 6}>
                      Next
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmPin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Confirm your 6-digit PIN:
                  </p>

                  <div className="form-group">
                    <input
                      type="password"
                      maxLength={6}
                      className="settings-input"
                      style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                      placeholder="••••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={confirmPin.length !== 6 || loading}>
                      {loading ? 'Saving PIN...' : 'Enable Two-Step'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

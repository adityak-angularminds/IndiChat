import React, { useEffect } from 'react';
import { ShieldAlert, LogOut, Laptop } from 'lucide-react';

interface SessionRevokedModalProps {
  isOpen: boolean;
  reason?: string;
  onClose: () => void;
}

export const SessionRevokedModal: React.FC<SessionRevokedModalProps> = ({
  isOpen,
  reason,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayReason =
    reason ||
    'This device was removed from your linked devices. You have been logged out.';

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '420px',
          padding: '28px 24px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Animated Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(234, 67, 53, 0.12)',
            border: '2px solid rgba(234, 67, 53, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <ShieldAlert size={34} color="#ea4335" />
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          Session Revoked / Logged Out
        </h3>

        {/* Device Meta Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-chat-header)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginBottom: '14px',
          }}
        >
          <Laptop size={14} />
          <span>Linked Device Session Ended</span>
        </div>

        {/* Reason Message */}
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
            marginBottom: '24px',
            padding: '0 8px',
          }}
        >
          {displayReason}
        </p>

        {/* Action Button */}
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '24px',
            fontWeight: 600,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 168, 132, 0.3)',
          }}
        >
          <LogOut size={18} />
          <span>Log In Again</span>
        </button>
      </div>
    </div>
  );
};

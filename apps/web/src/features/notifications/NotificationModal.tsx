import React, { useState } from 'react';
import { Bell, BellRing, BellOff, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { notificationService, NotificationPermissionStatus } from '../../services/notifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onGranted,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<NotificationPermissionStatus>(() =>
    notificationService.getPermissionStatus()
  );

  if (!isOpen) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await notificationService.requestPermission();
      setCurrentStatus(res);
      if (res === 'granted') {
        onGranted();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    notificationService.setDismissed(true);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="notification-modal-card">
        <button
          className="notification-modal-close"
          onClick={handleDismiss}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="notification-modal-icon-wrapper">
          {currentStatus === 'denied' ? (
            <div className="notification-modal-icon denied">
              <BellOff size={38} color="#ea4335" />
            </div>
          ) : (
            <div className="notification-modal-icon">
              <BellRing size={38} color="#00a884" className="bell-ringing" />
              <div className="notification-pulse-ring" />
            </div>
          )}
        </div>

        <h2 className="notification-modal-title">
          {currentStatus === 'denied' ? 'Notifications Blocked' : 'Turn On Notifications'}
        </h2>

        <p className="notification-modal-desc">
          {currentStatus === 'denied'
            ? 'Browser notifications are currently blocked for this site. To receive message alerts, enable them in your browser site settings.'
            : 'Get instant alerts on your desktop whenever you receive a new message or call, even when WhatsApp is in the background.'}
        </p>

        {currentStatus === 'denied' ? (
          <div className="notification-denied-instructions">
            <ShieldAlert size={20} color="#ea4335" />
            <span>
              Click the <strong>Lock / Settings</strong> icon in your browser address bar next to the URL, and switch <strong>Notifications</strong> to <strong>Allow</strong>.
            </span>
          </div>
        ) : (
          <div className="notification-features-list">
            <div className="notification-feature-item">
              <CheckCircle2 size={16} color="#00a884" />
              <span>Real-time desktop popups for new messages</span>
            </div>
            <div className="notification-feature-item">
              <CheckCircle2 size={16} color="#00a884" />
              <span>Click any notification to jump directly into the chat</span>
            </div>
          </div>
        )}

        <div className="notification-modal-actions">
          {currentStatus !== 'denied' && (
            <button
              className="btn-primary notification-btn-allow"
              onClick={handleEnable}
              disabled={loading}
            >
              <Bell size={18} />
              <span>{loading ? 'Requesting...' : 'Allow Notifications'}</span>
            </button>
          )}

          <button
            className="btn-secondary notification-btn-dismiss"
            onClick={handleDismiss}
          >
            {currentStatus === 'denied' ? 'Got It' : 'Not Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

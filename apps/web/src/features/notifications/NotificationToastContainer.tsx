import React, { useState, useEffect } from 'react';
import { notificationService, ToastNotification } from '../../services/notifications';
import { Bell, X, MessageSquare } from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsub = notificationService.onToast((toast) => {
      setToasts((prev) => [...prev.slice(-3), toast]); // Keep at most 4 latest toasts
    });
    return unsub;
  }, []);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClickToast = (toast: ToastNotification) => {
    handleDismiss(toast.id);
    if (toast.onClick) {
      toast.onClick();
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="notification-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="notification-toast-item"
          onClick={() => handleClickToast(toast)}
        >
          <div className="notification-toast-icon">
            {toast.avatar ? (
              <div className="avatar small">{toast.avatar}</div>
            ) : (
              <div className="notification-toast-badge">
                <Bell size={16} color="#00a884" />
              </div>
            )}
          </div>

          <div className="notification-toast-content">
            <div className="notification-toast-header">
              <span className="notification-toast-title">{toast.title}</span>
              <button
                className="notification-toast-close"
                onClick={(e) => handleDismiss(toast.id, e)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
            <p className="notification-toast-body">{toast.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

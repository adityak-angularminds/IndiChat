import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Monitor,
  Globe,
  Plus,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { AppSettings, LinkedDevice, settingsService } from '../../services/settings';
import { LinkDeviceModal } from './LinkDeviceModal';

interface LinkedDevicesViewProps {
  settings: AppSettings;
  onBack: () => void;
}

export const LinkedDevicesView: React.FC<LinkedDevicesViewProps> = ({ settings, onBack }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<LinkedDevice | null>(null);

  React.useEffect(() => {
    settingsService.syncWithBackend();
  }, []);

  const getPlatformIcon = (platform: LinkedDevice['platform']) => {
    switch (platform) {
      case 'windows':
      case 'linux':
      case 'mac':
        return <Laptop size={20} />;
      case 'ios':
      case 'android':
        return <Smartphone size={20} />;
      default:
        return <Monitor size={20} />;
    }
  };

  const handleLogoutDevice = (deviceId: string) => {
    if (confirm('Are you sure you want to log out from this device?')) {
      settingsService.removeLinkedDevice(deviceId);
      setSelectedDevice(null);
    }
  };

  const handleLogoutAll = () => {
    if (confirm('Log out from all other linked devices? You will stay logged in on this browser.')) {
      settingsService.removeAllOtherDevices();
    }
  };

  const otherDevices = settings.linkedDevices.filter((d) => !d.isCurrent);
  const currentDevice = settings.linkedDevices.find((d) => d.isCurrent);

  return (
    <div className="settings-subview">
      {/* Hero Banner */}
      <div className="linked-devices-hero">
        <div className="linked-devices-hero-icon">
          <Monitor size={36} color="#00a884" />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '10px', color: 'var(--text-primary)' }}>
          WhatsApp on all your devices
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '300px', lineHeight: '1.4' }}>
          Use WhatsApp on Web, Desktop, and tablets without keeping your phone online.
        </p>

        <button
          className="btn btn-primary"
          style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '24px', fontWeight: 600 }}
          onClick={() => setShowLinkModal(true)}
        >
          <Plus size={18} /> Link a Device
        </button>
      </div>

      {/* Device Status Section */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Device status</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 16px 8px' }}>
          Tap a device to view session details or log out.
        </p>

        <div className="settings-list-group">
          {/* Current device */}
          {currentDevice && (
            <div
              className="settings-device-item current"
              onClick={() => setSelectedDevice(currentDevice)}
            >
              <div className="settings-device-icon current">
                {getPlatformIcon(currentDevice.platform)}
              </div>
              <div className="settings-device-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="settings-device-name">{currentDevice.name}</span>
                  <span className="badge-this-device">This device</span>
                </div>
                <span className="settings-device-meta">
                  <span className="online-indicator-dot" /> {currentDevice.lastActive} • {currentDevice.location}
                </span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          )}

          {/* Other devices */}
          {otherDevices.map((dev) => (
            <div
              key={dev.id}
              className="settings-device-item"
              onClick={() => setSelectedDevice(dev)}
            >
              <div className="settings-device-icon">
                {getPlatformIcon(dev.platform)}
              </div>
              <div className="settings-device-info">
                <span className="settings-device-name">{dev.name}</span>
                <span className="settings-device-meta">
                  Last active {dev.lastActive} • {dev.location}
                </span>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          ))}

          {otherDevices.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No other active sessions. Link a computer or tablet above!
            </div>
          )}
        </div>

        {otherDevices.length > 0 && (
          <div style={{ padding: '12px 16px' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', color: 'var(--accent-danger)', borderColor: 'rgba(234, 67, 53, 0.3)' }}
              onClick={handleLogoutAll}
            >
              <LogOut size={16} /> Log Out from All Other Devices
            </button>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="settings-footer-note">
        <ShieldCheck size={16} color="#00a884" style={{ flexShrink: 0 }} />
        <span>Your chats and calls are end-to-end encrypted across every linked device.</span>
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Device Info</h3>
              <button className="icon-btn" onClick={() => setSelectedDevice(null)}>
                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div className="settings-device-icon large">
                  {getPlatformIcon(selectedDevice.platform)}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedDevice.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedDevice.isCurrent ? 'Current Session' : 'Linked Session'}
                  </p>
                </div>
              </div>

              <div className="settings-info-list">
                <div className="settings-info-row">
                  <span>Browser / App</span>
                  <strong>{selectedDevice.browser}</strong>
                </div>
                <div className="settings-info-row">
                  <span>Location</span>
                  <strong>{selectedDevice.location}</strong>
                </div>
                <div className="settings-info-row">
                  <span>IP Address</span>
                  <strong>{selectedDevice.ipAddress}</strong>
                </div>
                <div className="settings-info-row">
                  <span>Status</span>
                  <strong style={{ color: selectedDevice.isCurrent ? '#00a884' : 'var(--text-primary)' }}>
                    {selectedDevice.lastActive}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedDevice(null)}
                >
                  Close
                </button>
                {!selectedDevice.isCurrent && (
                  <button
                    type="button"
                    className="btn"
                    style={{ background: 'rgba(234, 67, 53, 0.15)', color: '#ea4335' }}
                    onClick={() => handleLogoutDevice(selectedDevice.id)}
                  >
                    <LogOut size={16} /> Log Out Device
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link device modal */}
      <LinkDeviceModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface CallModalProps {
  targetName: string;
  isVideo: boolean;
  isIncoming?: boolean;
  onHangup: () => void;
  onAnswer?: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  targetName,
  isVideo: initialIsVideo,
  isIncoming = false,
  onHangup,
  onAnswer
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideo, setIsVideo] = useState(initialIsVideo);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(!isIncoming);

  useEffect(() => {
    let interval: number;
    if (connected) {
      interval = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connected]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="modal-overlay">
      <div className="call-dialog">
        <div className="call-pulse-ring">
          <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
            {targetName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {targetName}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isIncoming && !connected
              ? `Incoming ${isVideo ? 'Video' : 'Voice'} Call...`
              : (connected ? formatDuration(duration) : 'Calling...')}
          </p>
        </div>

        {connected ? (
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button
              className="icon-btn"
              style={{
                width: '46px',
                height: '46px',
                backgroundColor: isMuted ? 'var(--accent-danger)' : 'var(--bg-active)',
                color: '#fff'
              }}
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              className="icon-btn"
              style={{
                width: '46px',
                height: '46px',
                backgroundColor: isVideo ? 'var(--accent-primary)' : 'var(--bg-active)',
                color: isVideo ? '#111b21' : '#fff'
              }}
              onClick={() => setIsVideo(!isVideo)}
              title={isVideo ? 'Turn off video' : 'Turn on video'}
            >
              {isVideo ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              className="btn-hangup"
              onClick={onHangup}
              title="End Call"
            >
              <PhoneOff size={22} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <button
              className="btn-hangup"
              onClick={onHangup}
              title="Decline"
            >
              <PhoneOff size={22} />
            </button>

            {isIncoming && onAnswer && (
              <button
                className="icon-btn"
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#111b21'
                }}
                onClick={() => {
                  setConnected(true);
                  onAnswer();
                }}
                title="Answer"
              >
                <Phone size={22} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

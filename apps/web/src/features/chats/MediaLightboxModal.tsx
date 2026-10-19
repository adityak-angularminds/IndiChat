import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  fileName: string;
  caption?: string;
  senderName?: string;
  timestamp?: string;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  fileName,
  caption,
  senderName,
  timestamp
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
    }
  }, [isOpen, mediaUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl.includes('?') ? `${mediaUrl}&download=true` : `${mediaUrl}?download=true`;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="whatsapp-lightbox-overlay" onClick={onClose}>
      {/* Top Controls Bar */}
      <div className="whatsapp-lightbox-header" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-info">
          <span className="lightbox-sender">{senderName || 'Photo'}</span>
          {timestamp && <span className="lightbox-time">{timestamp}</span>}
        </div>

        <div className="lightbox-actions">
          {mediaType === 'IMAGE' && (
            <>
              <button className="icon-btn" onClick={handleZoomOut} title="Zoom Out" aria-label="Zoom Out">
                <ZoomOut size={20} />
              </button>
              <button className="icon-btn" onClick={handleZoomIn} title="Zoom In" aria-label="Zoom In">
                <ZoomIn size={20} />
              </button>
              <button className="icon-btn" onClick={handleRotate} title="Rotate" aria-label="Rotate">
                <RotateCw size={19} />
              </button>
            </>
          )}
          <button className="icon-btn" onClick={handleDownload} title="Download" aria-label="Download">
            <Download size={20} />
          </button>
          <button className="icon-btn" onClick={onClose} title="Close" aria-label="Close">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Media Canvas */}
      <div className="whatsapp-lightbox-content" onClick={(e) => e.stopPropagation()}>
        {mediaType === 'IMAGE' ? (
          <img
            src={mediaUrl}
            alt={fileName}
            className="lightbox-image"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 200ms ease'
            }}
          />
        ) : (
          <video src={mediaUrl} controls autoPlay className="lightbox-video" />
        )}

        {caption && (
          <div className="lightbox-caption-bar">
            <span>{caption}</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, Check, AlertCircle, Upload } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapturePhoto
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  // Stop current stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerate camera devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (!deviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      const message = err instanceof Error ? err.message : 'Camera could not be accessed.';
      setCameraError(
        message.includes('Permission') || message.includes('denied')
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Unable to connect to camera. Check if another application is using it or upload an image.'
      );
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedPreviewUrl(null);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Horizontal flip mirror if front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      const url = URL.createObjectURL(blob);
      setCapturedPreviewUrl(url);
    }, 'image/jpeg', 0.95);
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
  };

  const handleConfirmPhoto = () => {
    if (!capturedBlob) return;
    const fileName = `photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });
    stopStream();
    onCapturePhoto(file);
    onClose();
  };

  const handleSwitchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startCamera(nextDevice.deviceId);
  };

  const handleFallbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      stopStream();
      onCapturePhoto(file);
      onClose();
    }
  };

  return (
    <div className="whatsapp-camera-overlay" onClick={onClose}>
      <div
        className="whatsapp-camera-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Take Photo"
      >
        {/* Header */}
        <div className="whatsapp-camera-header">
          <div className="camera-header-title">
            <Camera size={20} color="#00a884" />
            <span>Take Photo</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Camera">
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="whatsapp-camera-body">
          {cameraError ? (
            <div className="camera-error-container">
              <AlertCircle size={48} color="#ea4335" />
              <h3>Camera Unavailable</h3>
              <p>{cameraError}</p>
              <button
                className="btn-primary"
                onClick={() => fallbackInputRef.current?.click()}
                style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Upload size={18} />
                Upload Photo Instead
              </button>
              <input
                ref={fallbackInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFallbackFileChange}
              />
            </div>
          ) : capturedPreviewUrl ? (
            <div className="camera-preview-container">
              <img
                src={capturedPreviewUrl}
                alt="Captured Snapshot"
                className="camera-captured-image"
              />
            </div>
          ) : (
            <div className="camera-stream-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-stream mirrored"
              />
              <div className="camera-grid-guide" />
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="whatsapp-camera-footer">
          {capturedPreviewUrl ? (
            <div className="camera-actions-row">
              <button
                className="camera-retake-btn"
                onClick={handleRetake}
                title="Retake photo"
              >
                <RefreshCw size={18} />
                <span>Retake</span>
              </button>
              <button
                className="camera-use-btn"
                onClick={handleConfirmPhoto}
                title="Use this photo"
              >
                <Check size={20} />
                <span>Use Photo</span>
              </button>
            </div>
          ) : (
            !cameraError && (
              <div className="camera-shutter-row">
                {devices.length > 1 && (
                  <button
                    className="icon-btn camera-switch-btn"
                    onClick={handleSwitchCamera}
                    title="Switch Camera"
                  >
                    <RefreshCw size={22} />
                  </button>
                )}
                <button
                  className="camera-shutter-btn"
                  onClick={handleCapture}
                  title="Click to capture"
                  aria-label="Capture photo"
                >
                  <div className="camera-shutter-inner" />
                </button>
                {devices.length > 1 && <div style={{ width: 44 }} />}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

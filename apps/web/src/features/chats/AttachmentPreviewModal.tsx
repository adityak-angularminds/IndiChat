import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, FileText, FileArchive, FileCode, FileSpreadsheet, Film, Music, File } from 'lucide-react';
import { api } from '../../services/api';
import { MessageType } from '@chat/shared-types';
import { EmojiPicker } from './EmojiPicker';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onSendAttachment: (payload: {
    content: string; // JSON containing fileUrl, fileName, fileSize, mimeType, caption
    messageType: MessageType;
  }) => Promise<void>;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileCategory(file: File): MessageType {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) {
    return 'IMAGE';
  }
  if (type.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi|wmv)$/i.test(name)) {
    return 'VIDEO';
  }
  if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) {
    return 'AUDIO';
  }
  return 'DOCUMENT';
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase();
  }
  return 'FILE';
}

export function getFileIconAndBadgeColor(ext: string) {
  const e = ext.toUpperCase();
  if (['PDF'].includes(e)) return { icon: FileText, color: '#ea4335', bg: '#fce8e6' };
  if (['DOC', 'DOCX', 'TXT', 'RTF', 'ODT'].includes(e)) return { icon: FileText, color: '#1a73e8', bg: '#e8f0fe' };
  if (['XLS', 'XLSX', 'CSV', 'ODS'].includes(e)) return { icon: FileSpreadsheet, color: '#0f9d58', bg: '#e6f4ea' };
  if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(e)) return { icon: FileArchive, color: '#f29900', bg: '#fef7e0' };
  if (['JS', 'TS', 'PY', 'JAVA', 'HTML', 'CSS', 'JSON', 'SQL', 'C', 'CPP', 'SH'].includes(e)) return { icon: FileCode, color: '#a142f4', bg: '#f3e8fd' };
  if (['MP4', 'MKV', 'MOV', 'AVI'].includes(e)) return { icon: Film, color: '#e53935', bg: '#ffebee' };
  if (['MP3', 'WAV', 'OGG', 'M4A'].includes(e)) return { icon: Music, color: '#ff6d00', bg: '#fff3e0' };
  return { icon: File, color: '#00a884', bg: '#e0f2f1' };
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  files,
  onClose,
  onSendAttachment
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate object URLs for preview
  useEffect(() => {
    if (!isOpen || files.length === 0) {
      setObjectUrls({});
      return;
    }

    const urls: Record<number, string> = {};
    files.forEach((f, idx) => {
      urls[idx] = URL.createObjectURL(f);
    });
    setObjectUrls(urls);
    setSelectedIndex(0);
    setCaption('');
    setUploadError(null);

    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [isOpen, files]);

  // Focus caption input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, selectedIndex]);

  // Handle escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || files.length === 0) return null;

  const currentFile = files[selectedIndex] || files[0];
  const currentCategory = getFileCategory(currentFile);
  const currentObjectUrl = objectUrls[selectedIndex] || '';
  const currentExt = getFileExtension(currentFile.name);
  const { icon: FileBadgeIcon, color: badgeColor } = getFileIconAndBadgeColor(currentExt);

  const handleSend = async () => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Upload file to backend server
      const uploadRes = await api.uploadFile(currentFile);

      // 2. Prepare JSON message content
      const attachmentPayload = {
        fileId: uploadRes.fileId,
        fileName: uploadRes.fileName,
        fileType: uploadRes.fileType,
        mimeType: uploadRes.mimeType,
        fileSize: uploadRes.fileSize,
        fileUrl: uploadRes.fileUrl,
        caption: caption.trim()
      };

      const messageContent = JSON.stringify(attachmentPayload);

      // 3. Send message via ChatWindow
      await onSendAttachment({
        content: messageContent,
        messageType: uploadRes.fileType
      });

      onClose();
    } catch (err: unknown) {
      console.error('Failed to upload & send attachment:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="whatsapp-preview-overlay" onClick={onClose}>
      <div
        className="whatsapp-preview-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Attachment Preview"
      >
        {/* Header */}
        <div className="whatsapp-preview-header">
          <button className="icon-btn" onClick={onClose} aria-label="Cancel" title="Cancel">
            <X size={22} />
          </button>
          <div className="whatsapp-preview-header-info">
            <span className="preview-filename">{currentFile.name}</span>
            <span className="preview-filesize">{formatFileSize(currentFile.size)}</span>
          </div>
          {files.length > 1 && (
            <span className="preview-counter">
              {selectedIndex + 1} of {files.length}
            </span>
          )}
        </div>

        {/* Center Preview Content */}
        <div className="whatsapp-preview-body">
          {currentCategory === 'IMAGE' && currentObjectUrl ? (
            <div className="preview-media-container image">
              <img src={currentObjectUrl} alt={currentFile.name} className="preview-image" />
            </div>
          ) : currentCategory === 'VIDEO' && currentObjectUrl ? (
            <div className="preview-media-container video">
              <video src={currentObjectUrl} controls autoPlay className="preview-video" />
            </div>
          ) : currentCategory === 'AUDIO' && currentObjectUrl ? (
            <div className="preview-document-card audio-preview">
              <div className="preview-file-icon-box" style={{ borderColor: badgeColor }}>
                <Music size={48} color={badgeColor} />
              </div>
              <h3 className="preview-doc-title">{currentFile.name}</h3>
              <p className="preview-doc-size">{formatFileSize(currentFile.size)} • Audio</p>
              <audio src={currentObjectUrl} controls style={{ marginTop: '16px', width: '100%', maxWidth: '360px' }} />
            </div>
          ) : (
            /* Document / Any File Format */
            <div className="preview-document-card">
              <div className="preview-file-icon-box" style={{ borderColor: badgeColor }}>
                <FileBadgeIcon size={48} color={badgeColor} />
                <span className="preview-extension-badge" style={{ backgroundColor: badgeColor }}>
                  {currentExt}
                </span>
              </div>
              <h3 className="preview-doc-title">{currentFile.name}</h3>
              <p className="preview-doc-size">
                {formatFileSize(currentFile.size)} • {currentExt} File
              </p>
              <span className="preview-note">Any file format is supported and ready to send</span>
            </div>
          )}

          {uploadError && (
            <div className="preview-error-toast">
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Multi-file thumbnail strip */}
        {files.length > 1 && (
          <div className="preview-thumbnails-strip">
            {files.map((file, idx) => {
              const cat = getFileCategory(file);
              const url = objectUrls[idx];
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`preview-thumb-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  {cat === 'IMAGE' && url ? (
                    <img src={url} alt={file.name} className="thumb-img" />
                  ) : (
                    <div className="thumb-doc">
                      <span>{getFileExtension(file.name)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Emoji Picker Popup */}
        {showEmoji && (
          <EmojiPicker
            style={{ bottom: '84px', left: '24px' }}
            onSelectEmoji={(emoji) => setCaption((prev) => prev + emoji)}
            onClose={() => setShowEmoji(false)}
          />
        )}

        {/* Bottom Input & WhatsApp Send Action */}
        <div className="whatsapp-preview-footer">
          <div className="preview-input-container">
            <button
              type="button"
              className="icon-btn preview-emoji-toggle"
              onClick={() => setShowEmoji(!showEmoji)}
              title="Add Emoji"
              aria-label="Add Emoji"
            >
              <Smile size={22} />
            </button>
            <input
              ref={inputRef}
              type="text"
              className="preview-caption-input"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isUploading}
            />
          </div>

          <button
            type="button"
            className="whatsapp-preview-send-btn"
            onClick={handleSend}
            disabled={isUploading}
            title="Send (Enter)"
            aria-label="Send attachment"
          >
            {isUploading ? (
              <div className="send-spinner" />
            ) : (
              <Send size={20} color="#ffffff" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

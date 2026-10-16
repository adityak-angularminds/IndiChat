import React, { useState } from 'react';
import { api } from '../../services/api';
import { User, AuthResponse } from '@chat/shared-types';
import { MessageSquare, UserCheck, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onAuthenticated: (response: AuthResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          username,
          password,
          displayName: displayName || username,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
        });
        localStorage.setItem('chat_access_token', res.tokens.accessToken);
        localStorage.setItem('chat_refresh_token', res.tokens.refreshToken);
        onAuthenticated(res);
      } else {
        const res = await api.login({
          usernameOrEmail: username,
          password,
        });
        localStorage.setItem('chat_access_token', res.tokens.accessToken);
        localStorage.setItem('chat_refresh_token', res.tokens.refreshToken);
        onAuthenticated(res);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, name: string) => {
    setUsername(uname);
    setPassword('Password123!');
    setDisplayName(name);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', padding: '28px 24px 16px 24px', background: 'linear-gradient(180deg, #182229 0%, #111b21 100%)' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#00a884',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111b21',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(0, 168, 132, 0.4)'
          }}>
            <MessageSquare size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            WhatsApp Messenger
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isRegister ? 'Create an account to start messaging' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{
              backgroundColor: 'rgba(234, 67, 53, 0.15)',
              color: '#ff6b6b',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name / Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alice Cooper"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{isRegister ? 'Username' : 'Username or Email'}</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. alice"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Email (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>

          {/* Demo helper */}
          <div style={{
            background: 'var(--bg-chat-header)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginTop: '4px',
            border: '1px dashed var(--border-color)'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              QUICK TEST PROFILES (Click to auto-fill):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => handleQuickLogin('alice', 'Alice')}
              >
                Alice
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => handleQuickLogin('bob', 'Bob')}
              >
                Bob
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => handleQuickLogin('charlie', 'Charlie')}
              >
                Charlie
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

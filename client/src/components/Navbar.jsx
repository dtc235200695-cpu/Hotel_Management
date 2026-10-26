import React, { useState, useEffect } from 'react';
import { Crown, Cloud, Shield, RefreshCw, UserCheck, Bell, Database, Globe, LogIn, LogOut, Key, User, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function Navbar({ currentUser, onRoleChange, onRefreshData, onSwitchToPublic, onUserLogin }) {
  const [cloudStatus, setCloudStatus] = useState({
    latencyMs: 12,
    status: 'ONLINE',
    provider: 'Cloudflare D1 / Cloud API'
  });
  const [isPinging, setIsPinging] = useState(false);

  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchCloudStatus = async () => {
    try {
      setIsPinging(true);
      const start = Date.now();
      const res = await fetch('/api/cloud/status');
      const data = await res.json();
      const ping = Date.now() - start;
      setCloudStatus({ ...data, latencyMs: ping });
    } catch (err) {
      setCloudStatus(prev => ({ ...prev, status: 'OFFLINE' }));
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    fetchCloudStatus();
    const timer = setInterval(fetchCloudStatus, 25000);
    return () => clearInterval(timer);
  }, []);

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập không thành công');

      alert(`Đăng nhập thành công! Chào mừng ${data.user.full_name} (${data.user.role})`);
      setIsLoginModalOpen(false);
      if (onUserLogin) {
        onUserLogin(data.user);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick fill accounts
  const quickFill = (u, p) => {
    setLoginUsername(u);
    setLoginPassword(p);
  };

  return (
    <>
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <Crown size={24} />
          </div>
          <div>
            <h1 className="brand-title">HotelCloud</h1>
            <p className="brand-subtitle">Hệ Thống Quản Lý Khách Sạn Cao Cấp</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Switch to Public Website */}
          <button 
            id="btn-switch-to-public-website"
            className="btn btn-gold btn-sm"
            onClick={onSwitchToPublic}
            title="Xem Website Đặt Phòng Khách Hàng Công Khai"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Globe size={14} />
            <span>Website Khách Hàng</span>
          </button>

          {/* Cloud Edge Status Pill */}
          <div 
            className="cloud-pill" 
            title="Kết nối cơ sở dữ liệu Cloud tập trung - Bấm để kiểm tra độ trễ"
            style={{ cursor: 'pointer' }}
            onClick={fetchCloudStatus}
          >
            <div className="dot" style={{ background: cloudStatus.status === 'ONLINE' ? '#10b981' : '#ef4444' }}></div>
            <Cloud size={14} />
            <span>Cloud Edge: {cloudStatus.latencyMs}ms</span>
            <RefreshCw size={12} className={isPinging ? 'spin-anim' : ''} />
          </div>

          {/* Global Refresh Data */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onRefreshData}
            title="Làm mới dữ liệu từ Cloud"
          >
            <RefreshCw size={14} />
            <span>Đồng bộ</span>
          </button>

          {/* Fast Role Switcher */}
          <div className="role-badge-box">
            <Shield size={16} color="#d4af37" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Vai trò:</span>
            <select 
              id="role-switcher-select"
              className="role-select"
              value={currentUser.role}
              onChange={(e) => onRoleChange(e.target.value)}
            >
              <option value="ADMIN">Quản Trị Viên (Admin)</option>
              <option value="RECEPTIONIST">Lễ Tân (Receptionist)</option>
              <option value="MANAGER">Quản Lý (Manager)</option>
            </select>
          </div>

          {/* User Profile & Login Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '0.875rem'
            }}>
              {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>
            <div style={{ display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.full_name}</div>
              <div style={{ fontSize: '0.7rem', color: '#d4af37' }}>{currentUser.role}</div>
            </div>

            {/* Login / Switch Account Button */}
            <button
              id="navbar-login-btn"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.4rem 0.65rem' }}
              onClick={() => { setLoginError(''); setIsLoginModalOpen(true); }}
              title="Đăng nhập tài khoản nhân viên / quản lý"
            >
              <LogIn size={14} />
              <span>Đăng Nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLoginModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <LogIn size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    Đăng Nhập Hệ Thống
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#d4af37', margin: 0 }}>
                    Xác thực tài khoản nhân sự HotelCloud
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsLoginModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loginError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.65rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={15} />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Tên đăng nhập (Username)</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      id="login-username-input"
                      type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '36px' }}
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      placeholder="admin, receptionist, manager..."
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu (Password)</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      id="login-password-input"
                      type="password" 
                      className="form-input" 
                      style={{ paddingLeft: '36px' }}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Quick Account Fill for Demo / Grading */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Tài khoản mẫu thử nghiệm nhanh:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => quickFill('admin', 'admin123')}
                    >
                      Admin
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => quickFill('receptionist', 'rec123')}
                    >
                      Lễ Tân
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => quickFill('manager', 'mgr123')}
                    >
                      Quản Lý
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsLoginModalOpen(false)}>
                  Hủy
                </button>
                <button id="submit-login-btn" type="submit" className="btn btn-gold" disabled={isLoggingIn}>
                  <CheckCircle size={15} />
                  <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

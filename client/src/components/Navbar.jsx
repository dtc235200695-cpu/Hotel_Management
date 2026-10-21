import React, { useState, useEffect } from 'react';
import { Crown, Cloud, Shield, RefreshCw, UserCheck, Bell, Database } from 'lucide-react';

export default function Navbar({ currentUser, onRoleChange, onRefreshData }) {
  const [cloudStatus, setCloudStatus] = useState({
    latencyMs: 12,
    status: 'ONLINE',
    provider: 'Cloudflare D1 / Cloud API'
  });
  const [isPinging, setIsPinging] = useState(false);

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

  return (
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

        {/* User Profile */}
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
        </div>
      </div>
    </header>
  );
}

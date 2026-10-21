import React, { useState } from 'react';
import { Users, Plus, Shield, Check, X, Phone, Mail, UserCheck } from 'lucide-react';

export default function UserManager({ users, onUserCreated, currentUserRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('RECEPTIONIST');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, full_name: fullName, role, email, phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onUserCreated();
      setIsModalOpen(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="status-badge reserved" style={{ color: '#d4af37', borderColor: '#d4af37' }}>Quản Trị Viên (Admin)</span>;
      case 'MANAGER':
        return <span className="status-badge available" style={{ color: '#a855f7', borderColor: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>Quản Lý (Manager)</span>;
      default:
        return <span className="status-badge cleaning" style={{ color: '#38bdf8', borderColor: '#38bdf8' }}>Lễ Tân (Receptionist)</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card gold-border" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#d4af37" />
              Danh Sách Tài Khoản & Phân Quyền Nhân Sự
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Quản lý tài khoản đăng nhập, vai trò Admin, Receptionist, Manager
            </p>
          </div>

          <button 
            id="open-create-user-btn"
            className="btn btn-gold"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Thêm Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-light)', color: '#94a3b8' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Tên Nhân Viên</th>
                <th style={{ padding: '1rem 1.25rem' }}>Tên Đăng Nhập</th>
                <th style={{ padding: '1rem 1.25rem' }}>Vai Trò Phân Quyền</th>
                <th style={{ padding: '1rem 1.25rem' }}>Liên Hệ</th>
                <th style={{ padding: '1rem 1.25rem' }}>Ngày Tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#f8fafc' }}>
                    {u.full_name}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#f3e5ab' }}>
                    {u.username}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {getRoleBadge(u.role)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{u.phone || 'Chưa cập nhật'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                    {u.created_at ? u.created_at.split(' ')[0] : 'Ban đầu'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal create user */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Thêm Tài Khoản Nhân Viên Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Họ và tên nhân viên *</label>
                  <input 
                    id="new-user-fullname"
                    type="text" 
                    className="form-input" 
                    placeholder="Nguyễn Văn B" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tên đăng nhập (Username) *</label>
                    <input 
                      id="new-user-username"
                      type="text" 
                      className="form-input" 
                      placeholder="letan_02" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mật khẩu *</label>
                    <input 
                      id="new-user-password"
                      type="password" 
                      className="form-input" 
                      placeholder="******" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phân quyền vai trò</label>
                  <select 
                    id="new-user-role"
                    className="form-select" 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="RECEPTIONIST">Lễ Tân (Receptionist) - Đặt phòng, Check-in/out, Dịch vụ</option>
                    <option value="MANAGER">Quản Lý (Manager) - Báo cáo doanh thu, Dịch vụ</option>
                    <option value="ADMIN">Quản Trị Viên (Admin) - Toàn quyền cấu hình</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input 
                      id="new-user-phone"
                      type="tel" 
                      className="form-input" 
                      placeholder="09xx..." 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      id="new-user-email"
                      type="email" 
                      className="form-input" 
                      placeholder="staff@hotelcloud.vn" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button id="save-new-user-btn" type="submit" className="btn btn-gold" disabled={loading}>
                  <Check size={16} />
                  <span>{loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

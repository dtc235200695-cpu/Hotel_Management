import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash2, History, Phone, Mail, 
  MapPin, CreditCard, Calendar, CheckCircle, Clock, X, AlertCircle, 
  FileText, Star, Award, Shield, DollarSign
} from 'lucide-react';

export default function CustomersManager({ currentUserRole }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    identity_card: '',
    phone: '',
    email: '',
    address: '',
    nationality: 'Việt Nam',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch customers list
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = searchTerm.trim() 
        ? `/api/customers?search=${encodeURIComponent(searchTerm.trim())}` 
        : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      identity_card: '',
      phone: '',
      email: '',
      address: '',
      nationality: 'Việt Nam',
      notes: ''
    });
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      full_name: c.full_name || '',
      identity_card: c.identity_card || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      nationality: c.nationality || 'Việt Nam',
      notes: c.notes || ''
    });
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      setFormError('Vui lòng điền Họ và tên cùng Số điện thoại của khách');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi lưu khách hàng');
      }

      setIsAddEditModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Customer History
  const handleViewHistory = async (customer) => {
    try {
      setHistoryLoading(true);
      setIsHistoryModalOpen(true);
      setSelectedCustomerHistory(null);

      const res = await fetch(`/api/customers/${customer.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedCustomerHistory(data);
    } catch (err) {
      alert('Lỗi tải lịch sử lưu trú: ' + err.message);
      setIsHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (c) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ khách hàng "${c.full_name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      fetchCustomers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Determine VIP badge
  const getVipBadge = (staysCount) => {
    if (staysCount >= 5) {
      return { label: 'Khách VIP Hoàng Gia', color: '#d4af37', bg: 'rgba(212, 175, 55, 0.15)', icon: Award };
    }
    if (staysCount >= 2) {
      return { label: 'Khách Thân Thiết', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', icon: Star };
    }
    return { label: 'Khách Mới', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: Users };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Stats Banner */}
      <div className="glass-card gold-border" style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'var(--gold-gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#080d1a',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
            }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#f8fafc', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                Hồ Sơ Khách Hàng & Lịch Sử Lưu Trú
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#d4af37', margin: 0 }}>
                Quản lý thông tin định danh, lịch sử nhận phòng, đặt phòng và doanh thu chi tiêu
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              id="add-customer-btn"
              onClick={handleOpenAddModal}
              className="btn btn-gold"
              style={{ fontWeight: 700 }}
            >
              <Plus size={16} />
              <span>Thêm Khách Hàng Mới</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tổng Số Khách Hàng</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
              {customers.length} khách
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Khách Thân Thiết & VIP</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f3e5ab' }}>
              {customers.filter(c => c.stays_count >= 2).length} khách
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tổng Số Lượt Lưu Trú</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>
              {customers.reduce((acc, c) => acc + (c.stays_count || 0), 0)} lượt
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Doanh Thu Từ Khách Đã Thanh Toán</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d4af37' }}>
              {customers.reduce((acc, c) => acc + (c.total_spent || 0), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            id="search-customer-input"
            type="text"
            className="form-input"
            placeholder="Tìm kiếm khách hàng theo Họ tên, Số điện thoại, Số CCCD / Hộ chiếu, Email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>
        {searchTerm && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setSearchTerm('')}
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* Customers Table / Grid */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#d4af37' }}>
                <th style={{ padding: '1rem' }}>Mã / Khách Hàng</th>
                <th style={{ padding: '1rem' }}>Liên Hệ & Định Danh</th>
                <th style={{ padding: '1rem' }}>Phân Hạng</th>
                <th style={{ padding: '1rem' }}>Số Lượt Lưu Trú</th>
                <th style={{ padding: '1rem' }}>Tổng Chi Tiêu</th>
                <th style={{ padding: '1rem' }}>Lần Ở Gần Nhất</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    Đang tải dữ liệu hồ sơ khách hàng...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Không tìm thấy hồ sơ khách hàng nào phù hợp với từ khóa "{searchTerm}"
                  </td>
                </tr>
              ) : (
                customers.map(c => {
                  const badge = getVipBadge(c.stays_count);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr 
                      key={c.id} 
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: badge.bg, color: badge.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, border: `1px solid ${badge.color}`
                          }}>
                            {c.full_name ? c.full_name.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{c.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mã KH: #{c.id} • {c.nationality || 'Việt Nam'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                          <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={12} color="#10b981" /> {c.phone}
                          </span>
                          <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CreditCard size={12} color="#d4af37" /> CCCD: {c.identity_card || 'Chưa cập nhật'}
                          </span>
                          {c.email && (
                            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Mail size={12} /> {c.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* VIP Badge */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.color}`,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          <BadgeIcon size={12} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Stays Count */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {c.stays_count || 0} lần lưu trú
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {c.bookings_count || 0} đơn đặt phòng
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ color: '#f3e5ab', fontSize: '0.95rem' }}>
                          {(c.total_spent || 0).toLocaleString('vi-VN')} đ
                        </strong>
                      </td>

                      {/* Last Stay */}
                      <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                        {c.last_stay_date ? (
                          <span>{new Date(c.last_stay_date).toLocaleDateString('vi-VN')}</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Chưa có</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewHistory(c)}
                            title="Xem lịch sử lưu trú và đơn đặt phòng"
                            style={{ padding: '0.4rem 0.65rem' }}
                          >
                            <History size={14} color="#60a5fa" />
                            <span>Lịch Sử</span>
                          </button>

                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditModal(c)}
                            title="Chỉnh sửa thông tin khách"
                            style={{ padding: '0.4rem 0.65rem' }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {currentUserRole === 'ADMIN' && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeleteCustomer(c)}
                              title="Xóa hồ sơ khách"
                              style={{ padding: '0.4rem 0.65rem', color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    {editingCustomer ? 'Chỉnh Sửa Hồ Sơ Khách Hàng' : 'Thêm Hồ Sơ Khách Hàng Mới'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#d4af37', margin: 0 }}>
                    Hệ thống quản lý khách lưu trú HotelCloud
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Họ và tên khách hàng *</label>
                    <input 
                      id="cust-form-name"
                      type="text" 
                      className="form-input" 
                      placeholder="Nguyễn Văn A" 
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại *</label>
                    <input 
                      id="cust-form-phone"
                      type="tel" 
                      className="form-input" 
                      placeholder="0912 345 678" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số CCCD / Hộ chiếu</label>
                    <input 
                      id="cust-form-id"
                      type="text" 
                      className="form-input" 
                      placeholder="00120100xxxx" 
                      value={formData.identity_card}
                      onChange={e => setFormData({ ...formData, identity_card: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      id="cust-form-email"
                      type="email" 
                      className="form-input" 
                      placeholder="khach@example.com" 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Địa chỉ thường trú</label>
                    <input 
                      id="cust-form-address"
                      type="text" 
                      className="form-input" 
                      placeholder="Hà Nội, TP.HCM..." 
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quốc tịch</label>
                    <input 
                      id="cust-form-nationality"
                      type="text" 
                      className="form-input" 
                      placeholder="Việt Nam" 
                      value={formData.nationality}
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú sở thích / Thói quen lưu trú</label>
                  <textarea 
                    id="cust-form-notes"
                    className="form-textarea" 
                    rows={2}
                    placeholder="Ví dụ: Thích phòng tầng cao, dị ứng hoa ly, khách công tác thường xuyên..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddEditModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : editingCustomer ? 'Cập Nhật Hồ Sơ' : 'Lưu Hồ Sơ Khách Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CUSTOMER STAY & BOOKING HISTORY */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '750px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    Lịch Sử Lưu Trú Của Khách Hàng
                  </h3>
                  {selectedCustomerHistory && (
                    <p style={{ fontSize: '0.8rem', color: '#d4af37', margin: 0 }}>
                      {selectedCustomerHistory.customer.full_name} • SĐT: {selectedCustomerHistory.customer.phone}
                    </p>
                  )}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsHistoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {historyLoading || !selectedCustomerHistory ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Đang tải thông tin lịch sử lưu trú...
                </div>
              ) : (
                <>
                  {/* Summary Card */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.85rem'
                  }}>
                    <div>Họ và tên: <strong style={{ color: '#fff' }}>{selectedCustomerHistory.customer.full_name}</strong></div>
                    <div>Số CCCD: <strong style={{ color: '#fff' }}>{selectedCustomerHistory.customer.identity_card}</strong></div>
                    <div>Điện thoại: <strong style={{ color: '#10b981' }}>{selectedCustomerHistory.customer.phone}</strong></div>
                    <div>Email: <strong style={{ color: '#cbd5e1' }}>{selectedCustomerHistory.customer.email || 'Chưa có'}</strong></div>
                  </div>

                  {/* Section: Stays History */}
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#f3e5ab', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={16} color="#d4af37" />
                      Lịch Sử Các Kỳ Lưu Trú Thực Tế ({selectedCustomerHistory.stays.length})
                    </h4>

                    {selectedCustomerHistory.stays.length === 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                        Khách hàng chưa có kỳ lưu trú hoàn thành nào
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {selectedCustomerHistory.stays.map(s => (
                          <div 
                            key={s.id} 
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              padding: '0.85rem 1rem',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div>
                              <div>
                                Phòng <strong style={{ color: '#f3e5ab' }}>{s.room_number}</strong> ({s.room_type_name}) • Tầng {s.floor}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                Check-in: {new Date(s.actual_check_in).toLocaleString('vi-VN')} {s.actual_check_out && `• Check-out: ${new Date(s.actual_check_out).toLocaleString('vi-VN')}`}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: s.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: s.status === 'ACTIVE' ? '#ef4444' : '#10b981'
                              }}>
                                {s.status === 'ACTIVE' ? 'Đang Ở' : 'Đã Trả Phòng'}
                              </span>
                              {s.final_amount && (
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3e5ab', marginTop: '0.25rem' }}>
                                  {s.final_amount.toLocaleString('vi-VN')} đ
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section: Bookings History */}
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#f3e5ab', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={16} color="#d4af37" />
                      Lịch Sử Các Đơn Đặt Phòng ({selectedCustomerHistory.bookings.length})
                    </h4>

                    {selectedCustomerHistory.bookings.length === 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                        Chưa có đơn đặt phòng nào
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {selectedCustomerHistory.bookings.map(b => (
                          <div 
                            key={b.id}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              padding: '0.85rem 1rem',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div>
                              <div>Mã: <strong style={{ color: '#f3e5ab' }}>{b.booking_code}</strong> • Phòng {b.room_number} ({b.room_type_name})</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                Thời gian: {b.check_in_date} đến {b.check_out_date} ({b.guests_count} khách)
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: b.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : b.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: b.status === 'CONFIRMED' ? '#10b981' : b.status === 'CANCELLED' ? '#ef4444' : '#60a5fa'
                              }}>
                                {b.status}
                              </span>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3e5ab', marginTop: '0.25rem' }}>
                                {b.total_estimated_price?.toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { 
  Calendar, Search, Filter, Plus, CheckCircle, XCircle, 
  Clock, LogIn, Phone, User, AlertCircle, Edit2, X, Bed, DollarSign
} from 'lucide-react';

export default function BookingManager({ 
  bookings, 
  rooms = [],
  onOpenNewBookingModal, 
  onCheckInFromBooking, 
  onCancelBooking,
  onBookingUpdated,
  userRole 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Booking Modal
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    guests_count: 1,
    deposit_amount: 0,
    special_requests: ''
  });
  const [editError, setEditError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = b.booking_code.toLowerCase().includes(q);
      const matchName = b.customer_name?.toLowerCase().includes(q);
      const matchPhone = b.customer_phone?.toLowerCase().includes(q);
      const matchRoom = b.room_number?.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchPhone && !matchRoom) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="status-badge reserved">Đã Xác Nhận</span>;
      case 'CHECKED_IN':
        return <span className="status-badge occupied">Đã Nhận Phòng</span>;
      case 'CHECKED_OUT':
        return <span className="status-badge available">Đã Trả Phòng</span>;
      case 'CANCELLED':
        return <span className="status-badge maintenance">Đã Hủy</span>;
      default:
        return <span className="status-badge available">{status}</span>;
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (b) => {
    setEditingBooking(b);
    setEditFormData({
      room_id: b.room_id ? b.room_id.toString() : '',
      check_in_date: b.check_in_date || '',
      check_out_date: b.check_out_date || '',
      guests_count: b.guests_count || 1,
      deposit_amount: b.deposit_amount || 0,
      special_requests: b.special_requests || ''
    });
    setEditError('');
  };

  // Submit Edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.room_id || !editFormData.check_in_date || !editFormData.check_out_date) {
      setEditError('Vui lòng chọn phòng và khoảng thời gian');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError('');

    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: parseInt(editFormData.room_id, 10),
          check_in_date: editFormData.check_in_date,
          check_out_date: editFormData.check_out_date,
          guests_count: parseInt(editFormData.guests_count, 10),
          deposit_amount: parseInt(editFormData.deposit_amount, 10) || 0,
          special_requests: editFormData.special_requests
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật đơn đặt phòng thất bại');
      }

      alert('Đã cập nhật đơn đặt phòng thành công!');
      setEditingBooking(null);
      if (onBookingUpdated) onBookingUpdated();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Bar */}
      <div className="glass-card gold-border" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              id="booking-search-input"
              type="text"
              placeholder="Tìm theo mã đặt phòng, tên khách, số điện thoại, phòng..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Status */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#d4af37" />
            <select 
              id="booking-status-filter"
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CONFIRMED">Chờ nhận phòng (Confirmed)</option>
              <option value="CHECKED_IN">Đã nhận phòng (Checked-in)</option>
              <option value="CHECKED_OUT">Đã hoàn tất (Checked-out)</option>
              <option value="CANCELLED">Đã hủy (Cancelled)</option>
            </select>
          </div>

          {/* Button New Booking */}
          <button 
            id="open-new-booking-btn"
            className="btn btn-gold"
            onClick={onOpenNewBookingModal}
          >
            <Plus size={16} />
            <span>Tạo Đặt Phòng Mới</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600 }}>Mã Đặt Phòng</th>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600 }}>Khách Hàng</th>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600 }}>Phòng</th>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600 }}>Khoảng Thời Gian</th>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600 }}>Giá Dự Kiến</th>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600 }}>Trạng Thái</th>
                <th style={{ padding: '1rem 1.25rem', color: '#d4af37', fontWeight: 600, textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Không có đơn đặt phòng nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr 
                    key={b.id} 
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Code */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#f3e5ab' }}>{b.booking_code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Tạo lúc: {new Date(b.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{b.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={12} color="#10b981" />
                        <span>{b.customer_phone}</span>
                      </div>
                    </td>

                    {/* Room */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>Phòng {b.room_number}</div>
                      <div style={{ fontSize: '0.75rem', color: '#d4af37' }}>{b.room_type_name}</div>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                        {b.check_in_date} ➔ {b.check_out_date}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {b.guests_count} khách
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                        {b.total_estimated_price ? b.total_estimated_price.toLocaleString('vi-VN') : 0} đ
                      </div>
                      {b.deposit_amount > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                          Cọc: {b.deposit_amount.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {getStatusBadge(b.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {b.status === 'CONFIRMED' && (
                          <>
                            <button 
                              className="btn btn-success btn-sm"
                              title="Nhận phòng cho khách ngay"
                              onClick={() => onCheckInFromBooking(b)}
                              style={{ padding: '0.4rem 0.65rem' }}
                            >
                              <LogIn size={14} />
                              <span>Check-in</span>
                            </button>

                            <button 
                              className="btn btn-secondary btn-sm"
                              title="Chỉnh sửa thông tin đơn đặt phòng"
                              onClick={() => handleOpenEdit(b)}
                              style={{ padding: '0.4rem 0.65rem' }}
                            >
                              <Edit2 size={14} />
                            </button>

                            <button 
                              className="btn btn-secondary btn-sm"
                              title="Hủy đơn đặt phòng này"
                              onClick={() => onCancelBooking(b.id)}
                              style={{ padding: '0.4rem 0.65rem', color: '#ef4444' }}
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}

                        {b.status === 'CHECKED_IN' && (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                            Đang lưu trú
                          </span>
                        )}

                        {b.status === 'CHECKED_OUT' && (
                          <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
                            Đã hoàn tất
                          </span>
                        )}

                        {b.status === 'CANCELLED' && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="modal-backdrop" onClick={() => setEditingBooking(null)}>
          <div className="modal-content" style={{ maxWidth: '580px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.2)', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    Cập Nhật Đơn Đặt Phòng
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#d4af37', margin: 0 }}>
                    Mã: {editingBooking.booking_code} • Khách: {editingBooking.customer_name}
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingBooking(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {editError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Room selection */}
                <div className="form-group">
                  <label className="form-label">Chọn phòng</label>
                  <select 
                    id="edit-booking-room-select"
                    className="form-select"
                    value={editFormData.room_id}
                    onChange={e => setEditFormData({ ...editFormData, room_id: e.target.value })}
                    required
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.room_number} (Tầng {r.floor} - {r.type_name}) - {r.base_price?.toLocaleString('vi-VN')} đ/đêm
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Ngày nhận phòng (Check-in)</label>
                    <input 
                      id="edit-booking-checkin"
                      type="date"
                      className="form-input"
                      value={editFormData.check_in_date}
                      onChange={e => setEditFormData({ ...editFormData, check_in_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày trả phòng (Check-out)</label>
                    <input 
                      id="edit-booking-checkout"
                      type="date"
                      className="form-input"
                      value={editFormData.check_out_date}
                      min={editFormData.check_in_date}
                      onChange={e => setEditFormData({ ...editFormData, check_out_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Guests & Deposit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số lượng khách</label>
                    <input 
                      id="edit-booking-guests"
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={editFormData.guests_count}
                      onChange={e => setEditFormData({ ...editFormData, guests_count: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiền đặt cọc trước (VNĐ)</label>
                    <input 
                      id="edit-booking-deposit"
                      type="number"
                      step="50000"
                      className="form-input"
                      value={editFormData.deposit_amount}
                      onChange={e => setEditFormData({ ...editFormData, deposit_amount: e.target.value })}
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div className="form-group">
                  <label className="form-label">Yêu cầu đặc biệt & Ghi chú</label>
                  <textarea 
                    id="edit-booking-requests"
                    className="form-textarea"
                    rows={2}
                    value={editFormData.special_requests}
                    onChange={e => setEditFormData({ ...editFormData, special_requests: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingBooking(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-gold" disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

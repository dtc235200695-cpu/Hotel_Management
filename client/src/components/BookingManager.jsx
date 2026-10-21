import React, { useState } from 'react';
import { 
  Calendar, Search, Filter, Plus, CheckCircle, XCircle, 
  Clock, LogIn, Phone, User, AlertCircle 
} from 'lucide-react';

export default function BookingManager({ 
  bookings, 
  onOpenNewBookingModal, 
  onCheckInFromBooking, 
  onCancelBooking,
  userRole 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-light)', color: '#94a3b8' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Mã Đặt Phòng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Khách Hàng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Phòng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Lịch Lưu Trú</th>
                <th style={{ padding: '1rem 1.25rem' }}>Dự Kiến (VNĐ)</th>
                <th style={{ padding: '1rem 1.25rem' }}>Trạng Thái</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <AlertCircle size={36} color="#d4af37" style={{ margin: '0 auto 0.5rem' }} />
                    <div>Không tìm thấy đơn đặt phòng nào</div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr 
                    key={b.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Code */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#f3e5ab' }}>{b.booking_code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Tạo lúc: {b.created_at ? b.created_at.split(' ')[0] : 'N/A'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={14} color="#d4af37" />
                        <span>{b.customer_name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <Phone size={12} />
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
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {b.status === 'CONFIRMED' && (
                          <>
                            <button 
                              className="btn btn-success btn-sm"
                              title="Nhận phòng cho khách ngay"
                              onClick={() => onCheckInFromBooking(b)}
                            >
                              <LogIn size={14} />
                              <span>Check-in</span>
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              title="Hủy đơn đặt phòng này"
                              onClick={() => onCancelBooking(b.id)}
                            >
                              <XCircle size={14} />
                              <span>Hủy</span>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, DollarSign, User, Phone, FileText, 
  CheckCircle2, AlertTriangle, ShieldCheck, Bed, Users, Check 
} from 'lucide-react';

const defaultRoomTypes = [
  { id: 'STD', name: 'Standard Queen', base_price: 450000, capacity: 2 },
  { id: 'SUP', name: 'Superior City View', base_price: 750000, capacity: 2 },
  { id: 'DLX', name: 'Deluxe Ocean & Garden', base_price: 1250000, capacity: 3 },
  { id: 'SUT', name: 'Executive Luxury Suite', base_price: 2200000, capacity: 4 },
  { id: 'PRE', name: 'Presidential Royal Penthouse', base_price: 4800000, capacity: 6 }
];

export default function NewBookingModal({ 
  isOpen, 
  onClose, 
  rooms, 
  roomTypes, 
  preSelectedRoom, 
  preSelectedRoomType,
  onBookingSuccess 
}) {
  const activeRoomTypes = (roomTypes && roomTypes.length > 0) ? roomTypes : defaultRoomTypes;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerIdentity, setCustomerIdentity] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [depositAmount, setDepositAmount] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);

  // Set preselected room or room type if provided
  useEffect(() => {
    if (preSelectedRoom) {
      setSelectedRoomId(String(preSelectedRoom.id));
      setSelectedRoomTypeId(preSelectedRoom.room_type_id || preSelectedRoom.type_id || 'ALL');
    } else if (preSelectedRoomType) {
      setSelectedRoomTypeId(preSelectedRoomType);
    }
  }, [preSelectedRoom, preSelectedRoomType, isOpen]);

  // Fetch available rooms for the chosen dates to prevent duplicate bookings
  useEffect(() => {
    if (!checkIn || !checkOut || new Date(checkIn) >= new Date(checkOut)) return;

    const fetchAvailable = async () => {
      try {
        const res = await fetch(`/api/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
        const data = await res.json();
        setAvailableRooms(data);

        // Check if current room is available
        if (selectedRoomId) {
          const isAvail = data.some(r => String(r.id) === String(selectedRoomId));
          if (!isAvail) {
            setErrorMsg(`Cảnh báo: Phòng đã chọn đã có lịch đặt trong khoảng ${checkIn} đến ${checkOut}. Vui lòng chọn phòng trống khác.`);
          } else {
            setErrorMsg('');
          }
        }
      } catch (err) {
        console.error('Error checking room availability:', err);
      }
    };

    fetchAvailable();
  }, [checkIn, checkOut, selectedRoomId]);

  // When room type changes, auto select the first available room of that type if current room doesn't match
  useEffect(() => {
    if (selectedRoomTypeId !== 'ALL' && availableRooms.length > 0) {
      const matchRooms = availableRooms.filter(r => r.room_type_id === selectedRoomTypeId || r.type_id === selectedRoomTypeId);
      if (matchRooms.length > 0) {
        // If current selected room is not in this type, pick the first one
        const isCurrentMatch = matchRooms.some(r => String(r.id) === String(selectedRoomId));
        if (!isCurrentMatch) {
          setSelectedRoomId(String(matchRooms[0].id));
          setErrorMsg('');
        }
      }
    }
  }, [selectedRoomTypeId, availableRooms]);

  if (!isOpen) return null;

  // Calculate nights & estimated price
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const nights = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const currentRoom = rooms.find(r => String(r.id) === String(selectedRoomId));
  const basePrice = currentRoom?.base_price || 0;
  const estimatedTotal = nights * basePrice;

  // Filter available rooms according to selected room type
  const displayAvailableRooms = selectedRoomTypeId === 'ALL'
    ? availableRooms
    : availableRooms.filter(r => r.room_type_id === selectedRoomTypeId || r.type_id === selectedRoomTypeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedRoomId) {
      setErrorMsg('Vui lòng chọn phòng');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Vui lòng nhập họ tên và số điện thoại khách hàng');
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      setErrorMsg('Ngày trả phòng phải sau ngày nhận phòng');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: parseInt(selectedRoomId),
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_identity: customerIdentity,
          customer_email: customerEmail,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests_count: parseInt(guestsCount),
          deposit_amount: parseInt(depositAmount) || 0,
          special_requests: specialRequests
        })
      });

      let data = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || `Máy chủ phản hồi mã ${res.status}` };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo đặt phòng');
      }

      onBookingSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--gold-gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#080d1a'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Tạo Đơn Đặt Phòng Mới</h3>
              <p style={{ fontSize: '0.75rem', color: '#d4af37' }}>Chọn hạng phòng có sẵn & kiểm tra chống trùng lịch</p>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onClose}
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--status-occupied-border)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Pickers (Check-in & Check-out) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ngày nhận phòng (Check-in)</label>
                <input 
                  id="booking-checkin-date"
                  type="date"
                  className="form-input"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ngày trả phòng (Check-out)</label>
                <input 
                  id="booking-checkout-date"
                  type="date"
                  className="form-input"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Room Type Selector (Visual Cards & Combobox) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" htmlFor="booking-room-type-select" style={{ margin: 0, color: '#d4af37', fontWeight: 700 }}>
                  1. CHỌN HẠNG PHÒNG CÓ SẴN (COMBO BOX & THẺ)
                </label>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} /> {availableRooms.length} phòng trống sẵn sàng
                </span>
              </div>

              {/* Room Types Combobox */}
              <div style={{ marginBottom: '0.6rem' }}>
                <select
                  id="booking-room-type-select"
                  className="form-select"
                  value={selectedRoomTypeId}
                  onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                  style={{ fontWeight: 600, borderColor: 'var(--border-gold)' }}
                >
                  <option value="ALL">-- Tất cả hạng phòng ({availableRooms.length} phòng trống) --</option>
                  {activeRoomTypes.map(rt => {
                    const count = availableRooms.filter(r => r.room_type_id === rt.id || r.type_id === rt.id).length;
                    return (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({rt.id}) — {rt.base_price?.toLocaleString('vi-VN')} đ/đêm {count > 0 ? `(Còn ${count} phòng)` : '(Hết phòng)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.5rem'
              }}>
                <button
                  type="button"
                  style={{
                    background: selectedRoomTypeId === 'ALL' ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedRoomTypeId === 'ALL' ? '#080d1a' : '#cbd5e1',
                    border: selectedRoomTypeId === 'ALL' ? 'none' : '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.5rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSelectedRoomTypeId('ALL')}
                >
                  <div>Tất cả hạng</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '0.15rem' }}>
                    {availableRooms.length} phòng trống
                  </div>
                </button>

                {activeRoomTypes.map(rt => {
                  const availCount = availableRooms.filter(r => r.room_type_id === rt.id || r.type_id === rt.id).length;
                  const isSelected = selectedRoomTypeId === rt.id;
                  const isDisabled = availCount === 0;

                  return (
                    <button
                      key={rt.id}
                      type="button"
                      disabled={isDisabled}
                      style={{
                        background: isSelected 
                          ? 'var(--gold-gradient)' 
                          : isDisabled 
                            ? 'rgba(255, 255, 255, 0.01)' 
                            : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#080d1a' : isDisabled ? '#475569' : '#f8fafc',
                        border: isSelected 
                          ? '1px solid #d4af37' 
                          : '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.5rem',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        opacity: isDisabled ? 0.45 : 1
                      }}
                      onClick={() => setSelectedRoomTypeId(rt.id)}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rt.name.split(' ')[0]} {rt.id}
                      </div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        marginTop: '0.15rem',
                        color: isSelected ? '#080d1a' : availCount > 0 ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {availCount > 0 ? `🟢 Còn ${availCount}` : '🔴 Hết phòng'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Room Selection Dropdown & Pills */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ color: '#d4af37', fontWeight: 700 }}>
                2. CHỌN SỐ PHÒNG CỤ THỂ
              </label>

              {/* Quick room pill selector */}
              {displayAvailableRooms.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  {displayAvailableRooms.slice(0, 10).map(r => {
                    const isSelected = String(r.id) === String(selectedRoomId);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        style={{
                          background: isSelected ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.06)',
                          color: isSelected ? '#080d1a' : '#f8fafc',
                          border: isSelected ? '1px solid #d4af37' : '1px solid var(--border-light)',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedRoomId(String(r.id))}
                      >
                        P.{r.room_number} ({r.type_name?.split(' ')[0]})
                      </button>
                    );
                  })}
                </div>
              )}

              <select 
                id="booking-room-select"
                className="form-select"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                required
              >
                <option value="">-- Chọn số phòng trống --</option>
                {rooms.map(r => {
                  const isAvail = availableRooms.some(ar => ar.id === r.id);
                  const isTypeMatch = selectedRoomTypeId === 'ALL' || r.room_type_id === selectedRoomTypeId || r.type_id === selectedRoomTypeId;
                  
                  // Hide non-matching types if a type is explicitly chosen
                  if (selectedRoomTypeId !== 'ALL' && !isTypeMatch) return null;

                  return (
                    <option key={r.id} value={r.id}>
                      Phòng {r.room_number} - Tầng {r.floor} ({r.type_name}) — {r.base_price?.toLocaleString('vi-VN')} đ/đêm {isAvail ? '✓ Sẵn sàng' : '❌ Đã có lịch'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Customer Information */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '1rem', 
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <h4 style={{ fontSize: '0.9rem', color: '#d4af37', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={16} /> 3. THÔNG TIN KHÁCH HÀNG
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Họ và tên khách hàng *</label>
                  <input 
                    id="booking-customer-name"
                    type="text"
                    className="form-input"
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Số điện thoại liên hệ *</label>
                  <input 
                    id="booking-customer-phone"
                    type="tel"
                    className="form-input"
                    placeholder="0912 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Số CCCD / Hộ chiếu</label>
                  <input 
                    id="booking-customer-id"
                    type="text"
                    className="form-input"
                    placeholder="00120100xxxx"
                    value={customerIdentity}
                    onChange={(e) => setCustomerIdentity(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input 
                    id="booking-customer-email"
                    type="email"
                    className="form-input"
                    placeholder="khach@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Other details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Số lượng khách</label>
                <input 
                  id="booking-guests-count"
                  type="number"
                  min="1"
                  max="10"
                  className="form-input"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tiền đặt cọc (VNĐ)</label>
                <input 
                  id="booking-deposit-amount"
                  type="number"
                  step="50000"
                  className="form-input"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Yêu cầu đặc biệt (Ghi chú)</label>
              <textarea 
                id="booking-special-requests"
                rows="2"
                className="form-textarea"
                placeholder="Yêu cầu tầng cao, giường phụ, check-in sớm..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            {/* Price Preview Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid var(--border-gold)',
              borderRadius: '10px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Thời gian: <strong style={{ color: '#fff' }}>{nights} đêm</strong> ({checkIn} ➔ {checkOut})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#d4af37', marginTop: '0.2rem' }}>
                  Phòng chọn: {currentRoom ? `P.${currentRoom.room_number} (${currentRoom.type_name})` : 'Chưa chọn'} • Đơn giá: {basePrice.toLocaleString('vi-VN')} đ/đêm
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tổng tiền phòng tạm tính</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3e5ab' }}>
                  {estimatedTotal.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button 
              id="submit-booking-btn"
              type="submit" 
              className="btn btn-gold" 
              disabled={loading}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Đang kiểm tra & lưu...' : 'Xác Nhận Đặt Phòng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

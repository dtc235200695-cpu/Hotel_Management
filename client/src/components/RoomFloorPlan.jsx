import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Bed, Eye, CalendarPlus, LogIn, LogOut, 
  Coffee, Sparkles, Filter, Search, CheckCircle, AlertCircle, Wrench, Plus, X 
} from 'lucide-react';

const defaultRoomTypes = [
  { id: 'STD', name: 'Standard Queen', base_price: 450000, capacity: 2 },
  { id: 'SUP', name: 'Superior City View', base_price: 750000, capacity: 2 },
  { id: 'DLX', name: 'Deluxe Ocean & Garden', base_price: 1250000, capacity: 3 },
  { id: 'SUT', name: 'Executive Luxury Suite', base_price: 2200000, capacity: 4 },
  { id: 'PRE', name: 'Presidential Royal Penthouse', base_price: 4800000, capacity: 6 }
];

export default function RoomFloorPlan({ 
  rooms, 
  roomTypes, 
  onSelectRoom, 
  onBookRoom, 
  onCheckInRoom, 
  onCheckOutRoom, 
  onAddServiceRoom, 
  onUpdateRoomStatus,
  onRoomCreated,
  userRole 
}) {
  const activeRoomTypes = (roomTypes && roomTypes.length > 0) ? roomTypes : defaultRoomTypes;

  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add room modal states
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomTypeId, setNewRoomTypeId] = useState(activeRoomTypes[0]?.id || 'STD');
  const [newRoomStatus, setNewRoomStatus] = useState('AVAILABLE');
  const [newRoomNotes, setNewRoomNotes] = useState('');
  const [addRoomLoading, setAddRoomLoading] = useState(false);
  const [addRoomError, setAddRoomError] = useState('');

  // Ensure newRoomTypeId always synchronizes with valid activeRoomTypes
  useEffect(() => {
    if (activeRoomTypes.length > 0) {
      if (!newRoomTypeId || !activeRoomTypes.some(t => t.id === newRoomTypeId)) {
        setNewRoomTypeId(activeRoomTypes[0].id);
      }
    }
  }, [activeRoomTypes, newRoomTypeId]);

  // Calculate statistics
  const stats = {
    TOTAL: rooms.length,
    AVAILABLE: rooms.filter(r => r.status === 'AVAILABLE').length,
    OCCUPIED: rooms.filter(r => r.status === 'OCCUPIED').length,
    RESERVED: rooms.filter(r => r.status === 'RESERVED').length,
    CLEANING: rooms.filter(r => r.status === 'CLEANING').length,
    MAINTENANCE: rooms.filter(r => r.status === 'MAINTENANCE').length,
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    if (selectedFloor !== 'ALL' && room.floor !== parseInt(selectedFloor)) return false;
    if (selectedStatus !== 'ALL' && room.status !== selectedStatus) return false;
    if (selectedType !== 'ALL' && room.type_id !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = room.room_number.toLowerCase().includes(q);
      const matchType = room.type_name?.toLowerCase().includes(q);
      const matchCustomer = room.customer_name?.toLowerCase().includes(q);
      if (!matchNumber && !matchType && !matchCustomer) return false;
    }
    return true;
  });

  // Dynamic floors from existing rooms
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setAddRoomError('');
    const trimmedNumber = newRoomNumber.trim();
    if (!trimmedNumber) {
      setAddRoomError('Vui lòng nhập số phòng');
      return;
    }

    // Client-side quick duplicate check
    if (rooms.some(r => String(r.room_number).trim().toLowerCase() === trimmedNumber.toLowerCase())) {
      setAddRoomError(`Số phòng "${trimmedNumber}" đã tồn tại trong khách sạn. Vui lòng nhập số phòng khác!`);
      return;
    }

    try {
      setAddRoomLoading(true);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number: trimmedNumber,
          floor: parseInt(newRoomFloor) || 1,
          room_type_id: newRoomTypeId,
          status: newRoomStatus,
          notes: newRoomNotes
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
        throw new Error(data.error || `Lỗi thêm phòng (${res.status})`);
      }

      alert(`Đã thêm thành công phòng ${trimmedNumber}!`);
      setIsAddRoomModalOpen(false);
      setNewRoomNumber('');
      setNewRoomNotes('');
      if (onRoomCreated) onRoomCreated();
    } catch (err) {
      setAddRoomError(err.message);
    } finally {
      setAddRoomLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AVAILABLE': return { text: 'Phòng Trống', cls: 'available' };
      case 'OCCUPIED': return { text: 'Đang Có Khách', cls: 'occupied' };
      case 'RESERVED': return { text: 'Đã Đặt Trước', cls: 'reserved' };
      case 'CLEANING': return { text: 'Đang Dọn Dẹp', cls: 'cleaning' };
      case 'MAINTENANCE': return { text: 'Đang Bảo Trì', cls: 'maintenance' };
      default: return { text: status, cls: 'available' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #d4af37' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng Số Phòng</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>{stats.TOTAL}</div>
          <div style={{ fontSize: '0.75rem', color: '#d4af37' }}>Khách sạn HotelCloud</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-available)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phòng Trống</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-available)', marginTop: '0.25rem' }}>{stats.AVAILABLE}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sẵn sàng đón khách</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-occupied)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đang Có Khách</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-occupied)', marginTop: '0.25rem' }}>{stats.OCCUPIED}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lưu trú tại khách sạn</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-reserved)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đã Đặt Trước</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-reserved)', marginTop: '0.25rem' }}>{stats.RESERVED}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chờ khách đến nhận</div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--status-cleaning)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đang Dọn Dẹp</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-cleaning)', marginTop: '0.25rem' }}>{stats.CLEANING}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Housekeeping phục vụ</div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="glass-card gold-border" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              id="room-search-input"
              type="text"
              placeholder="Tìm theo số phòng, tên khách, loại..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Floor tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${selectedFloor === 'ALL' ? 'btn-gold' : 'btn-secondary'}`}
              onClick={() => setSelectedFloor('ALL')}
            >
              Tất cả tầng
            </button>
            {floors.map(f => (
              <button 
                key={f}
                className={`btn btn-sm ${selectedFloor === String(f) ? 'btn-gold' : 'btn-secondary'}`}
                onClick={() => setSelectedFloor(String(f))}
              >
                Tầng {f}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#d4af37" />
            <select 
              id="room-status-filter-select"
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Trống (Available)</option>
              <option value="OCCUPIED">Đang ở (Occupied)</option>
              <option value="RESERVED">Đã đặt (Reserved)</option>
              <option value="CLEANING">Đang dọn (Cleaning)</option>
              <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
            </select>
          </div>

          {/* Room type selector */}
          <select 
            id="room-type-filter-select"
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">Tất cả hạng phòng ({activeRoomTypes.length})</option>
            {activeRoomTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
            ))}
          </select>

          {/* Add New Room Button */}
          <button 
            id="open-add-room-btn"
            className="btn btn-gold"
            onClick={() => {
              setAddRoomError('');
              if (!newRoomTypeId || !activeRoomTypes.some(t => t.id === newRoomTypeId)) {
                setNewRoomTypeId(activeRoomTypes[0]?.id || 'STD');
              }
              setIsAddRoomModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Thêm Phòng Mới</span>
          </button>
        </div>

        {/* Room Types Quick Pill Selector */}
        <div style={{ 
          marginTop: '1rem', 
          paddingTop: '0.85rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', 
          gap: '0.45rem', 
          flexWrap: 'wrap', 
          alignItems: 'center' 
        }}>
          <span style={{ fontSize: '0.75rem', color: '#d4af37', fontWeight: 700, marginRight: '0.25rem' }}>
            CHỌN HẠNG PHÒNG:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${selectedType === 'ALL' ? 'btn-gold' : 'btn-secondary'}`}
            onClick={() => setSelectedType('ALL')}
          >
            Tất cả ({rooms.length})
          </button>
          {roomTypes.map(t => {
            const count = rooms.filter(r => r.type_id === t.id || r.room_type_id === t.id).length;
            const avail = rooms.filter(r => (r.type_id === t.id || r.room_type_id === t.id) && r.status === 'AVAILABLE').length;
            return (
              <button
                key={t.id}
                type="button"
                className={`btn btn-sm ${selectedType === t.id ? 'btn-gold' : 'btn-secondary'}`}
                onClick={() => setSelectedType(t.id)}
              >
                <span>{t.name}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  background: selectedType === t.id ? '#080d1a' : 'rgba(16, 185, 129, 0.2)',
                  color: selectedType === t.id ? '#f3e5ab' : '#10b981',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  marginLeft: '0.25rem'
                }}>
                  {avail} trống
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Grid Display */}
      {filteredRooms.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <AlertCircle size={48} color="#d4af37" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Không tìm thấy phòng phù hợp</h3>
          <p style={{ color: '#94a3b8' }}>Hãy thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="room-grid">
          {filteredRooms.map(room => {
            const statusInfo = getStatusLabel(room.status);
            return (
              <div 
                key={room.id} 
                className="room-card"
                onClick={() => onSelectRoom(room)}
              >
                {/* Header with image */}
                <div className="room-card-header">
                  <img src={room.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'} alt={`Phòng ${room.room_number}`} />
                  <div className="room-card-overlay">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="room-number-badge">
                        <span>P.{room.room_number}</span>
                      </div>
                      <span className={`status-badge ${statusInfo.cls}`}>
                        {statusInfo.text}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: 'rgba(0,0,0,0.6)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        color: '#f8fafc'
                      }}>
                        Tầng {room.floor} • {room.capacity} Khách
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="room-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>{room.type_name}</h4>
                  </div>

                  <div className="room-price-tag">
                    {room.base_price ? room.base_price.toLocaleString('vi-VN') : 0} đ
                    <span className="room-price-sub"> / đêm</span>
                  </div>

                  {/* Active stay guest info */}
                  {room.status === 'OCCUPIED' && room.customer_name && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fca5a5', fontWeight: 600 }}>
                        <Users size={12} />
                        <span>Khách: {room.customer_name}</span>
                      </div>
                      {room.customer_phone && (
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>SĐT: {room.customer_phone}</div>
                      )}
                    </div>
                  )}

                  {/* Amenities tags preview */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {room.amenities && room.amenities.slice(0, 2).map((amenity, idx) => (
                      <span 
                        key={idx}
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          color: '#cbd5e1'
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities && room.amenities.length > 2 && (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>+{room.amenities.length - 2}</span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      marginTop: 'auto', 
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)' 
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {room.status === 'AVAILABLE' && (
                      <>
                        <button 
                          className="btn btn-gold btn-sm" 
                          style={{ flex: 1 }}
                          onClick={() => onBookRoom(room)}
                        >
                          <CalendarPlus size={14} />
                          <span>Đặt phòng</span>
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onCheckInRoom(room)}
                          title="Nhận phòng trực tiếp tại quầy"
                        >
                          <LogIn size={14} />
                        </button>
                      </>
                    )}

                    {room.status === 'RESERVED' && (
                      <button 
                        className="btn btn-success btn-sm" 
                        style={{ flex: 1 }}
                        onClick={() => onCheckInRoom(room)}
                      >
                        <LogIn size={14} />
                        <span>Check-in khách</span>
                      </button>
                    )}

                    {room.status === 'OCCUPIED' && (
                      <>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ flex: 1 }}
                          onClick={() => onAddServiceRoom(room)}
                          title="Thêm dịch vụ phòng (Ăn uống, giặt là, spa...)"
                        >
                          <Coffee size={14} />
                          <span>Dịch vụ</span>
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ flex: 1 }}
                          onClick={() => onCheckOutRoom(room)}
                          title="Trả phòng & Xuất hóa đơn thanh toán"
                        >
                          <LogOut size={14} />
                          <span>Trả phòng</span>
                        </button>
                      </>
                    )}

                    {room.status === 'CLEANING' && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ flex: 1, borderColor: '#3b82f6', color: '#60a5fa' }}
                        onClick={() => onUpdateRoomStatus(room.id, 'AVAILABLE', 'Đã dọn dẹp xong')}
                      >
                        <Sparkles size={14} />
                        <span>Hoàn tất dọn dẹp</span>
                      </button>
                    )}

                    {room.status === 'MAINTENANCE' && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ flex: 1 }}
                        onClick={() => onUpdateRoomStatus(room.id, 'AVAILABLE', 'Hoàn tất bảo trì')}
                      >
                        <Wrench size={14} />
                        <span>Hoàn thành sửa chữa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Room Modal */}
      {isAddRoomModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddRoomModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Plus size={20} color="#d4af37" />
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Thêm Phòng Mới Vào Khách Sạn</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddRoomModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {addRoomError && (
                  <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                    {addRoomError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số phòng (ví dụ: 107, 208, 505) *</label>
                    <input 
                      id="new-room-number-input"
                      type="text" 
                      className="form-input" 
                      placeholder="107"
                      value={newRoomNumber}
                      onChange={e => setNewRoomNumber(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tầng số (Floor) *</label>
                    <input 
                      id="new-room-floor-input"
                      type="number" 
                      min="1"
                      max="20"
                      className="form-input" 
                      value={newRoomFloor}
                      onChange={e => setNewRoomFloor(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label 
                      className="form-label" 
                      htmlFor="new-room-type-select" 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>Hạng phòng *</span>
                      <span style={{ color: '#d4af37', fontSize: '0.75rem', fontWeight: 600 }}>
                        {activeRoomTypes.find(t => t.id === newRoomTypeId)?.base_price?.toLocaleString('vi-VN')} đ/đêm
                      </span>
                    </label>
                    <select 
                      id="new-room-type-select"
                      className="form-select"
                      value={newRoomTypeId}
                      onChange={e => setNewRoomTypeId(e.target.value)}
                      style={{ 
                        cursor: 'pointer', 
                        borderColor: 'var(--border-gold)',
                        fontWeight: 600
                      }}
                    >
                      {activeRoomTypes.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.id}) — {t.base_price?.toLocaleString('vi-VN')} đ/đêm
                        </option>
                      ))}
                    </select>

                    {/* Quick clickable room type chips */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {activeRoomTypes.map(t => {
                        const isSelected = t.id === newRoomTypeId;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-gold' : 'btn-secondary'}`}
                            style={{ 
                              padding: '0.2rem 0.5rem', 
                              fontSize: '0.72rem', 
                              borderRadius: '6px',
                              fontWeight: isSelected ? 700 : 500
                            }}
                            onClick={() => setNewRoomTypeId(t.id)}
                          >
                            {t.id} - {t.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trạng thái ban đầu</label>
                    <select 
                      id="new-room-status-select"
                      className="form-select"
                      value={newRoomStatus}
                      onChange={e => setNewRoomStatus(e.target.value)}
                    >
                      <option value="AVAILABLE">Trống (Sẵn sàng)</option>
                      <option value="CLEANING">Đang dọn dẹp</option>
                      <option value="MAINTENANCE">Đang bảo trì</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú đặc điểm phòng</label>
                  <input 
                    id="new-room-notes-input"
                    type="text" 
                    className="form-input" 
                    placeholder="Ví dụ: View biển, ban công rộng, gần thang máy..."
                    value={newRoomNotes}
                    onChange={e => setNewRoomNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddRoomModalOpen(false)}>
                  Hủy
                </button>
                <button id="save-new-room-btn" type="submit" className="btn btn-gold" disabled={addRoomLoading}>
                  <CheckCircle size={16} />
                  <span>{addRoomLoading ? 'Đang tạo phòng...' : 'Xác Nhận Thêm Phòng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

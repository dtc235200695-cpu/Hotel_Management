import React, { useState } from 'react';
import { Bed, Users, CalendarPlus, Check, Sparkles, Shield, ArrowRight, Edit2, Plus, X, AlertCircle, DollarSign } from 'lucide-react';

export default function RoomTypesShowcase({ 
  roomTypes, 
  rooms, 
  onBookRoomType,
  onViewRoomsOfType,
  onRoomTypeUpdated,
  userRole 
}) {
  const [editingType, setEditingType] = useState(null);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    base_price: 500000,
    capacity: 2,
    amenitiesStr: '',
    image: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Open Edit Modal
  const handleOpenEdit = (rt) => {
    setEditingType(rt);
    setFormData({
      id: rt.id,
      name: rt.name,
      description: rt.description || '',
      base_price: rt.base_price,
      capacity: rt.capacity || 2,
      amenitiesStr: (rt.amenities || []).join(', '),
      image: rt.image || ''
    });
    setErrorMsg('');
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsAddTypeModalOpen(true);
    setFormData({
      id: '',
      name: '',
      description: '',
      base_price: 600000,
      capacity: 2,
      amenitiesStr: 'WiFi tốc độ cao, Smart TV, Điều hòa, Bình đun siêu tốc',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
    });
    setErrorMsg('');
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    try {
      const amenitiesArr = formData.amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`/api/rooms/types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          base_price: parseInt(formData.base_price, 10),
          capacity: parseInt(formData.capacity, 10),
          amenities: amenitiesArr,
          image: formData.image
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật hạng phòng thất bại');

      alert('Đã cập nhật hạng phòng thành công!');
      setEditingType(null);
      if (onRoomTypeUpdated) onRoomTypeUpdated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Add
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.base_price) {
      setErrorMsg('Vui lòng điền đủ Mã hạng phòng, Tên và Giá');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const amenitiesArr = formData.amenitiesStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/rooms/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          base_price: parseInt(formData.base_price, 10),
          capacity: parseInt(formData.capacity, 10),
          amenities: amenitiesArr,
          image: formData.image
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thêm hạng phòng thất bại');

      alert('Đã thêm hạng phòng mới thành công!');
      setIsAddTypeModalOpen(false);
      if (onRoomTypeUpdated) onRoomTypeUpdated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card gold-border" style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--gold-gradient)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#080d1a'
              }}>
                <Bed size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                  Danh Mục Hạng Phòng Khách Sạn
                </h2>
                <p style={{ fontSize: '0.825rem', color: '#d4af37', margin: 0 }}>
                  Quản lý bảng giá niêm yết, sức chứa tối đa, trang bị tiện nghi và hình ảnh các hạng phòng
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Tổng số: <strong style={{ color: '#f3e5ab' }}>{roomTypes.length} hạng phòng</strong> • <strong style={{ color: '#10b981' }}>{rooms.filter(r => r.status === 'AVAILABLE').length} phòng trống</strong>
            </div>

            {userRole === 'ADMIN' && (
              <button 
                id="add-room-type-btn"
                className="btn btn-gold"
                onClick={handleOpenAdd}
              >
                <Plus size={16} />
                <span>Thêm Hạng Phòng</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Room Types Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {roomTypes.map(rt => {
          const roomsOfType = rooms.filter(r => r.type_id === rt.id || r.room_type_id === rt.id);
          const availableCount = roomsOfType.filter(r => r.status === 'AVAILABLE').length;
          const occupiedCount = roomsOfType.filter(r => r.status === 'OCCUPIED').length;
          const reservedCount = roomsOfType.filter(r => r.status === 'RESERVED').length;

          return (
            <div 
              key={rt.id} 
              className="glass-card" 
              style={{ 
                padding: '0', 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Image & Header Badge */}
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <img 
                  src={rt.image} 
                  alt={rt.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(8, 13, 26, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#f3e5ab',
                  fontWeight: 600
                }}>
                  <Shield size={12} color="#d4af37" />
                  <span>Mã: {rt.id}</span>
                </div>

                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: availableCount > 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#fff',
                  fontWeight: 600
                }}>
                  {availableCount > 0 ? `Còn ${availableCount} phòng trống` : 'Tạm kín phòng'}
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  padding: '1rem',
                  background: 'linear-gradient(to top, rgba(8, 13, 26, 0.95), transparent)',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: 0 }}>
                    {rt.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                    <Users size={14} color="#d4af37" />
                    <span>Tối đa {rt.capacity} người</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {rt.description}
                </p>

                {/* Status distribution pills */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {availableCount} Trống
                  </span>
                  <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {occupiedCount} Đang ở
                  </span>
                  <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {reservedCount} Đặt trước
                  </span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: 'auto' }}>
                    Tổng: {roomsOfType.length} phòng
                  </span>
                </div>

                {/* Amenities List */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(rt.amenities || []).map((amenity, i) => (
                    <span 
                      key={i} 
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Check size={10} color="#10b981" />
                      <span>{amenity}</span>
                    </span>
                  ))}
                </div>

                {/* Footer Price & Actions */}
                <div style={{ 
                  marginTop: 'auto', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Giá niêm yết:</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f3e5ab' }}>
                      {rt.base_price?.toLocaleString('vi-VN')} đ
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}> / đêm</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {userRole === 'ADMIN' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(rt)}
                        title="Chỉnh sửa giá và thông tin hạng phòng"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    <button 
                      className="btn btn-gold btn-sm"
                      onClick={() => onBookRoomType(rt)}
                      disabled={availableCount === 0}
                      title={availableCount > 0 ? 'Đặt phòng thuộc hạng này' : 'Hạng phòng hiện đang kín phòng'}
                    >
                      <CalendarPlus size={14} />
                      <span>{availableCount > 0 ? 'Đặt Hạng Này' : 'Hết Phòng'}</span>
                    </button>

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewRoomsOfType(rt.id)}
                      title="Xem danh sách các phòng thuộc hạng này trên sơ đồ"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: EDIT ROOM TYPE */}
      {editingType && (
        <div className="modal-backdrop" onClick={() => setEditingType(null)}>
          <div className="modal-content" style={{ maxWidth: '580px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                Chỉnh Sửa Hạng Phòng: {editingType.name}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingType(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {errorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
                    {errorMsg}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Tên hạng phòng *</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Giá niêm yết (VNĐ/đêm) *</label>
                    <input 
                      type="number"
                      step="50000"
                      className="form-input"
                      value={formData.base_price}
                      onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sức chứa tối đa (người)</label>
                    <input 
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả đặc điểm</label>
                  <textarea 
                    className="form-textarea"
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiện nghi (phân cách bằng dấu phẩy)</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.amenitiesStr}
                    onChange={e => setFormData({ ...formData, amenitiesStr: e.target.value })}
                    placeholder="WiFi, Điều hòa, Smart TV, Bồn tắm..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Đường dẫn ảnh đại diện (URL)</label>
                  <input 
                    type="url"
                    className="form-input"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingType(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-gold" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ROOM TYPE */}
      {isAddTypeModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddTypeModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '580px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                Thêm Hạng Phòng Mới
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddTypeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {errorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mã hạng phòng *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="VD: VIP"
                      value={formData.id}
                      onChange={e => setFormData({ ...formData, id: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tên hạng phòng *</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="VD: Grand Panorama Suite"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Giá niêm yết (VNĐ/đêm) *</label>
                    <input 
                      type="number"
                      step="50000"
                      className="form-input"
                      value={formData.base_price}
                      onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sức chứa tối đa (người)</label>
                    <input 
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả đặc điểm</label>
                  <textarea 
                    className="form-textarea"
                    rows={2}
                    placeholder="Mô tả không gian và phong cách thiết kế..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiện nghi (phân cách bằng dấu phẩy)</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.amenitiesStr}
                    onChange={e => setFormData({ ...formData, amenitiesStr: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Đường dẫn ảnh đại diện (URL)</label>
                  <input 
                    type="url"
                    className="form-input"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTypeModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-gold" disabled={isSaving}>
                  {isSaving ? 'Đang tạo...' : 'Xác Nhận Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

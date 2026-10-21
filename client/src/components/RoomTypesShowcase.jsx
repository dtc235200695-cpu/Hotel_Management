import React from 'react';
import { Bed, Users, CalendarPlus, Check, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function RoomTypesShowcase({ 
  roomTypes, 
  rooms, 
  onBookRoomType,
  onViewRoomsOfType 
}) {
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
                <h2 style={{ fontSize: '1.5rem', color: '#f8fafc' }}>
                  Danh Mục Hạng Phòng Khách Sạn
                </h2>
                <p style={{ fontSize: '0.825rem', color: '#d4af37' }}>
                  Chọn hạng phòng có sẵn để trải nghiệm dịch vụ nghỉ dưỡng tiêu chuẩn 5 sao
                </p>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Tổng số: <strong style={{ color: '#f3e5ab' }}>{roomTypes.length} hạng phòng</strong> • <strong style={{ color: '#10b981' }}>{rooms.filter(r => r.status === 'AVAILABLE').length} phòng trống sẵn sàng</strong>
          </div>
        </div>
      </div>

      {/* Room Types Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {roomTypes.map(rt => {
          // Calculate available and total rooms for this type
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
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(180deg, rgba(8,13,26,0.3) 0%, rgba(8,13,26,0.85) 100%)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(8,13,26,0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border-gold)',
                      color: '#f3e5ab',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      MÃ: {rt.id}
                    </span>

                    <span className={`status-badge ${availableCount > 0 ? 'available' : 'occupied'}`}>
                      {availableCount > 0 ? `🟢 Còn ${availableCount} phòng trống` : '🔴 Hết phòng trống'}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.35rem', color: '#f8fafc', fontWeight: 700 }}>
                      {rt.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={14} color="#d4af37" /> Sức chứa: {rt.capacity} khách
                      </span>
                      <span>•</span>
                      <span>Tổng số {roomsOfType.length} phòng</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {rt.description}
                </p>

                {/* Amenities */}
                {rt.amenities && rt.amenities.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Tiện nghi & Dịch vụ đi kèm:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {rt.amenities.map((amenity, idx) => (
                        <span 
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Check size={12} color="#10b981" />
                          <span>{amenity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room Availability breakdown */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid rgba(255, 255, 255, 0.06)', 
                  padding: '0.75rem', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>{availableCount}</div>
                    <div style={{ color: '#94a3b8' }}>Phòng trống</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }} />
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1rem' }}>{occupiedCount}</div>
                    <div style={{ color: '#94a3b8' }}>Đang ở</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }} />
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1rem' }}>{reservedCount}</div>
                    <div style={{ color: '#94a3b8' }}>Đã đặt</div>
                  </div>
                </div>

                {/* Price and Action Button */}
                <div style={{ 
                  marginTop: 'auto', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Giá niêm yết từ:</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f3e5ab' }}>
                      {rt.base_price?.toLocaleString('vi-VN')} đ
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}> / đêm</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
    </div>
  );
}

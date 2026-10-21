import React, { useState, useEffect } from 'react';
import { X, Coffee, Check, DollarSign, Plus } from 'lucide-react';

export default function AddServiceOrderModal({ 
  isOpen, 
  onClose, 
  room, 
  services, 
  onServiceAdded 
}) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(String(services[0].id));
    }
  }, [services, selectedServiceId]);

  if (!isOpen || !room) return null;

  const currentService = services.find(s => String(s.id) === String(selectedServiceId));
  const unitPrice = currentService?.price || 0;
  const totalPrice = unitPrice * (parseInt(quantity) || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!room.active_stay_id) {
      setErrorMsg('Không tìm thấy phiên lưu trú của phòng này');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/stays/${room.active_stay_id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: parseInt(selectedServiceId),
          quantity: parseInt(quantity) || 1,
          notes: note
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm dịch vụ');

      onServiceAdded(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--gold-gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#080d1a'
            }}>
              <Coffee size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>
                Thêm Dịch Vụ Cho Phòng {room.room_number}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#d4af37' }}>
                Khách: {room.customer_name || 'Khách đang ở'}
              </p>
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
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Chọn dịch vụ khách sạn</label>
              <select 
                id="service-select"
                className="form-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                required
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.category}] {s.name} — {s.price.toLocaleString('vi-VN')} đ / {s.unit}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Số lượng ({currentService?.unit || 'lần'})</label>
                <input 
                  id="service-quantity-input"
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Đơn giá</label>
                <input 
                  type="text"
                  className="form-input"
                  value={`${unitPrice.toLocaleString('vi-VN')} đ`}
                  disabled
                  style={{ opacity: 0.8 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú yêu cầu phục vụ</label>
              <input 
                id="service-note-input"
                type="text"
                placeholder="Ví dụ: Phục vụ lúc 7h sáng, ít đường, giao tại phòng..."
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Total card */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--border-gold)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tổng tiền dịch vụ:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f3e5ab' }}>
                {totalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button 
              id="confirm-add-service-btn"
              type="submit" 
              className="btn btn-gold" 
              disabled={loading}
            >
              <Check size={16} />
              <span>{loading ? 'Đang thêm...' : 'Xác Nhận Gọi Dịch Vụ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

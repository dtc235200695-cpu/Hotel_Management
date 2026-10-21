import React, { useState } from 'react';
import { Coffee, Plus, Check, DollarSign, Tag, Sparkles, X } from 'lucide-react';

export default function ServicesManager({ services, onServiceCreated }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ẩm thực');
  const [price, setPrice] = useState(50000);
  const [unit, setUnit] = useState('Suất');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['ALL', 'Ẩm thực', 'Giặt là', 'Di chuyển', 'Thư giãn & Spa', 'Dịch vụ đặc biệt'];

  const filteredServices = services.filter(s => {
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price: parseInt(price), unit, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onServiceCreated();
      setIsAddModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Filter and Add button */}
      <div className="glass-card gold-border" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${categoryFilter === cat ? 'btn-gold' : 'btn-secondary'}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'ALL' ? 'Tất cả dịch vụ' : cat}
              </button>
            ))}
          </div>

          <button 
            id="open-add-service-btn"
            className="btn btn-gold"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            <span>Thêm Dịch Vụ Mới</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {filteredServices.map(service => (
          <div 
            key={service.id} 
            className="glass-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  color: '#f3e5ab',
                  border: '1px solid var(--border-gold)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}>
                  {service.category}
                </span>

                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              </div>

              <h4 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.35rem' }}>
                {service.name}
              </h4>

              <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {service.description || 'Dịch vụ cao cấp phục vụ tận tình tại khách sạn.'}
              </p>
            </div>

            <div style={{ 
              marginTop: '1.25rem', 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'baseline' 
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đơn giá niêm yết:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f3e5ab' }}>
                {service.price.toLocaleString('vi-VN')} đ
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}> / {service.unit}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Thêm Dịch Vụ Khách Sạn Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tên dịch vụ *</label>
                  <input 
                    id="new-service-name"
                    type="text" 
                    className="form-input" 
                    placeholder="Ví dụ: Rượu Vang Đỏ Thượng Hạng" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Danh mục dịch vụ</label>
                    <select 
                      id="new-service-category"
                      className="form-select" 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="Ẩm thực">Ẩm thực</option>
                      <option value="Giặt là">Giặt là</option>
                      <option value="Di chuyển">Di chuyển</option>
                      <option value="Thư giãn & Spa">Thư giãn & Spa</option>
                      <option value="Dịch vụ đặc biệt">Dịch vụ đặc biệt</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Đơn vị tính *</label>
                    <input 
                      id="new-service-unit"
                      type="text" 
                      className="form-input" 
                      placeholder="Chai / Suất / Kg / Giờ" 
                      value={unit} 
                      onChange={e => setUnit(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn giá niêm yết (VNĐ) *</label>
                  <input 
                    id="new-service-price"
                    type="number" 
                    step="5000" 
                    className="form-input" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea 
                    id="new-service-desc"
                    rows="2" 
                    className="form-textarea" 
                    placeholder="Mô tả tiêu chuẩn chất lượng dịch vụ..." 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Hủy
                </button>
                <button id="save-new-service-btn" type="submit" className="btn btn-gold" disabled={loading}>
                  <Check size={16} />
                  <span>{loading ? 'Đang lưu...' : 'Thêm Dịch Vụ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

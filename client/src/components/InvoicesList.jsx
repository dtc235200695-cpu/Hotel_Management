import React, { useState } from 'react';
import { FileText, Search, Printer, Eye, DollarSign, Calendar, CreditCard, Banknote, QrCode } from 'lucide-react';

export default function InvoicesList({ invoices, onViewInvoice }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_code?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.room_number?.toLowerCase().includes(q) ||
      inv.customer_phone?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.final_total || 0), 0);

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'BANK_TRANSFER': return <QrCode size={14} color="#60a5fa" title="Chuyển khoản QR" />;
      case 'CREDIT_CARD': return <CreditCard size={14} color="#f59e0b" title="Thẻ tín dụng" />;
      default: return <Banknote size={14} color="#10b981" title="Tiền mặt" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card gold-border">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>TỔNG DOANH THU ĐÃ THU</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f3e5ab', marginTop: '0.25rem' }}>
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            ✓ {invoices.length} hóa đơn đã hoàn tất thanh toán
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SỐ HÓA ĐƠN TRONG KỲ</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {invoices.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d4af37', marginTop: '0.25rem' }}>
            Hệ thống lưu trữ Cloud tập trung
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              id="invoice-search-input"
              type="text"
              placeholder="Tìm theo mã hóa đơn, tên khách, số phòng..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-light)', color: '#94a3b8' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Mã Hóa Đơn</th>
                <th style={{ padding: '1rem 1.25rem' }}>Khách Hàng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Phòng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Tiền Phòng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Tiền Dịch Vụ</th>
                <th style={{ padding: '1rem 1.25rem' }}>Tổng Cộng</th>
                <th style={{ padding: '1rem 1.25rem' }}>Thanh Toán</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Chưa có hóa đơn nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr 
                    key={inv.id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#f3e5ab' }}>{inv.invoice_code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {inv.created_at ? new Date(inv.created_at).toLocaleString('vi-VN') : 'N/A'}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{inv.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{inv.customer_phone}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                      Phòng {inv.room_number}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {(inv.room_charge || 0).toLocaleString('vi-VN')} đ
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {(inv.service_charge || 0).toLocaleString('vi-VN')} đ
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 800, color: '#f3e5ab' }}>
                        {(inv.final_total || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {getPaymentIcon(inv.payment_method)}
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Đã thanh toán</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewInvoice(inv.id)}
                        title="Xem chi tiết và in hóa đơn"
                      >
                        <Eye size={14} />
                        <span>Xem chi tiết</span>
                      </button>
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

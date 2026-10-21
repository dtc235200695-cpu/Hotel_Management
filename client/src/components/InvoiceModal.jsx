import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, CreditCard, Banknote, QrCode, FileText, Building } from 'lucide-react';

export default function InvoiceModal({ 
  isOpen, 
  onClose, 
  stayId, 
  invoiceId, 
  onCheckoutSuccess,
  isCheckoutMode = false 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const loadData = async () => {
      try {
        if (isCheckoutMode && stayId) {
          // Fetch stay checkout summary
          const res = await fetch(`/api/stays/${stayId}/summary`);
          const resData = await res.json();
          setData(resData);
        } else if (invoiceId) {
          // Fetch existing invoice
          const res = await fetch(`/api/invoices/${invoiceId}`);
          const resData = await res.json();
          setData({
            invoice: resData.invoice,
            services: resData.services,
            stay: resData.invoice,
            room_charge: resData.invoice.room_charge,
            service_charge: resData.invoice.service_charge,
            deposit_deducted: resData.invoice.deposit_deducted,
            discount_amount: resData.invoice.discount_amount,
            tax_amount: resData.invoice.tax_amount,
            final_total: resData.invoice.final_total
          });
        }
      } catch (err) {
        console.error('Error loading invoice data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, stayId, invoiceId, isCheckoutMode]);

  if (!isOpen) return null;

  // Real-time calculation if in checkout mode
  const currentDiscount = parseInt(discount) || 0;
  let calculatedTotal = 0;
  if (data && isCheckoutMode) {
    const subtotal = data.room_charge + data.service_charge - data.deposit_deducted - currentDiscount;
    const tax = Math.round(subtotal * 0.08);
    calculatedTotal = Math.max(0, subtotal + tax);
  }

  const handleConfirmCheckout = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/stays/${stayId}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_amount: currentDiscount,
          payment_method: paymentMethod,
          created_by: 'Lễ tân'
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Lỗi khi trả phòng');

      onCheckoutSuccess(resData);
      onClose();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={20} color="#d4af37" />
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>
              {isCheckoutMode ? 'Quy Trình Trả Phòng & Lập Hóa Đơn' : 'Hóa Đơn Thanh Toán Khách Sạn'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="In hóa đơn">
              <Printer size={16} />
              <span>In Hóa Đơn</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Đang tải hóa đơn...</div>
          ) : !data ? (
            <div style={{ color: '#ef4444', textAlign: 'center' }}>Không tìm thấy thông tin hóa đơn</div>
          ) : (
            <div className="printable-invoice" style={{
              background: '#0d1527',
              border: '1px solid var(--border-gold)',
              borderRadius: '12px',
              padding: '1.75rem'
            }}>
              {/* Hotel Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.5rem', color: '#f3e5ab', letterSpacing: '1px' }}>
                    HOTELCLOUD RESORT & SPA
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    01 Đường Biển Bạc, Bãi Dài, TP. Biển Xanh • Hotline: 1900 6868
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Website: hotelcloud.vn • Cloud Database ID: CF-D1-V24
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: '#d4af37', fontWeight: 700 }}>HÓA ĐƠN DỊCH VỤ</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, marginTop: '0.2rem' }}>
                    {data.invoice?.invoice_code || `TẠM TÍNH - P.${data.stay?.room_number}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Ngày lập: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Customer & Room Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.35rem' }}>THÔNG TIN KHÁCH HÀNG:</div>
                  <div>Họ tên: <strong style={{ color: '#fff' }}>{data.stay?.customer_name}</strong></div>
                  <div>Số điện thoại: {data.stay?.customer_phone}</div>
                  <div>CCCD / Hộ chiếu: {data.stay?.identity_card || 'Tại quầy'}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: '0.35rem' }}>THÔNG TIN LƯU TRÚ:</div>
                  <div>Phòng số: <strong style={{ color: '#f3e5ab' }}>{data.stay?.room_number}</strong> ({data.stay?.room_type_name})</div>
                  <div>Giờ nhận: {data.stay?.actual_check_in ? new Date(data.stay.actual_check_in).toLocaleString('vi-VN') : 'N/A'}</div>
                  <div>Thời gian tính: <strong style={{ color: '#fff' }}>{data.nights || 1} đêm</strong></div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#d4af37', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.65rem', textAlign: 'left' }}>Khoản Mục</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Số Lượng</th>
                    <th style={{ padding: '0.65rem', textAlign: 'right' }}>Đơn Giá</th>
                    <th style={{ padding: '0.65rem', textAlign: 'right' }}>Thành Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Room Charge */}
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.65rem' }}>
                      <strong>Tiền phòng ({data.stay?.room_type_name})</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Phòng {data.stay?.room_number}</div>
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'center' }}>{data.nights || 1} đêm</td>
                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>{(data.stay?.base_price || 0).toLocaleString('vi-VN')} đ</td>
                    <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>
                      {data.room_charge.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>

                  {/* Services */}
                  {data.services && data.services.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.65rem' }}>
                        <span>{item.service_name}</span>
                        {item.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ghi chú: {item.notes}</div>}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right' }}>{item.unit_price.toLocaleString('vi-VN')} đ</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 600 }}>
                        {item.total_price.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation */}
              <div style={{ 
                borderTop: '1px dashed var(--border-gold)', 
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Tổng tiền phòng:</span>
                    <span>{data.room_charge.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Tổng tiền dịch vụ ({data.services?.length || 0}):</span>
                    <span>{data.service_charge.toLocaleString('vi-VN')} đ</span>
                  </div>

                  {data.deposit_deducted > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>Trừ tiền cọc trước:</span>
                      <span>-{data.deposit_deducted.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  {isCheckoutMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Giảm giá / Voucher (VNĐ):</span>
                      <input 
                        type="number"
                        min="0"
                        step="10000"
                        style={{ width: '120px', padding: '0.2rem 0.4rem', textAlign: 'right' }}
                        className="form-input"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                  )}

                  {!isCheckoutMode && data.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>Giảm giá:</span>
                      <span>-{data.discount_amount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Thuế GTGT (VAT 8%):</span>
                    <span>{(isCheckoutMode ? Math.round((data.room_charge + data.service_charge - data.deposit_deducted - currentDiscount) * 0.08) : data.tax_amount).toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'baseline',
                    borderTop: '2px solid var(--border-gold)',
                    paddingTop: '0.5rem',
                    marginTop: '0.35rem'
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f3e5ab' }}>TỔNG THANH TOÁN:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3e5ab' }}>
                      {(isCheckoutMode ? calculatedTotal : data.final_total).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection for Checkout */}
              {isCheckoutMode && (
                <div className="no-print" style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px' 
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#d4af37', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Chọn phương thức thanh toán:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    <button 
                      type="button"
                      className={`btn ${paymentMethod === 'BANK_TRANSFER' ? 'btn-gold' : 'btn-secondary'}`}
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    >
                      <QrCode size={16} />
                      <span>Chuyển Khoản QR</span>
                    </button>

                    <button 
                      type="button"
                      className={`btn ${paymentMethod === 'CASH' ? 'btn-gold' : 'btn-secondary'}`}
                      onClick={() => setPaymentMethod('CASH')}
                    >
                      <Banknote size={16} />
                      <span>Tiền Mặt</span>
                    </button>

                    <button 
                      type="button"
                      className={`btn ${paymentMethod === 'CREDIT_CARD' ? 'btn-gold' : 'btn-secondary'}`}
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                    >
                      <CreditCard size={16} />
                      <span>Thẻ Tín Dụng</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Signatures for receipt */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '2.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#94a3b8' }}>Khách hàng</div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#64748b' }}>(Ký và ghi rõ họ tên)</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#94a3b8' }}>Đại diện khách sạn</div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#64748b' }}>(Thu ngân / Lễ tân xác nhận)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="modal-footer no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>

          {isCheckoutMode && (
            <button 
              id="confirm-checkout-btn"
              type="button" 
              className="btn btn-gold"
              disabled={submitting}
              onClick={handleConfirmCheckout}
            >
              <CheckCircle size={18} />
              <span>{submitting ? 'Đang xuất hóa đơn...' : 'Xác Nhận Thanh Toán & Trả Phòng'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

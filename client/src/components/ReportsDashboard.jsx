import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Bed, Users, Calendar, 
  BarChart3, PieChart, ShieldAlert, CheckCircle, RefreshCw 
} from 'lucide-react';

export default function ReportsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/dashboard');
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error('Error fetching dashboard report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <RefreshCw size={32} className="spin-anim" style={{ margin: '0 auto 1rem' }} />
        <div>Đang tổng hợp báo cáo kinh doanh từ Cloud...</div>
      </div>
    );
  }

  if (!data) return null;

  const { roomStats, occupancyRate, todayRevenue, monthRevenue, activeBookingsCount, activeStaysCount, revenueByType, recentLogs } = data;

  // Maximum value for bar scaling
  const maxRevType = Math.max(...revenueByType.map(r => r.total), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Today revenue */}
        <div className="glass-card gold-border">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DOANH THU HÔM NAY</span>
            <DollarSign size={18} color="#d4af37" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f3e5ab', marginTop: '0.5rem' }}>
            {todayRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={14} /> Ghi nhận theo thời gian thực
          </div>
        </div>

        {/* Month revenue */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DOANH THU THÁNG NÀY</span>
            <Calendar size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem' }}>
            {monthRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>TỶ LỆ LẤP ĐẦY PHÒNG</span>
            <Bed size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
            {occupancyRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            {roomStats.OCCUPIED} / {roomStats.TOTAL} phòng đang phục vụ
          </div>
        </div>

        {/* Active Guests */}
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>KHÁCH ĐANG LƯU TRÚ</span>
            <Users size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.5rem' }}>
            {activeStaysCount} phòng
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            + {activeBookingsCount} đơn đặt phòng chờ nhận
          </div>
        </div>
      </div>

      {/* Two Column Section: Revenue by Room Type & Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Revenue by Room Type */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="#d4af37" />
              Doanh Thu Theo Hạng Phòng
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tổng cộng</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {revenueByType.map((item, idx) => {
              const percent = Math.round((item.total / maxRevType) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: '#f3e5ab', fontWeight: 700 }}>{item.total.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: 'rgba(255, 255, 255, 0.08)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percent}%`,
                      background: 'var(--gold-gradient)',
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Status Composition */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#60a5fa" />
              Tình Trạng Phòng Hiện Tại
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{roomStats.TOTAL} Phòng Tổng Số</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Phòng Trống (Sẵn sàng)</span>
              </div>
              <strong style={{ color: '#10b981' }}>{roomStats.AVAILABLE} phòng</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Đang Có Khách Ở</span>
              </div>
              <strong style={{ color: '#ef4444' }}>{roomStats.OCCUPIED} phòng</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Đã Đặt Trước (Reserved)</span>
              </div>
              <strong style={{ color: '#f59e0b' }}>{roomStats.RESERVED} phòng</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Đang Dọn Dẹp (Cleaning)</span>
              </div>
              <strong style={{ color: '#3b82f6' }}>{roomStats.CLEANING} phòng</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(100, 116, 139, 0.08)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748b' }} />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Bảo Trì / Sửa Chữa</span>
              </div>
              <strong style={{ color: '#94a3b8' }}>{roomStats.MAINTENANCE} phòng</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Audit Logs */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} color="#10b981" />
          Nhật Ký Nghiệp Vụ & Đồng Bộ Cloud
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recentLogs && recentLogs.map(log => (
            <div 
              key={log.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '6px',
                fontSize: '0.825rem',
                borderLeft: '3px solid #d4af37'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#f3e5ab', marginRight: '0.5rem' }}>[{log.action}]</span>
                <span style={{ color: '#cbd5e1' }}>{log.details}</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                {log.performed_by} • {log.timestamp ? log.timestamp.split(' ')[1] : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

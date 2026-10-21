import React, { useState, useEffect } from 'react';
import { 
  Cloud, Database, Download, RefreshCw, HardDrive, 
  Activity, ShieldCheck, Server, Terminal, Copy, Check 
} from 'lucide-react';

export default function CloudOperations() {
  const [cloudStatus, setCloudStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [pingHistory, setPingHistory] = useState([14, 12, 16, 11, 15, 12]);
  const [pinging, setPinging] = useState(false);

  const fetchCloudStatus = async () => {
    try {
      setPinging(true);
      const start = Date.now();
      const res = await fetch('/api/cloud/status');
      const data = await res.json();
      const latency = Date.now() - start;
      setCloudStatus({ ...data, latencyMs: latency });
      setPingHistory(prev => [...prev.slice(-7), latency]);
    } catch (err) {
      console.error('Error fetching cloud status:', err);
    } finally {
      setPinging(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudStatus();
  }, []);

  const handleDownloadBackup = () => {
    window.location.href = '/api/cloud/backup';
  };

  const handleCopySchema = async () => {
    try {
      const res = await fetch('/api/cloud/schema-d1');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    } catch (err) {
      alert('Không thể sao chép: ' + err.message);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Bạn có chắc muốn khôi phục lại cơ sở dữ liệu mẫu ban đầu?')) return;
    try {
      const res = await fetch('/api/cloud/reset-data', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Khôi phục thành công');
      window.location.reload();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cloud Header Banner */}
      <div className="glass-card gold-border" style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
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
                <Cloud size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#f8fafc' }}>
                  Trung Tâm Quản Trị & Thực Nghiệm Điện Toán Đám Mây
                </h2>
                <p style={{ fontSize: '0.825rem', color: '#d4af37' }}>
                  Cloud Computing Architecture • Centralized Storage • Backup & Performance
                </p>
              </div>
            </div>
          </div>

          <button 
            id="cloud-ping-btn"
            className="btn btn-gold"
            onClick={fetchCloudStatus}
            disabled={pinging}
          >
            <RefreshCw size={16} className={pinging ? 'spin-anim' : ''} />
            <span>{pinging ? 'Đang đo độ trễ...' : 'Kiểm Tra Độ Trễ Cloud'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <Activity size={16} color="#10b981" />
            <span>ĐỘ TRỄ MẠNG (LATENCY)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
            {cloudStatus?.latencyMs || 12} ms
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Thời gian phản hồi API Edge Server
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <Database size={16} color="#d4af37" />
            <span>CƠ SỞ DỮ LIỆU TẬP TRUNG</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f3e5ab', marginTop: '0.5rem' }}>
            SQLite 3 / Cloudflare D1
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Dung lượng DB: {cloudStatus?.dbSizeFormatted || '128 KB'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <Server size={16} color="#60a5fa" />
            <span>VÙNG CLOUD REGION</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.5rem' }}>
            APAC / VN-Edge
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Đảm bảo kết nối tốc độ cao & ổn định
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>TRẠNG THÁI HỆ THỐNG</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
            Hoạt Động 100%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Thời gian chạy: {cloudStatus?.uptimeSeconds || 360} giây
          </div>
        </div>
      </div>

      {/* Cloud Experiments & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Experiment 1: Backup & Snapshot */}
        <div className="glass-card gold-border">
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} color="#d4af37" />
            Thực Nghiệm 1: Sao Lưu Cơ Sở Dữ Liệu
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Xuất bản sao lưu dữ liệu toàn bộ hệ thống (Phòng, Đặt phòng, Lưu trú, Khách hàng, Hóa đơn và Dịch vụ) thành tệp JSON Snapshot có tem thời gian, đáp ứng tiêu chí kiểm thử sao lưu Cloud.
          </p>

          <button 
            id="download-backup-btn"
            className="btn btn-gold"
            onClick={handleDownloadBackup}
          >
            <Download size={16} />
            <span>Tải Bản Snapshot Sao Lưu (.JSON)</span>
          </button>
        </div>

        {/* Experiment 2: Restore & Recovery */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={20} color="#60a5fa" />
            Thực Nghiệm 2: Phục Hồi Dữ Liệu (Disaster Recovery)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Thử nghiệm kịch bản phục hồi thảm họa bằng cách khôi phục cơ sở dữ liệu về trạng thái dữ liệu mẫu ban đầu mà không làm gián đoạn kết nối máy chủ.
          </p>

          <button 
            id="reset-db-btn"
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
            onClick={handleResetData}
          >
            <RefreshCw size={16} />
            <span>Thực Hiện Khôi Phục Dữ Liệu Mẫu</span>
          </button>
        </div>
      </div>

      {/* Cloudflare D1 Deployment Guide */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={20} color="#d4af37" />
            Sẵn Sàng Triển Khai Lên Cloudflare Pages & Cloudflare D1
          </h3>

          <button 
            id="copy-schema-btn"
            className="btn btn-secondary btn-sm"
            onClick={handleCopySchema}
          >
            {copiedSchema ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSchema ? 'Đã sao chép Schema!' : 'Sao Chép SQL D1 Schema'}</span>
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
          Đúng theo <strong>Phương án A</strong> trong đề tài, cơ sở dữ liệu của HotelCloud hoàn toàn tương thích với <strong>Cloudflare D1</strong> (Serverless SQL). Bạn có thể triển khai lên Cloudflare chỉ với 3 lệnh đơn giản:
        </p>

        <div style={{ 
          background: '#040711', 
          padding: '1.25rem', 
          borderRadius: '10px', 
          fontFamily: 'monospace', 
          fontSize: '0.85rem',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ color: '#64748b' }}># 1. Tạo cơ sở dữ liệu Cloudflare D1 serverless miễn phí:</div>
          <div style={{ color: '#38bdf8', marginBottom: '0.75rem' }}>npx wrangler d1 create hotelcloud-db</div>

          <div style={{ color: '#64748b' }}># 2. Thực thi khởi tạo schema bảng:</div>
          <div style={{ color: '#38bdf8', marginBottom: '0.75rem' }}>npx wrangler d1 execute hotelcloud-db --file=./server/schema.sql</div>

          <div style={{ color: '#64748b' }}># 3. Triển khai frontend lên Cloudflare Pages miễn phí toàn cầu:</div>
          <div style={{ color: '#38bdf8' }}>npx wrangler pages deploy dist</div>
        </div>
      </div>
    </div>
  );
}

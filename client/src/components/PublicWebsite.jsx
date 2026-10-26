import React, { useState, useMemo } from 'react';
import { 
  Crown, Star, MapPin, Phone, Mail, Calendar, Clock, Users, Bed, Check, 
  Sparkles, Shield, Wifi, Tv, Coffee, Search, ArrowRight, X, ChevronRight, 
  Utensils, Waves, Car, Dumbbell, Award, CreditCard, QrCode, CheckCircle, 
  FileText, ExternalLink, AlertCircle, Heart, Share2, Compass, Printer
} from 'lucide-react';

export default function PublicWebsite({ 
  rooms = [], 
  roomTypes = [], 
  onSwitchToPms,
  onBookingCreated
}) {
  // Filter & Search states
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [searchCheckIn, setSearchCheckIn] = useState(todayStr);
  const [searchCheckOut, setSearchCheckOut] = useState(tomorrowStr);
  const [searchGuests, setSearchGuests] = useState('2');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Booking Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  // Guest Booking Form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestIdentity, setGuestIdentity] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAY_AT_HOTEL'); // 'PAY_AT_HOTEL' | 'VIETQR' | 'DEPOSIT_30'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Room Detail Modal
  const [detailModalType, setDetailModalType] = useState(null);

  // Reservation Lookup States
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Calculate nights
  const nightsCount = useMemo(() => {
    if (!searchCheckIn || !searchCheckOut) return 1;
    const start = new Date(searchCheckIn);
    const end = new Date(searchCheckOut);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [searchCheckIn, searchCheckOut]);

  // Filtered room types based on search
  const displayedTypes = useMemo(() => {
    let list = [...roomTypes];
    if (selectedTypeFilter !== 'ALL') {
      list = list.filter(t => t.id === selectedTypeFilter);
    }
    const guestsNum = parseInt(searchGuests, 10);
    if (!isNaN(guestsNum)) {
      list = list.filter(t => t.capacity >= guestsNum);
    }
    return list;
  }, [roomTypes, selectedTypeFilter, searchGuests]);

  // Open booking modal for a specific room type
  const handleStartBooking = (type) => {
    setSelectedRoomType(type);
    // Find available rooms of this type
    const availableRooms = rooms.filter(r => (r.type_id === type.id || r.room_type_id === type.id) && r.status === 'AVAILABLE');
    if (availableRooms.length > 0) {
      setSelectedRoomId(availableRooms[0].id.toString());
    } else {
      const anyRoom = rooms.find(r => r.type_id === type.id || r.room_type_id === type.id);
      setSelectedRoomId(anyRoom ? anyRoom.id.toString() : '');
    }
    setBookingError('');
    setBookingSuccessData(null);
    setIsBookingModalOpen(true);
  };

  // Submit public online reservation
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setBookingError('Vui lòng nhập họ và tên và số điện thoại liên hệ');
      return;
    }
    if (!selectedRoomId) {
      setBookingError('Rất tiếc hiện tại chưa có phòng trống khả dụng cho hạng phòng này vào ngày đã chọn');
      return;
    }

    setIsSubmitting(true);
    setBookingError('');

    try {
      // Calculate deposit if chosen
      const basePrice = selectedRoomType ? selectedRoomType.base_price : 500000;
      const totalEstimated = basePrice * nightsCount;
      const deposit = paymentMethod === 'DEPOSIT_30' ? Math.round(totalEstimated * 0.3) : 0;

      const payload = {
        customer_name: guestName.trim(),
        customer_phone: guestPhone.trim(),
        customer_email: guestEmail.trim(),
        customer_identity: guestIdentity.trim() || 'Khách Đặt Online',
        room_id: parseInt(selectedRoomId, 10),
        check_in_date: searchCheckIn,
        check_out_date: searchCheckOut,
        guests_count: parseInt(searchGuests, 10) || 2,
        deposit_amount: deposit,
        special_requests: `[Đặt Web Trực Tuyến - ${paymentMethod === 'PAY_AT_HOTEL' ? 'Thanh toán tại quầy' : paymentMethod === 'VIETQR' ? 'VietQR Chuyển khoản' : 'Cọc 30%'}] ${specialRequests.trim()}`
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đặt phòng thất bại, vui lòng kiểm tra lại');
      }

      setBookingSuccessData({
        ...data,
        customer_name: guestName,
        customer_phone: guestPhone,
        check_in_date: searchCheckIn,
        check_out_date: searchCheckOut,
        room_type_name: selectedRoomType.name,
        nights: nightsCount,
        paymentMethod
      });

      if (onBookingCreated) {
        onBookingCreated();
      }
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lookup reservation
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      setLookupError('Vui lòng nhập Mã Đặt Phòng (BK-...) hoặc Số Điện Thoại');
      return;
    }

    setLookupLoading(true);
    setLookupError('');
    setLookupResults(null);

    try {
      const isCode = lookupQuery.toUpperCase().startsWith('BK-');
      const param = isCode ? `code=${encodeURIComponent(lookupQuery.trim())}` : `phone=${encodeURIComponent(lookupQuery.trim())}`;
      const res = await fetch(`/api/bookings/lookup?${param}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không tìm thấy thông tin đặt phòng');
      }

      if (data.length === 0) {
        setLookupError('Không tìm thấy đơn đặt phòng nào trùng khớp với thông tin cung cấp');
      } else {
        setLookupResults(data);
      }
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="public-website-container" style={{ minHeight: '100vh', background: '#070b14', color: '#f8fafc', overflowX: 'hidden' }}>
      
      {/* 1. TOP LUXURY ANNOUNCEMENT & CONTACT BAR */}
      <div style={{
        background: 'rgba(10, 16, 30, 0.95)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        fontSize: '0.8rem',
        padding: '0.45rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#cbd5e1' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={13} color="#d4af37" /> 01 Trần Phú, Bãi Biển Lộc Thọ, TP. Nha Trang
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Phone size={13} color="#d4af37" /> Hotline 24/7: <strong style={{ color: '#f3e5ab' }}>1900 8888</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            id="lookup-reservation-top-btn"
            onClick={() => { setLookupQuery(''); setLookupResults(null); setLookupError(''); setIsLookupModalOpen(true); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d4af37',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <Search size={13} />
            <span>Tra Cứu Đặt Phòng</span>
          </button>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

          {/* Quick switcher to PMS System */}
          <button
            id="switch-to-pms-btn"
            onClick={onSwitchToPms}
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#f3e5ab',
              padding: '0.2rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
            title="Chuyển sang Giao diện Quản trị Khách sạn (HotelCloud PMS)"
          >
            <Shield size={12} />
            <span>Cổng Quản Trị Khách Sạn (PMS)</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* 2. PUBLIC HEADER / NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        background: 'rgba(7, 11, 20, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d4af37 0%, #aa8214 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#080d1a',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.35)'
          }}>
            <Crown size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '1px', fontFamily: "'Playfair Display', serif", color: '#fff' }}>
                HOTELCLOUD
              </span>
              <span style={{ display: 'flex', color: '#d4af37' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#d4af37" />)}
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#d4af37', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
              Luxury Resort & Five-Star Hotel
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', fontSize: '0.9rem', fontWeight: 500 }}>
          <a href="#hero" style={{ color: '#fff', textDecoration: 'none', transition: 'color 0.2s' }}>Trang Chủ</a>
          <a href="#suites" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Hạng Phòng & Giá</a>
          <a href="#amenities" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Tiện Ích 5 Sao</a>
          <a href="#offers" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Ưu Đãi</a>
          <a href="#reviews" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Đánh Giá</a>
          <a href="#contact" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Liên Hệ</a>
        </nav>

        {/* Header Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            id="book-now-header-btn"
            onClick={() => {
              const firstType = roomTypes[0] || null;
              if (firstType) handleStartBooking(firstType);
            }}
            className="btn btn-gold"
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.35)'
            }}
          >
            <Calendar size={15} />
            <span>Đặt Phòng Ngay</span>
          </button>
        </div>
      </header>

      {/* 3. HERO BANNER SECTION */}
      <section id="hero" style={{
        position: 'relative',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '5rem 2rem 7rem 2rem',
        backgroundImage: `linear-gradient(180deg, rgba(7, 11, 20, 0.4) 0%, rgba(7, 11, 20, 0.95) 100%), url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', zIndex: 2 }}>
          {/* 5-Star Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            padding: '0.4rem 1.1rem',
            borderRadius: '30px',
            fontSize: '0.825rem',
            color: '#f3e5ab',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <Sparkles size={15} color="#d4af37" />
            <span style={{ fontWeight: 600, letterSpacing: '1px' }}>RESORT NGHỈ DƯỠNG HOÀNG GIA 5 SAO QUỐC TẾ</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            fontFamily: "'Playfair Display', serif",
            lineHeight: 1.15,
            color: '#fff',
            marginBottom: '1.25rem',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)'
          }}>
            Kỳ Nghỉ Thượng Lưu <br />
            <span style={{ 
              background: 'linear-gradient(135deg, #f3e5ab 0%, #d4af37 50%, #aa8214 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontStyle: 'italic'
            }}>
              Giữa Biển Xanh & Mây Trời
            </span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#e2e8f0',
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            Khám phá trải nghiệm nghỉ dưỡng xa hoa với các căn phòng Suite hướng biển, ẩm thực Michelin, hồ bơi vô cực tầng thượng và dịch vụ quản gia 24/7.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="#suites"
              className="btn btn-gold"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', fontWeight: 700, textDecoration: 'none' }}
            >
              <Bed size={18} />
              <span>Khám Phá Các Hạng Phòng</span>
            </a>
            <a 
              href="#amenities"
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', textDecoration: 'none' }}
            >
              <span>Tiện Ích Khách Sạn</span>
              <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* 4. REAL-TIME SEARCH & AVAILABILITY BAR (FLOATING) */}
      <div style={{ maxWidth: '1150px', margin: '-3.5rem auto 3rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.15)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
            {/* Check-in */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d4af37' }}>
                <Calendar size={14} /> Ngày nhận phòng (Check-in)
              </label>
              <input 
                id="search-check-in-date"
                type="date" 
                className="form-input" 
                value={searchCheckIn}
                min={todayStr}
                onChange={e => setSearchCheckIn(e.target.value)}
                style={{ background: 'rgba(7, 11, 20, 0.8)' }}
              />
            </div>

            {/* Check-out */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d4af37' }}>
                <Calendar size={14} /> Ngày trả phòng (Check-out)
              </label>
              <input 
                id="search-check-out-date"
                type="date" 
                className="form-input" 
                value={searchCheckOut}
                min={searchCheckIn || todayStr}
                onChange={e => setSearchCheckOut(e.target.value)}
                style={{ background: 'rgba(7, 11, 20, 0.8)' }}
              />
            </div>

            {/* Guests */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d4af37' }}>
                <Users size={14} /> Số lượng khách
              </label>
              <select 
                id="search-guests-select"
                className="form-select"
                value={searchGuests}
                onChange={e => setSearchGuests(e.target.value)}
                style={{ background: 'rgba(7, 11, 20, 0.8)' }}
              >
                <option value="1">1 Khách (Single)</option>
                <option value="2">2 Khách (Couple / Twin)</option>
                <option value="3">3 Khách (Triple)</option>
                <option value="4">4 Khách (Family Suite)</option>
                <option value="6">6+ Khách (Penthouse / Royal)</option>
              </select>
            </div>

            {/* Room Type Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d4af37' }}>
                <Bed size={14} /> Hạng phòng
              </label>
              <select 
                id="search-type-select"
                className="form-select"
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                style={{ background: 'rgba(7, 11, 20, 0.8)' }}
              >
                <option value="ALL">Tất cả hạng phòng ({roomTypes.length})</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>

            {/* Search CTA */}
            <div>
              <a 
                href="#suites"
                className="btn btn-gold"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  justifyContent: 'center', 
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.95rem'
                }}
              >
                <Search size={16} />
                <span>Tìm Phòng Trống</span>
              </a>
            </div>
          </div>

          {/* Quick Info under Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <span>✓ Số đêm lưu trú: <strong style={{ color: '#f3e5ab' }}>{nightsCount} đêm</strong></span>
              <span>✓ Đảm bảo giá trực tuyến tốt nhất</span>
              <span>✓ Miễn phí hủy phòng trước 24h</span>
            </div>
            <div style={{ color: '#10b981', fontWeight: 600 }}>
              ● Đang có {rooms.filter(r => r.status === 'AVAILABLE').length} phòng trống sẵn sàng
            </div>
          </div>
        </div>
      </div>

      {/* 5. ROOM TYPES & SUITES SHOWCASE SECTION */}
      <section id="suites" style={{ maxWidth: '1240px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            BỘ SƯU TẬP PHÒNG NGHỈ THƯỢNG HẠNG
          </div>
          <h2 style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", color: '#fff' }}>
            Không Gian Nghỉ Dưỡng Tinh Hoa
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
            Mỗi căn phòng tại HotelCloud đều được thiết kế tỉ mỉ bởi kiến trúc sư hàng đầu với tầm nhìn tuyệt đẹp và trang thiết bị công nghệ hiện đại.
          </p>
        </div>

        {/* Room Types Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {displayedTypes.map((rt) => {
            // Count rooms of this type
            const roomsOfType = rooms.filter(r => r.type_id === rt.id || r.room_type_id === rt.id);
            const availableCount = roomsOfType.filter(r => r.status === 'AVAILABLE').length;

            return (
              <div 
                key={rt.id}
                className="glass-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderRadius: '16px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.45)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Room Image & Availability Badge */}
                <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                  <img 
                    src={rt.image} 
                    alt={rt.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(7, 11, 20, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#f3e5ab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Crown size={12} color="#d4af37" />
                    <span>Hạng {rt.id}</span>
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: availableCount > 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {availableCount > 0 ? `Còn ${availableCount} phòng trống` : 'Đang tạm kín phòng'}
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 1), transparent)'
                  }} />
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.35rem', fontFamily: "'Playfair Display', serif" }}>
                      {rt.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      {rt.description}
                    </p>
                  </div>

                  {/* Room Specs */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.825rem', color: '#cbd5e1', borderY: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} color="#d4af37" /> Sức chứa: <strong>{rt.capacity} khách</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Bed size={14} color="#d4af37" /> Giường King/Twin
                    </div>
                  </div>

                  {/* Amenities highlights */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(rt.amenities || []).slice(0, 4).map((amenity, i) => (
                      <span 
                        key={i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Check size={11} color="#10b981" /> {amenity}
                      </span>
                    ))}
                    {(rt.amenities || []).length > 4 && (
                      <span style={{ fontSize: '0.75rem', color: '#d4af37', padding: '0.25rem 0.4rem' }}>
                        +{rt.amenities.length - 4} tiện ích khác
                      </span>
                    )}
                  </div>

                  {/* Price & Action Buttons */}
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Giá phòng trực tuyến:</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f3e5ab' }}>
                        {rt.base_price?.toLocaleString('vi-VN')} đ
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}> / đêm</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setDetailModalType(rt)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                        title="Xem chi tiết tiện nghi phòng"
                      >
                        Chi Tiết
                      </button>
                      <button 
                        id={`book-room-type-${rt.id}-btn`}
                        onClick={() => handleStartBooking(rt)}
                        className="btn btn-gold btn-sm"
                        style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', fontWeight: 700 }}
                      >
                        <span>Đặt Phòng</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FIVE-STAR HOTEL AMENITIES & EXPERIENCES */}
      <section id="amenities" style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(7, 11, 20, 0.95) 100%)',
        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        padding: '4.5rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              TIỆN ÍCH ĐẶC QUYỀN 5 SAO
            </div>
            <h2 style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", color: '#fff' }}>
              Hệ Sinh Thái Nghỉ Dưỡng Toàn Diện
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '650px', margin: '0.5rem auto 0 auto' }}>
              Trải nghiệm các dịch vụ thư giãn, ẩm thực và chăm sóc sức khỏe chuẩn quốc tế ngay trong khuôn viên khách sạn.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {/* Amenity 1 */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(23, 32, 51, 0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '1rem' }}>
                <Waves size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>Hồ Bơi Vô Cực Tầng Thượng</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Hồ bơi tràn bờ với góc nhìn 360 độ ngắm trọn hoàng hôn biển và ánh đèn rực rỡ của toàn thành phố về đêm.
              </p>
            </div>

            {/* Amenity 2 */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(23, 32, 51, 0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', marginBottom: '1rem' }}>
                <Utensils size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>Nhà Hàng Ẩm Thực Michelin</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Thưởng thức tinh hoa ẩm thực Á - Âu từ các đầu bếp danh tiếng quốc tế kết hợp nguồn hải sản tươi sống thượng hạng.
              </p>
            </div>

            {/* Amenity 3 */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(23, 32, 51, 0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '1rem' }}>
                <Sparkles size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>Royal Lotus Spa & Xông Hơi</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Liệu pháp massage đá nóng Himalaya và tinh dầu hữu cơ giúp tái tạo năng lượng thể chất và tinh thần tuyệt đối.
              </p>
            </div>

            {/* Amenity 4 */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(23, 32, 51, 0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '1rem' }}>
                <Coffee size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>Sky Lounge & Cocktail Bar</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Không gian âm nhạc Acoustic nhẹ nhàng cùng bộ sưu tập vang hảo hạng và các ly cocktail pha chế theo yêu cầu.
              </p>
            </div>

            {/* Amenity 5 */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(23, 32, 51, 0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', marginBottom: '1rem' }}>
                <Car size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>Xe Đưa Đón Sân Bay VIP</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Đội xe Limousine sang trọng luôn sẵn sàng đón tiếp khách hàng từ sân bay về khách sạn với sự tận tâm tối đa.
              </p>
            </div>

            {/* Amenity 6 */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(23, 32, 51, 0.6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '1rem' }}>
                <Dumbbell size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>Trung Tâm Thể Hình & Yoga</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Trang thiết bị Technogym tiên tiến hàng đầu cùng các lớp Yoga bình minh hướng biển miễn phí cho khách lưu trú.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SPECIAL OFFERS & VACATION PACKAGES */}
      <section id="offers" style={{ maxWidth: '1240px', margin: '0 auto', padding: '4.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            ƯU ĐÃI & GÓI NGHỈ DƯỠNG
          </div>
          <h2 style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", color: '#fff' }}>
            Đặc Quyền Dành Cho Bạn
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Offer 1 */}
          <div className="glass-card gold-border" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'inline-block', background: 'rgba(212, 175, 55, 0.2)', color: '#f3e5ab', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>
              GÓI TRĂNG MẬT LÃNG MẠN
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: "'Playfair Display', serif" }}>
              Honeymoon Sweet Romance
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Tặng kèm trang trí hoa tươi & nến lãng mạn, 01 chai vang Ý thượng hạng và bữa tối ánh nến bên bờ biển cho 2 người.
            </p>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f3e5ab', marginTop: 'auto' }}>
              Giảm ngay 25% khi đặt từ 2 đêm
            </div>
            <button 
              onClick={() => {
                const suiteType = roomTypes.find(r => r.id === 'DLX' || r.id === 'SUT') || roomTypes[0];
                handleStartBooking(suiteType);
              }}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Đặt Gói Nghỉ Dưỡng Này
            </button>
          </div>

          {/* Offer 2 */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>
              KỲ NGHỈ GIA ĐÌNH HẠNH PHÚC
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: "'Playfair Display', serif" }}>
              Family Summer Escape
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Bao gồm bữa sáng Buffet cao cấp hàng ngày, miễn phí vé tham quan khu vui chơi nước cho 2 bé và ưu đãi 20% dịch vụ Spa.
            </p>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa', marginTop: 'auto' }}>
              Áp dụng cho phòng Family & Suite
            </div>
            <button 
              onClick={() => {
                const suiteType = roomTypes.find(r => r.id === 'SUT' || r.id === 'PRE') || roomTypes[0];
                handleStartBooking(suiteType);
              }}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Đặt Gói Gia Đình
            </button>
          </div>

          {/* Offer 3 */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>
              DOANH NHÂN & CÔNG TÁC
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: "'Playfair Display', serif" }}>
              Executive Business Stay
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Miễn phí giặt ủi nhanh, sử dụng phòng họp VIP Executive Lounge và dịch vụ xe Limousine đưa đón sân bay 2 chiều.
            </p>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: 'auto' }}>
              Dành riêng cho khách lưu trú Superior / Suite
            </div>
            <button 
              onClick={() => {
                const supType = roomTypes.find(r => r.id === 'SUP') || roomTypes[0];
                handleStartBooking(supType);
              }}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Đặt Gói Doanh Nhân
            </button>
          </div>
        </div>
      </section>

      {/* 8. GUEST REVIEWS & SOCIAL PROOF */}
      <section id="reviews" style={{
        background: 'rgba(10, 16, 30, 0.95)',
        padding: '4.5rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              CHIA SẺ TỪ DU KHÁCH
            </div>
            <h2 style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", color: '#fff' }}>
              99.2% Khách Hàng Hài Lòng Tuyệt Đối
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Review 1 */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', color: '#d4af37', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="#d4af37" />)}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.25rem' }}>
                "Căn Penthouse tầng thượng thật sự là một kiệt tác! Hồ bơi mini riêng ngắm trọn vẹn biển xanh. Đội ngũ lễ tân và quản gia chăm sóc gia đình tôi vô cùng ân cần và chu đáo."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d4af37', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  HM
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Anh Hoàng Minh</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lưu trú tại Presidential Penthouse • Tháng 10/2026</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', color: '#d4af37', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="#d4af37" />)}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.25rem' }}>
                "Đặt phòng trực tuyến trên website của khách sạn rất nhanh chóng và mượt mà. Vừa nhận được mã đặt phòng thì bạn lễ tân đã gọi điện xác nhận ngay. Phòng sạch sẽ, thơm và view biển cực đẹp!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  TL
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Chị Thùy Linh</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lưu trú tại Deluxe Ocean Suite • Tháng 10/2026</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', color: '#d4af37', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="#d4af37" />)}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.25rem' }}>
                "Đồ ăn sáng phong phú, quầy Sky Bar tầng thượng cocktail ngon tuyệt. Đặc biệt thủ tục check-in check-out siêu tốc không phải chờ đợi lâu. Chắc chắn sẽ quay lại nhiều lần nữa."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  TN
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Anh Tuấn Nam & Gia đình</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lưu trú tại Superior City View • Tháng 10/2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CONTACT & FAQ SECTION */}
      <section id="contact" style={{ maxWidth: '1240px', margin: '0 auto', padding: '4.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem' }}>
          {/* Hotel Location & Contacts */}
          <div>
            <div style={{ color: '#d4af37', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              VỊ TRÍ & LIÊN HỆ
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", color: '#fff', marginBottom: '1rem' }}>
              Chào Đón Quý Khách Đến HotelCloud
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
              Tọa lạc tại cung đường vàng ven biển trung tâm, thuận tiện kết nối tới sân bay quốc tế và các điểm tham quan nổi tiếng bậc nhất.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>Địa Chỉ Khách Sạn:</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>01 Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', flexShrink: 0 }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>Tổng Đài Đặt Phòng (24/7):</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>1900 8888 • Hotline: (+84) 258 388 9999</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>Email Tiếp Nhận & Hỗ Trợ:</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>booking@hotelcloud.luxury • concierge@hotelcloud.luxury</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', flexShrink: 0 }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>Quy Định Giờ Nhận & Trả Phòng:</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Check-in: từ 14:00 • Check-out: trước 12:00 trưa</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQs */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#f3e5ab', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={20} color="#d4af37" />
              Câu Hỏi Thường Gặp (FAQ)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  1. Tôi có cần thanh toán tiền ngay khi đặt phòng trên web không?
                </div>
                <div style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Quý khách có thể chọn thanh toán 100% tại quầy Lễ tân khi nhận phòng, hoặc chuyển khoản VietQR nhanh để giữ phòng ưu tiên.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  2. Tôi có thể check-in sớm hoặc check-out muộn được không?
                </div>
                <div style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Khách sạn hỗ trợ nhận phòng sớm tùy thuộc vào tình trạng phòng thực tế. Quý khách vui lòng ghi chú vào mục Yêu cầu đặc biệt khi đặt phòng.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  3. Giá phòng đã bao gồm thuế VAT và bữa sáng chưa?
                </div>
                <div style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Tất cả các hạng phòng từ Superior trở lên đều đã bao gồm buffet sáng chuẩn 5 sao và miễn phí sử dụng hồ bơi vô cực & phòng Gym.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. LUXURY FOOTER */}
      <footer style={{
        background: '#04070d',
        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
        padding: '3rem 2rem 2rem 2rem',
        fontSize: '0.85rem',
        color: '#94a3b8'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Crown size={22} color="#d4af37" />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', fontFamily: "'Playfair Display', serif" }}>HOTELCLOUD</span>
            </div>
            <p style={{ lineHeight: 1.6, fontSize: '0.825rem', marginBottom: '1rem' }}>
              Hệ thống khách sạn & khu nghỉ dưỡng tiêu chuẩn 5 sao quốc tế vận hành trên nền tảng điện toán đám mây hiện đại.
            </p>
            <div style={{ color: '#d4af37', fontWeight: 600 }}>★★★★★ Five Star Certified</div>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Về Khách Sạn</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <a href="#hero" style={{ color: '#94a3b8', textDecoration: 'none' }}>Giới thiệu chung</a>
              <a href="#suites" style={{ color: '#94a3b8', textDecoration: 'none' }}>Danh mục phòng Suite</a>
              <a href="#amenities" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tiện ích dịch vụ</a>
              <a href="#offers" style={{ color: '#94a3b8', textDecoration: 'none' }}>Chương trình ưu đãi</a>
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Chính Sách & Quy Định</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <span>Điều khoản đặt phòng trực tuyến</span>
              <span>Chính sách hoàn tiền & hủy phòng</span>
              <span>Bảo mật thông tin khách hàng</span>
              <span>Quy định sử dụng dịch vụ nội khu</span>
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Dành Cho Nhân Viên</div>
            <p style={{ fontSize: '0.825rem', marginBottom: '0.75rem' }}>
              Nhân viên lễ tân, quản lý khách sạn truy cập hệ thống quản trị nội bộ:
            </p>
            <button
              onClick={onSwitchToPms}
              className="btn btn-gold btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Shield size={14} />
              <span>Đăng Nhập Cổng PMS</span>
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1240px', margin: '0 auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>© 2026 HotelCloud Luxury Resort & Spa. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1rem', color: '#64748b' }}>
            <span>Cloud Architecture: Multi-Tenant Edge API</span>
            <span>Secure Encryption 256-bit</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: PUBLIC ONLINE RESERVATION BOOKING MODAL */}
      {/* ========================================================================= */}
      {isBookingModalOpen && selectedRoomType && (
        <div className="modal-backdrop" onClick={() => setIsBookingModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    Đặt Phòng Trực Tuyến
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#d4af37', margin: 0 }}>
                    Hạng phòng: {selectedRoomType.name}
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsBookingModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* If Booking Succeeded: Render Success Voucher */}
            {bookingSuccessData ? (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                  border: '2px solid #10b981'
                }}>
                  <CheckCircle size={36} />
                </div>

                <h3 style={{ fontSize: '1.6rem', color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: '0.5rem' }}>
                  Đặt Phòng Thành Công!
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Cảm ơn Quý khách <strong style={{ color: '#fff' }}>{bookingSuccessData.customer_name}</strong>. Đơn đặt phòng đã được ghi nhận trên hệ thống HotelCloud.
                </p>

                {/* Booking Voucher Card */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px dashed rgba(212, 175, 55, 0.5)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MÃ XÁC NHẬN ĐẶT PHÒNG</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f3e5ab', letterSpacing: '1px' }}>
                        {bookingSuccessData.booking_code}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>● ĐÃ XÁC NHẬN</div>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>5-Star HotelCloud</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>Hạng phòng: <strong style={{ color: '#fff' }}>{bookingSuccessData.room_type_name}</strong></div>
                    <div>Số đêm: <strong style={{ color: '#fff' }}>{bookingSuccessData.nights} đêm</strong></div>
                    <div>Nhận phòng: <strong style={{ color: '#fff' }}>{bookingSuccessData.check_in_date} (14:00)</strong></div>
                    <div>Trả phòng: <strong style={{ color: '#fff' }}>{bookingSuccessData.check_out_date} (12:00)</strong></div>
                    <div>Số điện thoại: <strong style={{ color: '#fff' }}>{bookingSuccessData.customer_phone}</strong></div>
                    <div>Tổng tiền dự kiến: <strong style={{ color: '#f3e5ab' }}>{bookingSuccessData.total_estimated_price?.toLocaleString('vi-VN')} đ</strong></div>
                  </div>

                  {bookingSuccessData.paymentMethod === 'VIETQR' && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ color: '#d4af37', fontWeight: 700, marginBottom: '0.25rem' }}>Thông tin chuyển khoản VietQR:</div>
                      <div>Ngân hàng: <strong>MBBank (Ngân Hàng Quân Đội)</strong></div>
                      <div>Số tài khoản: <strong>0999 8888 7777</strong> • Chủ TK: <strong>HOTELCLOUD RESORT</strong></div>
                      <div>Nội dung chuyển: <strong style={{ color: '#f3e5ab' }}>{bookingSuccessData.booking_code} - {bookingSuccessData.customer_phone}</strong></div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    <span>In / Lưu Xác Nhận</span>
                  </button>
                  <button 
                    className="btn btn-gold"
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setBookingSuccessData(null);
                    }}
                  >
                    <span>Hoàn Tất</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleSubmitBooking}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {bookingError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Room Summary Card */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <img 
                      src={selectedRoomType.image} 
                      alt={selectedRoomType.name}
                      style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{selectedRoomType.name}</div>
                      <div style={{ color: '#94a3b8' }}>Sức chứa: {selectedRoomType.capacity} khách • Giá niêm yết: <strong style={{ color: '#f3e5ab' }}>{selectedRoomType.base_price?.toLocaleString('vi-VN')} đ / đêm</strong></div>
                      <div style={{ color: '#d4af37', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        Khoảng thời gian: {searchCheckIn} đến {searchCheckOut} ({nightsCount} đêm)
                      </div>
                    </div>
                  </div>

                  {/* Room selection */}
                  <div className="form-group">
                    <label className="form-label">Chọn số phòng còn trống (Hệ thống tự động đề xuất)</label>
                    <select 
                      id="booking-room-select"
                      className="form-select"
                      value={selectedRoomId}
                      onChange={e => setSelectedRoomId(e.target.value)}
                      required
                    >
                      {rooms
                        .filter(r => (r.type_id === selectedRoomType.id || r.room_type_id === selectedRoomType.id))
                        .map(r => (
                          <option key={r.id} value={r.id}>
                            Phòng {r.room_number} (Tầng {r.floor}) - {r.status === 'AVAILABLE' ? 'Sẵn sàng đón khách' : `Trạng thái: ${r.status}`}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Customer Information Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Họ và tên khách lưu trú *</label>
                      <input 
                        id="booking-customer-name"
                        type="text" 
                        className="form-input" 
                        placeholder="Nguyễn Văn A"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số điện thoại liên hệ *</label>
                      <input 
                        id="booking-customer-phone"
                        type="tel" 
                        className="form-input" 
                        placeholder="0912 345 678"
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Email nhận xác nhận đặt phòng</label>
                      <input 
                        id="booking-customer-email"
                        type="email" 
                        className="form-input" 
                        placeholder="email@example.com"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số CCCD / Hộ chiếu (Nếu có)</label>
                      <input 
                        id="booking-customer-identity"
                        type="text" 
                        className="form-input" 
                        placeholder="00120100xxxx"
                        value={guestIdentity}
                        onChange={e => setGuestIdentity(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="form-group">
                    <label className="form-label">Ghi chú & Yêu cầu đặc biệt</label>
                    <textarea 
                      id="booking-special-requests"
                      className="form-textarea" 
                      rows={2}
                      placeholder="Ví dụ: Giường đôi lớn, phòng tầng cao yên tĩnh, chuẩn bị set hoa chúc mừng kỷ niệm..."
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                    />
                  </div>

                  {/* Payment Method Choice */}
                  <div>
                    <label className="form-label">Phương thức thanh toán</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div 
                        onClick={() => setPaymentMethod('PAY_AT_HOTEL')}
                        style={{
                          background: paymentMethod === 'PAY_AT_HOTEL' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${paymentMethod === 'PAY_AT_HOTEL' ? '#d4af37' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '8px',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <CreditCard size={18} color="#d4af37" style={{ margin: '0 auto 0.25rem auto' }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Tại Lễ Tân</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Trả khi nhận phòng</div>
                      </div>

                      <div 
                        onClick={() => setPaymentMethod('VIETQR')}
                        style={{
                          background: paymentMethod === 'VIETQR' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${paymentMethod === 'VIETQR' ? '#d4af37' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '8px',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <QrCode size={18} color="#d4af37" style={{ margin: '0 auto 0.25rem auto' }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>VietQR Tức Thì</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Chuyển khoản NH</div>
                      </div>

                      <div 
                        onClick={() => setPaymentMethod('DEPOSIT_30')}
                        style={{
                          background: paymentMethod === 'DEPOSIT_30' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${paymentMethod === 'DEPOSIT_30' ? '#d4af37' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '8px',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <Shield size={18} color="#d4af37" style={{ margin: '0 auto 0.25rem auto' }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Cọc Giữ 30%</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Đảm bảo giữ phòng</div>
                      </div>
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    padding: '1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tổng tiền dự kiến ({nightsCount} đêm):</div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f3e5ab' }}>
                        {((selectedRoomType.base_price || 0) * nightsCount).toLocaleString('vi-VN')} đ
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Đã bao gồm bữa sáng và các tiện ích 5 sao</div>
                    </div>

                    <button 
                      id="submit-public-booking-btn"
                      type="submit" 
                      className="btn btn-gold"
                      disabled={isSubmitting}
                      style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
                    >
                      {isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Phòng'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESERVATION LOOKUP MODAL */}
      {/* ========================================================================= */}
      {isLookupModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLookupModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37' }}>
                  <Search size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    Tra Cứu Thông Tin Đặt Phòng
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#d4af37', margin: 0 }}>
                    Nhập mã đặt phòng (BK-...) hoặc số điện thoại của bạn
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsLookupModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  id="lookup-input"
                  type="text" 
                  className="form-input" 
                  placeholder="Nhập mã (VD: BK-20261026-...) hoặc Số ĐT" 
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <button 
                  id="lookup-submit-btn"
                  type="submit" 
                  className="btn btn-gold" 
                  disabled={lookupLoading}
                  style={{ flexShrink: 0 }}
                >
                  <Search size={16} />
                  <span>{lookupLoading ? 'Đang tìm...' : 'Tra Cứu'}</span>
                </button>
              </form>

              {lookupError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
                  {lookupError}
                </div>
              )}

              {/* Lookup Results */}
              {lookupResults && lookupResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                    Tìm thấy {lookupResults.length} đơn đặt phòng:
                  </div>

                  {lookupResults.map(b => (
                    <div 
                      key={b.id} 
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mã đặt phòng: </span>
                          <strong style={{ color: '#f3e5ab', fontSize: '1.05rem' }}>{b.booking_code}</strong>
                        </div>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: b.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : b.status === 'CHECKED_IN' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: b.status === 'CONFIRMED' ? '#10b981' : b.status === 'CHECKED_IN' ? '#60a5fa' : '#f59e0b'
                        }}>
                          {b.status === 'CONFIRMED' ? 'Đã Xác Nhận' : b.status === 'CHECKED_IN' ? 'Đã Nhận Phòng' : b.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div>Khách hàng: <strong style={{ color: '#fff' }}>{b.customer_name}</strong></div>
                        <div>Số ĐT: <strong style={{ color: '#fff' }}>{b.customer_phone}</strong></div>
                        <div>Phòng số: <strong style={{ color: '#f3e5ab' }}>{b.room_number}</strong> ({b.room_type_name})</div>
                        <div>Số khách: <strong style={{ color: '#fff' }}>{b.guests_count} người</strong></div>
                        <div>Nhận phòng: <strong style={{ color: '#fff' }}>{b.check_in_date}</strong></div>
                        <div>Trả phòng: <strong style={{ color: '#fff' }}>{b.check_out_date}</strong></div>
                        <div>Tổng tiền: <strong style={{ color: '#f3e5ab' }}>{b.total_estimated_price?.toLocaleString('vi-VN')} đ</strong></div>
                        <div>Đã cọc: <strong style={{ color: '#10b981' }}>{b.deposit_amount?.toLocaleString('vi-VN')} đ</strong></div>
                      </div>

                      {b.special_requests && (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                          Ghi chú: {b.special_requests}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsLookupModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ROOM TYPE DETAILS MODAL */}
      {/* ========================================================================= */}
      {detailModalType && (
        <div className="modal-backdrop" onClick={() => setDetailModalType(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                {detailModalType.name}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetailModalType(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <img 
                src={detailModalType.image} 
                alt={detailModalType.name}
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px' }}
              />

              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {detailModalType.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '8px' }}>
                <div>Sức chứa tiêu chuẩn: <strong style={{ color: '#fff' }}>{detailModalType.capacity} người lớn</strong></div>
                <div>Đơn giá: <strong style={{ color: '#f3e5ab' }}>{detailModalType.base_price?.toLocaleString('vi-VN')} đ / đêm</strong></div>
              </div>

              <div>
                <div style={{ color: '#d4af37', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Danh sách trang thiết bị & tiện nghi 5 sao:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(detailModalType.amenities || []).map((a, i) => (
                    <span 
                      key={i}
                      style={{
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#f3e5ab'
                      }}
                    >
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setDetailModalType(null)}>
                Đóng
              </button>
              <button 
                className="btn btn-gold"
                onClick={() => {
                  const type = detailModalType;
                  setDetailModalType(null);
                  handleStartBooking(type);
                }}
              >
                <span>Đặt Phòng Này Ngay</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

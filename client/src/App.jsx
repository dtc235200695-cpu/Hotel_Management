import React, { useState, useEffect } from 'react';
import { 
  Building2, Calendar, FileText, Coffee, BarChart3, Cloud, Users, 
  Plus, CheckCircle, LogIn, LogOut, Sparkles, X, AlertCircle, Bed, Globe,
  Edit2, Trash2, UserCheck
} from 'lucide-react';

import Navbar from './components/Navbar';
import RoomFloorPlan from './components/RoomFloorPlan';
import RoomTypesShowcase from './components/RoomTypesShowcase';
import BookingManager from './components/BookingManager';
import NewBookingModal from './components/NewBookingModal';
import AddServiceOrderModal from './components/AddServiceOrderModal';
import InvoiceModal from './components/InvoiceModal';
import InvoicesList from './components/InvoicesList';
import ServicesManager from './components/ServicesManager';
import ReportsDashboard from './components/ReportsDashboard';
import CloudOperations from './components/CloudOperations';
import UserManager from './components/UserManager';
import PublicWebsite from './components/PublicWebsite';
import CustomersManager from './components/CustomersManager';
import HotelChatbot from './components/HotelChatbot';

export const DEFAULT_ROOM_TYPES = [
  { 
    id: 'STD', 
    name: 'Standard Queen', 
    description: 'Phòng Tiêu Chuẩn ấm cúng, thiết kế hiện đại, đầy đủ tiện nghi thiết yếu.', 
    base_price: 450000, 
    capacity: 2, 
    amenities: ['WiFi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV 43 inch', 'Bình đun siêu tốc', 'Máy sấy tóc'] 
  },
  { 
    id: 'SUP', 
    name: 'Superior City View', 
    description: 'Phòng Nâng Cao với cửa sổ lớn hướng nhìn toàn cảnh thành phố rực rỡ.', 
    base_price: 750000, 
    capacity: 2, 
    amenities: ['WiFi tốc độ cao', 'Smart TV 50 inch', 'View Thành Phố', 'Bàn làm việc cao cấp', 'Két an toàn', 'Minibar'] 
  },
  { 
    id: 'DLX', 
    name: 'Deluxe Ocean & Garden', 
    description: 'Phòng Sang Trọng có ban công riêng, bồn tắm nằm thư giãn và tầm nhìn đẹp.', 
    base_price: 1250000, 
    capacity: 3, 
    amenities: ['Ban công riêng', 'Bồn tắm nằm', 'View Biển / Vườn', 'Giường King Size', 'Loa Bluetooth'] 
  },
  { 
    id: 'SUT', 
    name: 'Executive Luxury Suite', 
    description: 'Căn hộ Suite cao cấp gồm phòng khách riêng biệt, phòng ngủ lớn, bồn tắm sục.', 
    base_price: 2200000, 
    capacity: 4, 
    amenities: ['Phòng khách riêng', 'Bồn tắm sục Jacuzzi', 'Máy pha cà phê Nespresso', 'Đặc quyền Executive Lounge'] 
  },
  { 
    id: 'PRE', 
    name: 'Presidential Royal Penthouse', 
    description: 'Biệt thự tầng thượng Hoàng Gia đẳng cấp 5 sao với tầm nhìn 360 độ.', 
    base_price: 4800000, 
    capacity: 6, 
    amenities: ['Bể bơi vô cực mini riêng', 'Quản gia 24/7', 'Phòng xông hơi riêng', 'Bếp ăn & Phòng họp VIP'] 
  }
];

export default function App() {
  // Top-level View Mode: 'PUBLIC' (Website Khách Hàng) | 'PMS' (Cổng Quản Trị Khách Sạn)
  const [viewMode, setViewMode] = useState('PUBLIC');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('FLOOR_PLAN');

  // Core Data states
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState(DEFAULT_ROOM_TYPES);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Current User & Role state
  const [currentUser, setCurrentUser] = useState({
    username: 'admin',
    full_name: 'Quản Trị Viên (Admin)',
    role: 'ADMIN'
  });

  // Modal states
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [preSelectedRoom, setPreSelectedRoom] = useState(null);
  const [preSelectedRoomType, setPreSelectedRoomType] = useState('ALL');

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [serviceTargetRoom, setServiceTargetRoom] = useState(null);

  const [invoiceModalConfig, setInvoiceModalConfig] = useState({
    isOpen: false,
    stayId: null,
    invoiceId: null,
    isCheckoutMode: false
  });

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInTargetRoom, setCheckInTargetRoom] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInIdentity, setWalkInIdentity] = useState('');

  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomEditFormData, setRoomEditFormData] = useState({
    room_number: '',
    floor: 1,
    room_type_id: '',
    notes: ''
  });

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomEditFormData({
      room_number: room.room_number,
      floor: room.floor,
      room_type_id: room.type_id || room.room_type_id || 'STD',
      notes: room.notes || ''
    });
  };

  const handleSaveEditRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomEditFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Đã cập nhật thông tin phòng thành công!');
      setEditingRoom(null);
      setSelectedRoomDetail(null);
      loadAllData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ${roomNumber}?`)) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setSelectedRoomDetail(null);
      loadAllData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Fetch all core application data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rRes, rtRes, bRes, sRes, iRes, uRes] = await Promise.all([
        fetch('/api/rooms').then(r => r.json()),
        fetch('/api/rooms/types').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/services').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ]);

      setRooms(rRes || []);
      setRoomTypes((Array.isArray(rtRes) && rtRes.length > 0) ? rtRes : DEFAULT_ROOM_TYPES);
      setBookings(bRes || []);
      setServices(sRes || []);
      setInvoices(iRes || []);
      setUsers(uRes || []);
    } catch (err) {
      console.error('Error loading core data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Role Switching
  const handleRoleChange = (newRole) => {
    if (newRole === 'ADMIN') {
      setCurrentUser({ username: 'admin', full_name: 'Quản Trị Viên (Admin)', role: 'ADMIN' });
    } else if (newRole === 'RECEPTIONIST') {
      setCurrentUser({ username: 'letan', full_name: 'Mai Anh (Lễ Tân)', role: 'RECEPTIONIST' });
    } else if (newRole === 'MANAGER') {
      setCurrentUser({ username: 'quanly', full_name: 'Trần Đức Huy (Quản Lý)', role: 'MANAGER' });
    }
  };

  // Quick Action Handlers from Floor Plan
  const handleOpenBookingForRoom = (room) => {
    setPreSelectedRoom(room);
    setPreSelectedRoomType(room.room_type_id || room.type_id || 'ALL');
    setIsNewBookingModalOpen(true);
  };

  const handleBookRoomType = (roomType) => {
    setPreSelectedRoom(null);
    setPreSelectedRoomType(roomType.id);
    setIsNewBookingModalOpen(true);
  };

  const handleChatbotAction = (action) => {
    if (!action) return;
    if (action.type === 'BOOK_ROOM_TYPE') {
      const targetType = roomTypes.find(rt => rt.id === action.roomTypeId);
      if (targetType) {
        handleBookRoomType(targetType);
      } else {
        setIsNewBookingModalOpen(true);
      }
    } else if (action.type === 'SWITCH_TAB' && action.tab) {
      setActiveTab(action.tab);
    }
  };

  const handleViewRoomsOfType = (typeId) => {
    setActiveTab('FLOOR_PLAN');
  };

  const handleOpenCheckInForRoom = (room) => {
    setCheckInTargetRoom(room);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInIdentity('');
    setIsCheckInModalOpen(true);
  };

  const handleOpenAddServiceForRoom = (room) => {
    setServiceTargetRoom(room);
    setIsAddServiceModalOpen(true);
  };

  const handleOpenCheckOutForRoom = (room) => {
    if (!room.active_stay_id) {
      alert('Không tìm thấy thông tin phiên lưu trú của phòng này.');
      return;
    }
    setInvoiceModalConfig({
      isOpen: true,
      stayId: room.active_stay_id,
      invoiceId: null,
      isCheckoutMode: true
    });
  };

  const handleViewInvoice = (invoiceId) => {
    setInvoiceModalConfig({
      isOpen: true,
      stayId: null,
      invoiceId: invoiceId,
      isCheckoutMode: false
    });
  };

  const handleUpdateRoomStatus = async (roomId, newStatus, notes) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      loadAllData();
      if (selectedRoomDetail) setSelectedRoomDetail(null);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt phòng này?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadAllData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCheckInFromBooking = async (booking) => {
    try {
      const res = await fetch('/api/stays/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Check-in thành công cho khách ${booking.customer_name} vào phòng ${data.room_number}`);
      loadAllData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleWalkInCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!checkInTargetRoom) return;

    // Check if there is an active reservation
    const isReserved = checkInTargetRoom.status === 'RESERVED';
    const activeBooking = isReserved 
      ? bookings.find(b => b.room_id === checkInTargetRoom.id && b.status === 'CONFIRMED')
      : null;

    try {
      const payload = activeBooking 
        ? { booking_id: activeBooking.id }
        : {
            room_id: checkInTargetRoom.id,
            customer_name: walkInName,
            customer_phone: walkInPhone,
            customer_identity: walkInIdentity,
            notes: 'Check-in trực tiếp tại quầy'
          };

      const res = await fetch('/api/stays/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Đã nhận phòng ${checkInTargetRoom.room_number} thành công!`);
      setIsCheckInModalOpen(false);
      loadAllData();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Render Public Website Mode
  if (viewMode === 'PUBLIC') {
    return (
      <PublicWebsite 
        rooms={rooms}
        roomTypes={roomTypes}
        onSwitchToPms={() => setViewMode('PMS')}
        onBookingCreated={loadAllData}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar 
        currentUser={currentUser} 
        onRoleChange={handleRoleChange} 
        onRefreshData={loadAllData} 
        onSwitchToPublic={() => setViewMode('PUBLIC')}
        onUserLogin={(user) => {
          setCurrentUser(user);
          loadAllData();
        }}
      />

      {/* Navigation Tabs */}
      <nav className="nav-tabs-container">
        {/* Switch to Public Website Tab */}
        <button 
          id="tab-public-website"
          className="nav-tab-btn"
          style={{ 
            background: 'rgba(212, 175, 55, 0.15)', 
            color: '#f3e5ab', 
            border: '1px solid rgba(212, 175, 55, 0.4)',
            fontWeight: 700 
          }}
          onClick={() => setViewMode('PUBLIC')}
          title="Mở Website Khách Hàng / Đặt Phòng Trực Tuyến"
        >
          <Globe size={16} />
          <span>🌐 Xem Website Khách Hàng</span>
        </button>

        <button 
          id="tab-floorplan"
          className={`nav-tab-btn ${activeTab === 'FLOOR_PLAN' ? 'active' : ''}`}
          onClick={() => setActiveTab('FLOOR_PLAN')}
        >
          <Building2 size={16} />
          <span>Sơ Đồ Phòng</span>
        </button>

        <button 
          id="tab-roomtypes"
          className={`nav-tab-btn ${activeTab === 'ROOM_TYPES' ? 'active' : ''}`}
          onClick={() => setActiveTab('ROOM_TYPES')}
        >
          <Bed size={16} />
          <span>Hạng Phòng Có Sẵn ({roomTypes.length})</span>
        </button>

        <button 
          id="tab-bookings"
          className={`nav-tab-btn ${activeTab === 'BOOKINGS' ? 'active' : ''}`}
          onClick={() => setActiveTab('BOOKINGS')}
        >
          <Calendar size={16} />
          <span>Quản Lý Đặt Phòng ({bookings.filter(b => b.status === 'CONFIRMED').length})</span>
        </button>

        <button 
          id="tab-customers"
          className={`nav-tab-btn ${activeTab === 'CUSTOMERS' ? 'active' : ''}`}
          onClick={() => setActiveTab('CUSTOMERS')}
        >
          <UserCheck size={16} />
          <span>Hồ Sơ Khách Hàng</span>
        </button>

        <button 
          id="tab-invoices"
          className={`nav-tab-btn ${activeTab === 'INVOICES' ? 'active' : ''}`}
          onClick={() => setActiveTab('INVOICES')}
        >
          <FileText size={16} />
          <span>Hóa Đơn & Trả Phòng</span>
        </button>

        <button 
          id="tab-services"
          className={`nav-tab-btn ${activeTab === 'SERVICES' ? 'active' : ''}`}
          onClick={() => setActiveTab('SERVICES')}
        >
          <Coffee size={16} />
          <span>Dịch Vụ Khách Sạn</span>
        </button>

        <button 
          id="tab-reports"
          className={`nav-tab-btn ${activeTab === 'REPORTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('REPORTS')}
        >
          <BarChart3 size={16} />
          <span>Báo Cáo & Doanh Thu</span>
        </button>

        <button 
          id="tab-cloud"
          className={`nav-tab-btn ${activeTab === 'CLOUD' ? 'active' : ''}`}
          onClick={() => setActiveTab('CLOUD')}
        >
          <Cloud size={16} />
          <span>Điện Toán Đám Mây (Cloud)</span>
        </button>

        {currentUser.role === 'ADMIN' && (
          <button 
            id="tab-users"
            className={`nav-tab-btn ${activeTab === 'USERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('USERS')}
          >
            <Users size={16} />
            <span>Phân Quyền Nhân Sự</span>
          </button>
        )}
      </nav>

      {/* Main Tab Content */}
      <main className="main-wrapper" style={{ flex: 1 }}>
        {activeTab === 'FLOOR_PLAN' && (
          <RoomFloorPlan 
            rooms={rooms}
            roomTypes={roomTypes}
            onSelectRoom={(room) => setSelectedRoomDetail(room)}
            onBookRoom={handleOpenBookingForRoom}
            onCheckInRoom={handleOpenCheckInForRoom}
            onCheckOutRoom={handleOpenCheckOutForRoom}
            onAddServiceRoom={handleOpenAddServiceForRoom}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onRoomCreated={loadAllData}
            userRole={currentUser.role}
          />
        )}

        {activeTab === 'ROOM_TYPES' && (
          <RoomTypesShowcase 
            roomTypes={roomTypes}
            rooms={rooms}
            onBookRoomType={handleBookRoomType}
            onViewRoomsOfType={handleViewRoomsOfType}
            onRoomTypeUpdated={loadAllData}
            userRole={currentUser.role}
          />
        )}

        {activeTab === 'BOOKINGS' && (
          <BookingManager 
            bookings={bookings}
            rooms={rooms}
            onOpenNewBookingModal={() => {
              setPreSelectedRoom(null);
              setPreSelectedRoomType('ALL');
              setIsNewBookingModalOpen(true);
            }}
            onCheckInFromBooking={handleCheckInFromBooking}
            onCancelBooking={handleCancelBooking}
            onBookingUpdated={loadAllData}
            userRole={currentUser.role}
          />
        )}

        {activeTab === 'CUSTOMERS' && (
          <CustomersManager currentUserRole={currentUser.role} />
        )}

        {activeTab === 'INVOICES' && (
          <InvoicesList 
            invoices={invoices}
            onViewInvoice={handleViewInvoice}
          />
        )}

        {activeTab === 'SERVICES' && (
          <ServicesManager 
            services={services}
            onServiceCreated={loadAllData}
          />
        )}

        {activeTab === 'REPORTS' && (
          <ReportsDashboard />
        )}

        {activeTab === 'CLOUD' && (
          <CloudOperations />
        )}

        {activeTab === 'USERS' && currentUser.role === 'ADMIN' && (
          <UserManager 
            users={users}
            onUserCreated={loadAllData}
            currentUserRole={currentUser.role}
          />
        )}
      </main>

      {/* Modal: New Booking */}
      <NewBookingModal 
        isOpen={isNewBookingModalOpen}
        onClose={() => {
          setIsNewBookingModalOpen(false);
          setPreSelectedRoomType('ALL');
        }}
        rooms={rooms}
        roomTypes={roomTypes}
        preSelectedRoom={preSelectedRoom}
        preSelectedRoomType={preSelectedRoomType}
        onBookingSuccess={() => {
          alert('Đặt phòng thành công! Đã ghi nhận lịch và ngăn ngừa trùng lịch.');
          loadAllData();
        }}
      />

      {/* Modal: Add Service to Room */}
      <AddServiceOrderModal 
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        room={serviceTargetRoom}
        services={services}
        onServiceAdded={(orderData) => {
          alert(`Đã thêm dịch vụ "${orderData.service_name}" cho phòng ${serviceTargetRoom?.room_number}!`);
          loadAllData();
        }}
      />

      {/* Modal: Invoice & Check-Out */}
      <InvoiceModal 
        isOpen={invoiceModalConfig.isOpen}
        onClose={() => setInvoiceModalConfig(prev => ({ ...prev, isOpen: false }))}
        stayId={invoiceModalConfig.stayId}
        invoiceId={invoiceModalConfig.invoiceId}
        isCheckoutMode={invoiceModalConfig.isCheckoutMode}
        onCheckoutSuccess={(data) => {
          alert(`Trả phòng và thanh toán thành công! Mã hóa đơn: ${data.invoice_code}`);
          loadAllData();
        }}
      />

      {/* Modal: Quick Check-In */}
      {isCheckInModalOpen && checkInTargetRoom && (
        <div className="modal-backdrop" onClick={() => setIsCheckInModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <LogIn size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>
                  Nhận Phòng: P.{checkInTargetRoom.room_number} ({checkInTargetRoom.type_name})
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCheckInModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWalkInCheckInSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {checkInTargetRoom.status === 'RESERVED' ? (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--status-reserved-border)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Phòng đã có lịch đặt trước
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      Hệ thống sẽ liên kết trực tiếp với thông tin đặt phòng đã xác nhận để hoàn tất thủ tục nhận phòng.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Họ và tên khách nhận phòng *</label>
                      <input 
                        id="walkin-name"
                        type="text" 
                        className="form-input" 
                        placeholder="Nguyễn Văn A" 
                        value={walkInName}
                        onChange={e => setWalkInName(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Số điện thoại *</label>
                        <input 
                          id="walkin-phone"
                          type="tel" 
                          className="form-input" 
                          placeholder="0912 345 678" 
                          value={walkInPhone}
                          onChange={e => setWalkInPhone(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Số CCCD / Hộ chiếu</label>
                        <input 
                          id="walkin-id"
                          type="text" 
                          className="form-input" 
                          placeholder="00120100xxxx" 
                          value={walkInIdentity}
                          onChange={e => setWalkInIdentity(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '0.85rem', 
                  borderRadius: '8px', 
                  fontSize: '0.85rem' 
                }}>
                  <div>Giá niêm yết: <strong style={{ color: '#f3e5ab' }}>{checkInTargetRoom.base_price?.toLocaleString('vi-VN')} đ / đêm</strong></div>
                  <div>Sức chứa: {checkInTargetRoom.capacity} khách • Tầng {checkInTargetRoom.floor}</div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCheckInModalOpen(false)}>
                  Hủy
                </button>
                <button id="confirm-walkin-checkin-btn" type="submit" className="btn btn-gold">
                  <CheckCircle size={16} />
                  <span>Xác Nhận Check-In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Room Details & Quick Actions */}
      {selectedRoomDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedRoomDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.35rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bed size={22} color="#d4af37" />
                Thông Tin Phòng {selectedRoomDetail.room_number} - {selectedRoomDetail.type_name}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRoomDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <img 
                src={selectedRoomDetail.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'} 
                alt="Room" 
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>Tầng: <strong style={{ color: '#fff' }}>Tầng {selectedRoomDetail.floor}</strong></div>
                <div>Sức chứa: <strong style={{ color: '#fff' }}>{selectedRoomDetail.capacity} người</strong></div>
                <div>Đơn giá: <strong style={{ color: '#f3e5ab' }}>{selectedRoomDetail.base_price?.toLocaleString('vi-VN')} đ / đêm</strong></div>
                <div>Trạng thái: <strong style={{ color: '#10b981' }}>{selectedRoomDetail.status}</strong></div>
              </div>

              {selectedRoomDetail.amenities && (
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#d4af37', fontWeight: 600, marginBottom: '0.35rem' }}>Tiện nghi phòng:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {selectedRoomDetail.amenities.map((a, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Change Selector for Housekeeping / Maintenance */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className="form-label">Cập nhật nhanh trạng thái phòng (Housekeeping / Kỹ thuật)</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateRoomStatus(selectedRoomDetail.id, 'AVAILABLE', 'Sẵn sàng đón khách')}
                  >
                    Trống (Available)
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateRoomStatus(selectedRoomDetail.id, 'CLEANING', 'Chờ dọn dẹp')}
                  >
                    Dọn dẹp (Cleaning)
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateRoomStatus(selectedRoomDetail.id, 'MAINTENANCE', 'Bảo trì trang thiết bị')}
                  >
                    Bảo trì (Maintenance)
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEditRoom(selectedRoomDetail)}
                  title="Chỉnh sửa số phòng, tầng hoặc loại phòng"
                >
                  <Edit2 size={14} />
                  <span>Sửa Thông Tin</span>
                </button>

                {currentUser.role === 'ADMIN' && selectedRoomDetail.status !== 'OCCUPIED' && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteRoom(selectedRoomDetail.id, selectedRoomDetail.room_number)}
                    title="Xóa phòng khỏi hệ thống"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                    <span>Xóa Phòng</span>
                  </button>
                )}
              </div>

              <button className="btn btn-secondary" onClick={() => setSelectedRoomDetail(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Room Information */}
      {editingRoom && (
        <div className="modal-backdrop" onClick={() => setEditingRoom(null)}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                Chỉnh Sửa Phòng {editingRoom.room_number}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingRoom(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoom}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Số phòng *</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={roomEditFormData.room_number}
                      onChange={e => setRoomEditFormData({ ...roomEditFormData, room_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tầng số *</label>
                    <input 
                      type="number"
                      min="1"
                      max="20"
                      className="form-input"
                      value={roomEditFormData.floor}
                      onChange={e => setRoomEditFormData({ ...roomEditFormData, floor: parseInt(e.target.value, 10) || 1 })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hạng phòng *</label>
                  <select 
                    className="form-select"
                    value={roomEditFormData.room_type_id}
                    onChange={e => setRoomEditFormData({ ...roomEditFormData, room_type_id: e.target.value })}
                  >
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({rt.id}) — {rt.base_price?.toLocaleString('vi-VN')} đ/đêm
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú phòng</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={roomEditFormData.notes}
                    onChange={e => setRoomEditFormData({ ...roomEditFormData, notes: e.target.value })}
                    placeholder="VD: Ban công rộng, view đẹp..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRoom(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-gold">
                  Lưu Thông Tin Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 24/7 AI Concierge Chatbot */}
      <HotelChatbot 
        viewMode={viewMode}
        user={user}
        onAction={handleChatbotAction}
      />
    </div>
  );
}

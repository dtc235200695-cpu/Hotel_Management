const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'hotelcloud.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for performance & integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    -- 1. Users / Accounts
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'RECEPTIONIST', 'MANAGER')),
      email TEXT,
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Room Types
    CREATE TABLE IF NOT EXISTS room_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      base_price INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      amenities TEXT,
      image TEXT
    );

    -- 3. Rooms
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      floor INTEGER NOT NULL,
      room_type_id TEXT NOT NULL REFERENCES room_types(id),
      status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE')),
      notes TEXT
    );

    -- 4. Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      identity_card TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      nationality TEXT DEFAULT 'Việt Nam',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      guests_count INTEGER DEFAULT 1,
      total_estimated_price INTEGER NOT NULL,
      deposit_amount INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
      special_requests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Stays (Lưu trú thực tế)
    CREATE TABLE IF NOT EXISTS stays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER REFERENCES bookings(id),
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      actual_check_in DATETIME DEFAULT CURRENT_TIMESTAMP,
      actual_check_out DATETIME,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED')),
      notes TEXT
    );

    -- 7. Services
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      unit TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- 8. Service Orders (Dịch vụ sử dụng trong kỳ lưu trú)
    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stay_id INTEGER NOT NULL REFERENCES stays(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    -- 9. Invoices (Hóa đơn thanh toán)
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_code TEXT UNIQUE NOT NULL,
      stay_id INTEGER NOT NULL REFERENCES stays(id),
      room_charge INTEGER NOT NULL,
      service_charge INTEGER NOT NULL DEFAULT 0,
      discount_amount INTEGER NOT NULL DEFAULT 0,
      deposit_deducted INTEGER NOT NULL DEFAULT 0,
      tax_amount INTEGER NOT NULL DEFAULT 0,
      final_total INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'CASH' CHECK(payment_method IN ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD')),
      payment_status TEXT DEFAULT 'PAID' CHECK(payment_status IN ('UNPAID', 'PAID', 'REFUNDED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'Lễ tân'
    );

    -- 10. Audit / Cloud Sync logs
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      performed_by TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('--- Khởi tạo dữ liệu mẫu HotelCloud ---');

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, full_name, role, email, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin123', 'Quản Trị Viên (Admin)', 'ADMIN', 'admin@hotelcloud.vn', '0901234567');
  insertUser.run('letan', 'letan123', 'Mai Anh (Lễ Tân)', 'RECEPTIONIST', 'maianh@hotelcloud.vn', '0912345678');
  insertUser.run('quanly', 'quanly123', 'Trần Đức Huy (Quản Lý)', 'MANAGER', 'duchuy@hotelcloud.vn', '0934567890');

  // Insert Room Types
  const insertRoomType = db.prepare(`
    INSERT INTO room_types (id, name, description, base_price, capacity, amenities, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertRoomType.run(
    'STD',
    'Standard Queen',
    'Phòng Tiêu Chuẩn ấm cúng, thiết kế hiện đại, đầy đủ tiện nghi thiết yếu cho chuyến công tác hoặc kỳ nghỉ ngắn.',
    450000,
    2,
    JSON.stringify(['WiFi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV 43 inch', 'Bình đun siêu tốc', 'Máy sấy tóc']),
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  );
  insertRoomType.run(
    'SUP',
    'Superior City View',
    'Phòng Nâng Cao với cửa sổ lớn hướng nhìn toàn cảnh thành phố rực rỡ, trang bị bàn làm việc rộng rãi.',
    750000,
    2,
    JSON.stringify(['WiFi tốc độ cao', 'Smart TV 50 inch', 'View Thành Phố', 'Bàn làm việc cao cấp', 'Két an toàn', 'Minibar']),
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
  );
  insertRoomType.run(
    'DLX',
    'Deluxe Ocean & Garden',
    'Phòng Sang Trọng có ban công riêng, bồn tắm nằm thư giãn và tầm nhìn ngắm cảnh biển hoặc vườn nhiệt đới.',
    1250000,
    3,
    JSON.stringify(['Ban công riêng', 'Bồn tắm nằm', 'View Biển / Vườn', 'Giường King Size', 'Loa Bluetooth', 'Minibar miễn phí đồ ăn nhẹ']),
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
  );
  insertRoomType.run(
    'SUT',
    'Executive Luxury Suite',
    'Căn hộ Suite cao cấp gồm phòng khách riêng biệt, phòng ngủ lớn, phòng tắm đá cẩm thạch sang trọng bậc nhất.',
    2200000,
    4,
    JSON.stringify(['Phòng khách riêng', 'Bồn tắm sục Jacuzzi', 'Máy pha cà phê Nespresso', 'Đặc quyền Executive Lounge', 'Check-in tại phòng']),
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'
  );
  insertRoomType.run(
    'PRE',
    'Presidential Royal Penthouse',
    'Biệt thự tầng thượng Hoàng Gia đẳng cấp 5 sao với tầm nhìn 360 độ, quản gia riêng và tiện nghi xa hoa nhất.',
    4800000,
    6,
    JSON.stringify(['Bể bơi vô cực mini riêng', 'Quản gia 24/7', 'Phòng xông hơi riêng', 'Bếp ăn & Phòng họp VIP', 'Rượu vang thượng hạng chào mừng']),
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
  );

  // Insert Rooms (Floors 1 to 4)
  const insertRoom = db.prepare(`
    INSERT INTO rooms (room_number, floor, room_type_id, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  // Floor 1
  insertRoom.run('101', 1, 'STD', 'AVAILABLE', 'Gần sảnh chính');
  insertRoom.run('102', 1, 'STD', 'AVAILABLE', 'Phòng yên tĩnh');
  insertRoom.run('103', 1, 'STD', 'CLEANING', 'Đang thay ga gối');
  insertRoom.run('104', 1, 'SUP', 'OCCUPIED', 'Khách gia đình check-in sớm');
  insertRoom.run('105', 1, 'STD', 'AVAILABLE', 'Phòng gần vườn hoa nội khu');
  insertRoom.run('106', 1, 'SUP', 'AVAILABLE', 'Phòng nâng cao, không gian yên tĩnh');
  
  // Floor 2
  insertRoom.run('201', 2, 'SUP', 'AVAILABLE', 'View công viên thoáng đãng');
  insertRoom.run('202', 2, 'SUP', 'RESERVED', 'Khách VIP đặt trước chiều nay');
  insertRoom.run('203', 2, 'DLX', 'OCCUPIED', 'Khách quốc tế');
  insertRoom.run('204', 2, 'DLX', 'AVAILABLE', 'Ban công đón nắng sớm');
  insertRoom.run('205', 2, 'SUP', 'AVAILABLE', 'View công viên trung tâm');
  insertRoom.run('206', 2, 'DLX', 'AVAILABLE', 'Ban công rộng ngắm hoàng hôn');

  // Floor 3
  insertRoom.run('301', 3, 'DLX', 'AVAILABLE', 'Bồn tắm view biển');
  insertRoom.run('302', 3, 'DLX', 'RESERVED', 'Hội nghị khách hàng');
  insertRoom.run('303', 3, 'SUT', 'OCCUPIED', 'Khách VIP doanh nhân');
  insertRoom.run('304', 3, 'SUT', 'AVAILABLE', 'Mới hoàn thiện trang trí');
  insertRoom.run('305', 3, 'DLX', 'AVAILABLE', 'Bồn tắm view biển toàn cảnh');
  insertRoom.run('306', 3, 'SUT', 'AVAILABLE', 'Suite doanh nhân sang trọng');

  // Floor 4
  insertRoom.run('401', 4, 'SUT', 'AVAILABLE', 'Góc nhìn panorama tuyệt đẹp');
  insertRoom.run('402', 4, 'PRE', 'AVAILABLE', 'Căn Penthouse sang trọng tầng 4');
  insertRoom.run('403', 4, 'SUT', 'AVAILABLE', 'Executive Suite góc 2 mặt thoáng');
  insertRoom.run('404', 4, 'SUT', 'AVAILABLE', 'Phòng Suite phong cách tân cổ điển');
  insertRoom.run('405', 4, 'PRE', 'AVAILABLE', 'Royal Suite cao cấp tầng 4');

  // Floor 5 (Tầng Thượng Hoàng Gia & Sky Villa)
  insertRoom.run('501', 5, 'SUT', 'AVAILABLE', 'Sky Executive Suite ngắm bình minh');
  insertRoom.run('502', 5, 'PRE', 'AVAILABLE', 'Royal Presidential Villa có hồ bơi riêng');
  insertRoom.run('503', 5, 'PRE', 'AVAILABLE', 'Diamond Sky Villa đẳng cấp 5 sao');
  insertRoom.run('504', 5, 'PRE', 'AVAILABLE', 'Presidential Penthouse hướng biển 360 độ');

  // Insert Services
  const insertService = db.prepare(`
    INSERT INTO services (name, category, price, unit, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertService.run('Bữa sáng Buffet Á - Âu', 'Ẩm thực', 150000, 'Suất', 'Thực đơn hơn 40 món đặc sản phong phú');
  insertService.run('Giặt là lấy nhanh cao cấp', 'Giặt là', 45000, 'Kg', 'Giặt sấy ủi hơi nước cẩn thận trong 3 giờ');
  insertService.run('Đưa đón sân bay (Xe 4 chỗ VIP)', 'Di chuyển', 250000, 'Lượt', 'Xe Sedan đời mới đưa đón tận sảnh bay');
  insertService.run('Massage trị liệu & Thư giãn Spa (60p)', 'Thư giãn & Spa', 350000, 'Buổi', 'Liệu trình tinh dầu thảo mộc organic');
  insertService.run('Thuê xe máy tay ga du lịch', 'Di chuyển', 150000, 'Ngày', 'Xe tay ga đầy bình xăng kèm mũ bảo hiểm');
  insertService.run('Minibar Nước ngọt & Nước ép', 'Ẩm thực', 30000, 'Lon/Chai', 'Nước ép cam, Coca, 7Up, Redbull ướp lạnh');
  insertService.run('Bia & Rượu vang nhẹ phòng ngủ', 'Ẩm thực', 60000, 'Lon/Ly', 'Bia Heineken/Budweiser hoặc ly vang Chile');
  insertService.run('Trang trí phòng trăng mật lãng mạn', 'Dịch vụ đặc biệt', 400000, 'Gói', 'Bóng bay, cánh hoa hồng, bánh kem & nến thơm');

  // Insert Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (full_name, identity_card, phone, email, address, nationality, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCustomer.run('Nguyễn Văn An', '001201004567', '0912345678', 'an.nguyen@gmail.com', 'Ba Đình, Hà Nội', 'Việt Nam', 'Khách hàng thân thiết');
  insertCustomer.run('Trần Thị Thu Hà', '079198007890', '0987654321', 'thuha.tran@outlook.com', 'Quận 1, TP. Hồ Chí Minh', 'Việt Nam', 'Yêu cầu phòng tầng cao');
  insertCustomer.run('David Robert Wilson', 'B89432101', '+44 7911 123456', 'david.wilson@uktravel.com', 'London, UK', 'United Kingdom', 'Khách thích ăn chay');
  insertCustomer.run('Lê Hoàng Nam', '036200001234', '0905123987', 'hoangnam.le@company.vn', 'Hải Châu, Đà Nẵng', 'Việt Nam', 'Khách đi công tác');

  // Insert Today's Date Strings
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextThreeDays = new Date(today);
  nextThreeDays.setDate(nextThreeDays.getDate() + 3);

  const fmt = (d) => d.toISOString().split('T')[0];

  // Insert Seed Bookings
  const insertBooking = db.prepare(`
    INSERT INTO bookings (booking_code, customer_id, room_id, check_in_date, check_out_date, guests_count, total_estimated_price, deposit_amount, status, special_requests)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Booking 1: Check-in occupied room 104
  insertBooking.run(
    'BK-' + fmt(today).replace(/-/g, '') + '-104',
    1, // Nguyễn Văn An
    4, // Room 104 (SUP)
    fmt(today),
    fmt(nextThreeDays),
    2,
    750000 * 3,
    500000,
    'CHECKED_IN',
    'Cần phòng yên tĩnh cho trẻ nhỏ'
  );

  // Booking 2: Check-in occupied room 203
  insertBooking.run(
    'BK-' + fmt(today).replace(/-/g, '') + '-203',
    3, // David Wilson
    7, // Room 203 (DLX)
    fmt(today),
    fmt(tomorrow),
    2,
    1250000 * 1,
    1250000,
    'CHECKED_IN',
    'Hỗ trợ xuất hóa đơn công ty'
  );

  // Booking 3: Check-in occupied room 303
  insertBooking.run(
    'BK-' + fmt(today).replace(/-/g, '') + '-303',
    4, // Lê Hoàng Nam
    11, // Room 303 (SUT)
    fmt(today),
    fmt(nextThreeDays),
    1,
    2200000 * 3,
    2000000,
    'CHECKED_IN',
    'Đưa đón sân bay lúc 18h'
  );

  // Booking 4: Reserved room 202
  insertBooking.run(
    'BK-' + fmt(today).replace(/-/g, '') + '-202',
    2, // Trần Thị Thu Hà
    6, // Room 202 (SUP)
    fmt(tomorrow),
    fmt(nextThreeDays),
    2,
    750000 * 2,
    500000,
    'CONFIRMED',
    'Nhận phòng buổi trưa'
  );

  // Insert Stays for the checked-in rooms
  const insertStay = db.prepare(`
    INSERT INTO stays (booking_id, room_id, customer_id, actual_check_in, status, notes)
    VALUES (?, ?, ?, datetime('now', '-4 hours'), 'ACTIVE', ?)
  `);
  const stay1 = insertStay.run(1, 4, 1, 'Đã nhận chìa khóa phòng 104');
  const stay2 = insertStay.run(2, 7, 3, 'Khách ngoại quốc cần hướng dẫn viên');
  const stay3 = insertStay.run(3, 11, 4, 'Đã giao thẻ phòng VIP');

  // Insert Service Orders for stay1
  const insertOrder = db.prepare(`
    INSERT INTO service_orders (stay_id, service_id, quantity, unit_price, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run(stay1.lastInsertRowid, 1, 2, 150000, 300000, 'Buffet sáng cho 2 người');
  insertOrder.run(stay1.lastInsertRowid, 6, 4, 30000, 120000, 'Minibar nước ngọt tại phòng');
  
  // Insert Service Orders for stay2
  insertOrder.run(stay2.lastInsertRowid, 3, 1, 250000, 250000, 'Đưa đón sân bay quốc tế');
  insertOrder.run(stay2.lastInsertRowid, 4, 1, 350000, 350000, 'Massage thư giãn buổi chiều');

  // Insert a completed invoice for history demo
  const pastStay = db.prepare(`
    INSERT INTO stays (booking_id, room_id, customer_id, actual_check_in, actual_check_out, status, notes)
    VALUES (NULL, 1, 2, datetime('now', '-2 days'), datetime('now', '-1 days'), 'COMPLETED', 'Đã thanh toán đầy đủ')
  `).run();

  db.prepare(`
    INSERT INTO invoices (invoice_code, stay_id, room_charge, service_charge, discount_amount, deposit_deducted, tax_amount, final_total, payment_method, payment_status, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'), 'Lễ tân')
  `).run(
    'INV-PAST-001',
    pastStay.lastInsertRowid,
    450000,
    150000,
    0,
    0,
    60000,
    660000,
    'BANK_TRANSFER',
    'PAID'
  );

  // Initial Log
  db.prepare(`
    INSERT INTO system_logs (action, details, performed_by)
    VALUES ('SYSTEM_INIT', 'Khởi tạo hệ thống cơ sở dữ liệu HotelCloud thành công trên Cloud Storage', 'SYSTEM')
  `).run();

  console.log('--- Hoàn tất khởi tạo dữ liệu mẫu ---');
}

// Call initialization
initDb();

module.exports = db;

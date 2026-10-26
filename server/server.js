const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger for cloud latency measurement
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      // Keep track of average API response time
      app.locals.lastDuration = duration;
    }
  });
  next();
});

// Helper for audit logging
function logSystemAction(action, details, performed_by = 'System') {
  try {
    db.prepare(`
      INSERT INTO system_logs (action, details, performed_by)
      VALUES (?, ?, ?)
    `).run(action, details, performed_by);
  } catch (err) {
    console.error('Error logging system action:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  // Record login event
  logSystemAction('USER_LOGIN', `Người dùng ${user.full_name} (${user.role}) đăng nhập thành công`, user.full_name);

  const { password: _, ...safeUser } = user;
  res.json({
    message: 'Đăng nhập thành công',
    user: safeUser,
    token: `token-${user.id}-${Date.now()}`
  });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, role, email, phone, created_at FROM users ORDER BY id ASC').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { username, password, full_name, role, email, phone } = req.body;
  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Vui lòng điền đủ các trường bắt buộc' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, full_name, role, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, password, full_name, role, email || '', phone || '');

    logSystemAction('USER_CREATE', `Tạo tài khoản mới: ${username} (${role})`, 'Admin');
    res.json({ message: 'Tạo tài khoản thành công', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ROOMS & ROOM TYPES
// ==========================================
app.get('/api/rooms/types', (req, res) => {
  const types = db.prepare('SELECT * FROM room_types').all();
  const parsedTypes = types.map(t => ({
    ...t,
    amenities: t.amenities ? JSON.parse(t.amenities) : []
  }));
  res.json(parsedTypes);
});

app.get('/api/rooms', (req, res) => {
  const query = `
    SELECT 
      r.id, r.room_number, r.floor, r.status, r.notes,
      rt.id as type_id, rt.name as type_name, rt.base_price, rt.capacity, rt.amenities, rt.image,
      s.id as active_stay_id, s.actual_check_in,
      c.id as customer_id, c.full_name as customer_name, c.phone as customer_phone
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN stays s ON r.id = s.room_id AND s.status = 'ACTIVE'
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY r.floor ASC, r.room_number ASC
  `;
  const rooms = db.prepare(query).all();
  const result = rooms.map(r => ({
    ...r,
    amenities: r.amenities ? JSON.parse(r.amenities) : []
  }));
  res.json(result);
});

app.post('/api/rooms', (req, res) => {
  const { room_number, floor, room_type_id, status, notes } = req.body;
  if (!room_number || !floor || !room_type_id) {
    return res.status(400).json({ error: 'Thiếu thông tin số phòng, tầng hoặc loại phòng' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO rooms (room_number, floor, room_type_id, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(room_number, floor, room_type_id, status || 'AVAILABLE', notes || '');

    logSystemAction('ROOM_CREATE', `Thêm mới phòng ${room_number} (Tầng ${floor})`, 'Admin');
    res.json({ message: 'Thêm phòng thành công', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: `Số phòng ${room_number} đã tồn tại` });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rooms/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const allowed = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái phòng không hợp lệ' });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });

  db.prepare('UPDATE rooms SET status = ?, notes = COALESCE(?, notes) WHERE id = ?').run(status, notes, id);
  logSystemAction('ROOM_STATUS_CHANGE', `Đổi trạng thái phòng ${room.room_number} sang ${status}`, 'Staff');
  res.json({ message: 'Cập nhật trạng thái phòng thành công' });
});

// Update Room Information (Number, Floor, Type, Notes)
app.put('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  const { room_number, floor, room_type_id, status, notes } = req.body;
  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy phòng' });

  try {
    db.prepare(`
      UPDATE rooms 
      SET room_number = COALESCE(?, room_number),
          floor = COALESCE(?, floor),
          room_type_id = COALESCE(?, room_type_id),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(room_number, floor, room_type_id, status, notes, id);

    logSystemAction('ROOM_UPDATE', `Cập nhật thông tin phòng ${room_number || existing.room_number}`, 'Admin');
    res.json({ message: 'Cập nhật phòng thành công' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: `Số phòng ${room_number} đã tồn tại` });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete Room
app.delete('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });

  // Check if room has active stay
  const activeStay = db.prepare("SELECT id FROM stays WHERE room_id = ? AND status = 'ACTIVE'").get(id);
  if (activeStay) {
    return res.status(400).json({ error: 'Không thể xóa phòng đang có khách lưu trú' });
  }

  try {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    logSystemAction('ROOM_DELETE', `Xóa phòng ${room.room_number}`, 'Admin');
    res.json({ message: 'Đã xóa phòng thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa phòng do đã có lịch sử dữ liệu liên kết: ' + err.message });
  }
});

// Update Room Type (Pricing, Capacity, Amenities, etc.)
app.put('/api/rooms/types/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, base_price, capacity, amenities, image } = req.body;
  const existing = db.prepare('SELECT * FROM room_types WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy hạng phòng' });

  try {
    const amenitiesStr = Array.isArray(amenities) ? JSON.stringify(amenities) : (amenities || existing.amenities);
    db.prepare(`
      UPDATE room_types
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          base_price = COALESCE(?, base_price),
          capacity = COALESCE(?, capacity),
          amenities = COALESCE(?, amenities),
          image = COALESCE(?, image)
      WHERE id = ?
    `).run(name, description, base_price, capacity, amenitiesStr, image, id);

    logSystemAction('ROOM_TYPE_UPDATE', `Cập nhật hạng phòng ${name || existing.name} (ID: ${id})`, 'Admin');
    res.json({ message: 'Cập nhật hạng phòng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create New Room Type
app.post('/api/rooms/types', (req, res) => {
  const { id, name, description, base_price, capacity, amenities, image } = req.body;
  if (!id || !name || !base_price) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã hạng phòng, tên và đơn giá' });
  }

  try {
    const amenitiesStr = Array.isArray(amenities) ? JSON.stringify(amenities) : '[]';
    db.prepare(`
      INSERT INTO room_types (id, name, description, base_price, capacity, amenities, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id.toUpperCase().trim(), name, description || '', base_price, capacity || 2, amenitiesStr, image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80');

    logSystemAction('ROOM_TYPE_CREATE', `Thêm mới hạng phòng ${name} (${id})`, 'Admin');
    res.json({ message: 'Tạo hạng phòng thành công' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: `Mã hạng phòng ${id} đã tồn tại` });
    }
    res.status(500).json({ error: err.message });
  }
});

// Check available rooms in a date range with anti-collision
app.get('/api/rooms/available', (req, res) => {
  const { check_in, check_out, room_type_id } = req.query;
  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ngày check-in và check-out' });
  }

  let sql = `
    SELECT r.*, rt.name as type_name, rt.base_price, rt.capacity, rt.amenities, rt.image
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE r.status != 'MAINTENANCE'
      AND r.id NOT IN (
        SELECT b.room_id FROM bookings b
        WHERE b.status NOT IN ('CANCELLED', 'CHECKED_OUT')
          AND NOT (b.check_out_date <= ? OR b.check_in_date >= ?)
      )
  `;
  const params = [check_in, check_out];

  if (room_type_id) {
    sql += ' AND r.room_type_id = ?';
    params.push(room_type_id);
  }

  sql += ' ORDER BY r.floor ASC, r.room_number ASC';
  const availableRooms = db.prepare(sql).all(...params);
  res.json(availableRooms.map(r => ({ ...r, amenities: r.amenities ? JSON.parse(r.amenities) : [] })));
});

// ==========================================
// 3. BOOKINGS & ANTI-COLLISION
// ==========================================
app.get('/api/bookings', (req, res) => {
  const query = `
    SELECT 
      b.*,
      c.full_name as customer_name, c.phone as customer_phone, c.identity_card, c.email as customer_email,
      r.room_number, r.floor,
      rt.name as room_type_name, rt.base_price
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    ORDER BY b.id DESC
  `;
  const bookings = db.prepare(query).all();
  res.json(bookings);
});

// Public reservation lookup by booking code or phone number
app.get('/api/bookings/lookup', (req, res) => {
  const { code, phone } = req.query;
  if (!code && !phone) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã đặt phòng hoặc số điện thoại' });
  }

  let query = `
    SELECT 
      b.id, b.booking_code, b.check_in_date, b.check_out_date, b.guests_count,
      b.total_estimated_price, b.deposit_amount, b.status, b.special_requests, b.created_at,
      c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
      r.room_number, r.floor,
      rt.name as room_type_name, rt.base_price, rt.amenities, rt.image
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE 1=1
  `;
  const params = [];
  if (code) {
    query += ' AND UPPER(b.booking_code) = UPPER(?)';
    params.push(code.trim());
  }
  if (phone) {
    query += ' AND c.phone LIKE ?';
    params.push(`%${phone.trim()}%`);
  }
  query += ' ORDER BY b.id DESC LIMIT 5';

  try {
    const list = db.prepare(query).all(...params);
    const parsed = list.map(item => ({
      ...item,
      amenities: item.amenities ? JSON.parse(item.amenities) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create booking with strict collision prevention
app.post('/api/bookings', (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_phone,
    customer_identity,
    customer_email,
    room_id,
    check_in_date,
    check_out_date,
    guests_count,
    deposit_amount,
    special_requests
  } = req.body;

  if (!room_id || !check_in_date || !check_out_date) {
    return res.status(400).json({ error: 'Vui lòng chọn phòng và khoảng thời gian' });
  }

  if (new Date(check_in_date) >= new Date(check_out_date)) {
    return res.status(400).json({ error: 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày' });
  }

  // 1. Strict Anti-Collision Check
  const collisionQuery = `
    SELECT b.*, r.room_number 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.room_id = ?
      AND b.status NOT IN ('CANCELLED', 'CHECKED_OUT')
      AND NOT (b.check_out_date <= ? OR b.check_in_date >= ?)
  `;
  const conflicting = db.prepare(collisionQuery).get(room_id, check_in_date, check_out_date);
  if (conflicting) {
    return res.status(409).json({
      error: `Phòng ${conflicting.room_number} đã có lịch đặt từ ${conflicting.check_in_date} đến ${conflicting.check_out_date} (Mã: ${conflicting.booking_code}). Vui lòng chọn ngày hoặc phòng khác.`,
      conflict: conflicting
    });
  }

  // 2. Identify or Create Customer
  let finalCustomerId = customer_id;
  if (!finalCustomerId) {
    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Vui lòng cung cấp họ tên và số điện thoại khách hàng' });
    }
    // Check if customer with phone or id card already exists
    let existingCust = db.prepare('SELECT id FROM customers WHERE phone = ? OR identity_card = ?').get(customer_phone, customer_identity || 'N/A');
    if (existingCust) {
      finalCustomerId = existingCust.id;
    } else {
      const custResult = db.prepare(`
        INSERT INTO customers (full_name, identity_card, phone, email)
        VALUES (?, ?, ?, ?)
      `).run(customer_name, customer_identity || 'Chưa cập nhật', customer_phone, customer_email || '');
      finalCustomerId = custResult.lastInsertRowid;
    }
  }

  // 3. Calculate Estimated Total
  const room = db.prepare(`
    SELECT r.room_number, rt.base_price 
    FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id 
    WHERE r.id = ?
  `).get(room_id);

  const start = new Date(check_in_date);
  const end = new Date(check_out_date);
  const diffNights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const total_estimated_price = diffNights * room.base_price;

  // Generate Booking Code
  const bookingCode = `BK-${check_in_date.replace(/-/g, '')}-${room.room_number}-${Math.floor(100 + Math.random() * 900)}`;

  try {
    const result = db.prepare(`
      INSERT INTO bookings (
        booking_code, customer_id, room_id, check_in_date, check_out_date,
        guests_count, total_estimated_price, deposit_amount, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
    `).run(
      bookingCode,
      finalCustomerId,
      room_id,
      check_in_date,
      check_out_date,
      guests_count || 1,
      total_estimated_price,
      deposit_amount || 0,
      special_requests || ''
    );

    // If booking starts today, update room status to RESERVED if currently AVAILABLE
    const todayStr = new Date().toISOString().split('T')[0];
    if (check_in_date === todayStr) {
      db.prepare(`UPDATE rooms SET status = 'RESERVED' WHERE id = ? AND status = 'AVAILABLE'`).run(room_id);
    }

    logSystemAction('BOOKING_CREATE', `Tạo đơn đặt phòng ${bookingCode} cho phòng ${room.room_number} (${diffNights} đêm)`, 'Receptionist');

    res.json({
      message: 'Đặt phòng thành công',
      booking_id: result.lastInsertRowid,
      booking_code: bookingCode,
      total_estimated_price,
      nights: diffNights
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking details
app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { room_id, check_in_date, check_out_date, guests_count, deposit_amount, special_requests, status } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng' });

  const finalRoomId = room_id || booking.room_id;
  const finalCheckIn = check_in_date || booking.check_in_date;
  const finalCheckOut = check_out_date || booking.check_out_date;

  if (new Date(finalCheckIn) >= new Date(finalCheckOut)) {
    return res.status(400).json({ error: 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày' });
  }

  // Anti-collision check (excluding current booking)
  const collisionQuery = `
    SELECT b.*, r.room_number 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.room_id = ?
      AND b.id != ?
      AND b.status NOT IN ('CANCELLED', 'CHECKED_OUT')
      AND NOT (b.check_out_date <= ? OR b.check_in_date >= ?)
  `;
  const conflicting = db.prepare(collisionQuery).get(finalRoomId, id, finalCheckIn, finalCheckOut);
  if (conflicting) {
    return res.status(409).json({
      error: `Phòng ${conflicting.room_number} đã có lịch đặt từ ${conflicting.check_in_date} đến ${conflicting.check_out_date} (Mã: ${conflicting.booking_code}).`,
      conflict: conflicting
    });
  }

  // Calculate new total estimated price
  const room = db.prepare(`
    SELECT r.room_number, rt.base_price 
    FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id 
    WHERE r.id = ?
  `).get(finalRoomId);

  const start = new Date(finalCheckIn);
  const end = new Date(finalCheckOut);
  const diffNights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const total_estimated_price = diffNights * room.base_price;

  try {
    db.prepare(`
      UPDATE bookings
      SET room_id = ?,
          check_in_date = ?,
          check_out_date = ?,
          guests_count = COALESCE(?, guests_count),
          deposit_amount = COALESCE(?, deposit_amount),
          special_requests = COALESCE(?, special_requests),
          status = COALESCE(?, status),
          total_estimated_price = ?
      WHERE id = ?
    `).run(finalRoomId, finalCheckIn, finalCheckOut, guests_count, deposit_amount, special_requests, status, total_estimated_price, id);

    logSystemAction('BOOKING_UPDATE', `Cập nhật đơn đặt phòng ${booking.booking_code}`, 'Receptionist');
    res.json({ message: 'Cập nhật đơn đặt phòng thành công', total_estimated_price, nights: diffNights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy đơn đặt phòng' });

  db.prepare(`UPDATE bookings SET status = 'CANCELLED' WHERE id = ?`).run(id);

  // If room is reserved for this booking, set back to AVAILABLE if not occupied
  db.prepare(`UPDATE rooms SET status = 'AVAILABLE' WHERE id = ? AND status = 'RESERVED'`).run(booking.room_id);

  logSystemAction('BOOKING_CANCEL', `Hủy đơn đặt phòng ${booking.booking_code}`, 'Receptionist');
  res.json({ message: 'Đã hủy đơn đặt phòng thành công' });
});

// ==========================================
// 3.5. CUSTOMERS & STAY HISTORY
// ==========================================
app.get('/api/customers', (req, res) => {
  const { search } = req.query;
  let sql = `
    SELECT 
      c.*,
      COUNT(DISTINCT s.id) as stays_count,
      COUNT(DISTINCT b.id) as bookings_count,
      COALESCE(SUM(i.final_total), 0) as total_spent,
      MAX(s.actual_check_in) as last_stay_date
    FROM customers c
    LEFT JOIN stays s ON c.id = s.customer_id
    LEFT JOIN bookings b ON c.id = b.customer_id
    LEFT JOIN invoices i ON s.id = i.stay_id AND i.payment_status = 'PAID'
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.identity_card LIKE ? OR c.email LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  sql += ` GROUP BY c.id ORDER BY c.id DESC`;

  try {
    const customers = db.prepare(sql).all(...params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  // Get stay history
  const stays = db.prepare(`
    SELECT s.*, r.room_number, r.floor, rt.name as room_type_name,
           i.invoice_code, i.final_total, i.payment_status
    FROM stays s
    JOIN rooms r ON s.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN invoices i ON s.id = i.stay_id
    WHERE s.customer_id = ?
    ORDER BY s.id DESC
  `).all(id);

  // Get booking history
  const bookings = db.prepare(`
    SELECT b.*, r.room_number, rt.name as room_type_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE b.customer_id = ?
    ORDER BY b.id DESC
  `).all(id);

  res.json({
    customer,
    stays,
    bookings
  });
});

app.post('/api/customers', (req, res) => {
  const { full_name, identity_card, phone, email, address, nationality, notes } = req.body;
  if (!full_name || !phone) {
    return res.status(400).json({ error: 'Vui lòng cung cấp họ tên và số điện thoại khách hàng' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO customers (full_name, identity_card, phone, email, address, nationality, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(full_name.trim(), identity_card?.trim() || 'Chưa cập nhật', phone.trim(), email?.trim() || '', address?.trim() || '', nationality?.trim() || 'Việt Nam', notes?.trim() || '');

    logSystemAction('CUSTOMER_CREATE', `Thêm hồ sơ khách hàng ${full_name} (${phone})`, 'Receptionist');
    res.json({ message: 'Thêm khách hàng thành công', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, identity_card, phone, email, address, nationality, notes } = req.body;
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  try {
    db.prepare(`
      UPDATE customers
      SET full_name = COALESCE(?, full_name),
          identity_card = COALESCE(?, identity_card),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          nationality = COALESCE(?, nationality),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(full_name, identity_card, phone, email, address, nationality, notes, id);

    logSystemAction('CUSTOMER_UPDATE', `Cập nhật hồ sơ khách hàng ${full_name || customer.full_name}`, 'Receptionist');
    res.json({ message: 'Cập nhật thông tin khách hàng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  // Check active stays
  const activeStay = db.prepare("SELECT id FROM stays WHERE customer_id = ? AND status = 'ACTIVE'").get(id);
  if (activeStay) {
    return res.status(400).json({ error: 'Khách hàng đang trong kỳ lưu trú tại khách sạn, không thể xóa' });
  }

  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    logSystemAction('CUSTOMER_DELETE', `Xóa hồ sơ khách hàng ${customer.full_name}`, 'Admin');
    res.json({ message: 'Đã xóa khách hàng thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa khách hàng do có hóa đơn hoặc dữ liệu liên kết: ' + err.message });
  }
});

// ==========================================
// 4. CHECK-IN, CHECK-OUT & STAYS
// ==========================================
app.post('/api/stays/check-in', (req, res) => {
  const { booking_id, room_id, customer_id, customer_name, customer_phone, customer_identity, notes } = req.body;

  let targetRoomId = room_id;
  let targetCustomerId = customer_id;
  let linkedBooking = null;

  if (booking_id) {
    linkedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
    if (!linkedBooking) return res.status(404).json({ error: 'Không tìm thấy thông tin đặt phòng' });
    targetRoomId = linkedBooking.room_id;
    targetCustomerId = linkedBooking.customer_id;
  } else {
    // Walk-in check-in
    if (!targetRoomId) return res.status(400).json({ error: 'Vui lòng chọn phòng để nhận' });
    if (!targetCustomerId) {
      if (!customer_name || !customer_phone) {
        return res.status(400).json({ error: 'Vui lòng nhập họ tên và số điện thoại khách nhận phòng' });
      }
      const custResult = db.prepare(`
        INSERT INTO customers (full_name, identity_card, phone)
        VALUES (?, ?, ?)
      `).run(customer_name, customer_identity || 'Tại quầy', customer_phone);
      targetCustomerId = custResult.lastInsertRowid;
    }
  }

  // Check room status
  const currentRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(targetRoomId);
  if (currentRoom.status === 'OCCUPIED') {
    return res.status(400).json({ error: `Phòng ${currentRoom.room_number} đang có khách lưu trú!` });
  }

  try {
    // 1. Create Stay Record
    const stayResult = db.prepare(`
      INSERT INTO stays (booking_id, room_id, customer_id, actual_check_in, status, notes)
      VALUES (?, ?, ?, datetime('now', 'localtime'), 'ACTIVE', ?)
    `).run(booking_id || null, targetRoomId, targetCustomerId, notes || 'Check-in thành công');

    // 2. Update Room Status to OCCUPIED
    db.prepare(`UPDATE rooms SET status = 'OCCUPIED' WHERE id = ?`).run(targetRoomId);

    // 3. Update Booking Status to CHECKED_IN
    if (booking_id) {
      db.prepare(`UPDATE bookings SET status = 'CHECKED_IN' WHERE id = ?`).run(booking_id);
    }

    logSystemAction('CHECK_IN', `Khách nhận phòng ${currentRoom.room_number} (Mã Stay: ${stayResult.lastInsertRowid})`, 'Receptionist');

    res.json({
      message: 'Nhận phòng (Check-in) thành công',
      stay_id: stayResult.lastInsertRowid,
      room_number: currentRoom.room_number
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stay summary calculation for checkout
app.get('/api/stays/:id/summary', (req, res) => {
  const { id } = req.params;
  const stay = db.prepare(`
    SELECT s.*, r.room_number, rt.name as room_type_name, rt.base_price,
           c.full_name as customer_name, c.phone as customer_phone, c.identity_card,
           b.booking_code, b.deposit_amount, b.check_in_date, b.check_out_date
    FROM stays s
    JOIN rooms r ON s.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    JOIN customers c ON s.customer_id = c.id
    LEFT JOIN bookings b ON s.booking_id = b.id
    WHERE s.id = ?
  `).get(id);

  if (!stay) return res.status(404).json({ error: 'Không tìm thấy phiên lưu trú' });

  // Calculate actual nights (minimum 1 night)
  const checkIn = new Date(stay.actual_check_in);
  const now = new Date();
  const diffHours = (now - checkIn) / (1000 * 60 * 60);
  const nights = Math.max(1, Math.ceil(diffHours / 24));
  const room_charge = nights * stay.base_price;

  // Get all services ordered
  const services = db.prepare(`
    SELECT so.*, s.name as service_name, s.unit
    FROM service_orders so
    JOIN services s ON so.service_id = s.id
    WHERE so.stay_id = ?
    ORDER BY so.order_time DESC
  `).all(id);

  const service_charge = services.reduce((sum, item) => sum + item.total_price, 0);
  const deposit_deducted = stay.deposit_amount || 0;
  const subtotal = room_charge + service_charge - deposit_deducted;
  const tax_amount = Math.round(subtotal * 0.08); // 8% VAT
  const final_total = Math.max(0, subtotal + tax_amount);

  res.json({
    stay,
    nights,
    room_charge,
    services,
    service_charge,
    deposit_deducted,
    tax_amount,
    final_total
  });
});

// Check-out & create invoice
app.post('/api/stays/:id/check-out', (req, res) => {
  const { id } = req.params;
  const { discount_amount = 0, payment_method = 'CASH', created_by = 'Lễ tân' } = req.body;

  const stay = db.prepare(`
    SELECT s.*, r.room_number, rt.base_price, b.deposit_amount
    FROM stays s
    JOIN rooms r ON s.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN bookings b ON s.booking_id = b.id
    WHERE s.id = ? AND s.status = 'ACTIVE'
  `).get(id);

  if (!stay) return res.status(404).json({ error: 'Không tìm thấy phiên lưu trú đang hoạt động' });

  // Calculate nights
  const checkIn = new Date(stay.actual_check_in);
  const now = new Date();
  const diffHours = (now - checkIn) / (1000 * 60 * 60);
  const nights = Math.max(1, Math.ceil(diffHours / 24));
  const room_charge = nights * stay.base_price;

  // Services
  const serviceOrders = db.prepare('SELECT sum(total_price) as total FROM service_orders WHERE stay_id = ?').get(id);
  const service_charge = serviceOrders.total || 0;
  const deposit_deducted = stay.deposit_amount || 0;

  const subtotal = room_charge + service_charge - deposit_deducted - (discount_amount || 0);
  const tax_amount = Math.round(subtotal * 0.08);
  const final_total = Math.max(0, subtotal + tax_amount);

  const invoiceCode = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${stay.room_number}-${Math.floor(100 + Math.random() * 900)}`;

  try {
    // 1. Create Invoice
    const invoiceResult = db.prepare(`
      INSERT INTO invoices (
        invoice_code, stay_id, room_charge, service_charge, discount_amount,
        deposit_deducted, tax_amount, final_total, payment_method, payment_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?)
    `).run(
      invoiceCode,
      id,
      room_charge,
      service_charge,
      discount_amount,
      deposit_deducted,
      tax_amount,
      final_total,
      payment_method,
      created_by
    );

    // 2. Mark Stay as COMPLETED
    db.prepare(`UPDATE stays SET status = 'COMPLETED', actual_check_out = datetime('now', 'localtime') WHERE id = ?`).run(id);

    // 3. Mark Booking as CHECKED_OUT if linked
    if (stay.booking_id) {
      db.prepare(`UPDATE bookings SET status = 'CHECKED_OUT' WHERE id = ?`).run(stay.booking_id);
    }

    // 4. Update Room Status to CLEANING for housekeeping
    db.prepare(`UPDATE rooms SET status = 'CLEANING', notes = 'Chờ dọn phòng sau khi trả' WHERE id = ?`).run(stay.room_id);

    logSystemAction('CHECK_OUT', `Khách trả phòng ${stay.room_number}, xuất hóa đơn ${invoiceCode} tổng ${final_total.toLocaleString('vi-VN')} đ`, created_by);

    res.json({
      message: 'Trả phòng và thanh toán thành công',
      invoice_id: invoiceResult.lastInsertRowid,
      invoice_code: invoiceCode,
      final_total,
      room_number: stay.room_number
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. SERVICES & ORDERS
// ==========================================
app.get('/api/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY category ASC, price ASC').all();
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const { name, category, price, unit, description } = req.body;
  if (!name || !price || !unit) {
    return res.status(400).json({ error: 'Vui lòng nhập tên dịch vụ, đơn giá và đơn vị tính' });
  }
  const result = db.prepare(`
    INSERT INTO services (name, category, price, unit, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, category || 'Dịch vụ chung', price, unit, description || '');
  logSystemAction('SERVICE_CREATE', `Thêm mới dịch vụ: ${name} (${price} đ/${unit})`, 'Manager');
  res.json({ message: 'Thêm dịch vụ thành công', id: result.lastInsertRowid });
});

// Add service order for an active stay
app.post('/api/stays/:id/services', (req, res) => {
  const { id } = req.params;
  const { service_id, quantity = 1, notes } = req.body;

  const stay = db.prepare('SELECT s.*, r.room_number FROM stays s JOIN rooms r ON s.room_id = r.id WHERE s.id = ? AND s.status = \'ACTIVE\'').get(id);
  if (!stay) return res.status(404).json({ error: 'Không tìm thấy phiên lưu trú đang hoạt động' });

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });

  const unit_price = service.price;
  const total_price = unit_price * quantity;

  const result = db.prepare(`
    INSERT INTO service_orders (stay_id, service_id, quantity, unit_price, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, service_id, quantity, unit_price, total_price, notes || '');

  logSystemAction('SERVICE_ORDER', `Phòng ${stay.room_number} đặt ${quantity}x ${service.name} (${total_price.toLocaleString('vi-VN')} đ)`, 'Receptionist');

  res.json({
    message: 'Thêm dịch vụ cho phòng thành công',
    order_id: result.lastInsertRowid,
    service_name: service.name,
    total_price
  });
});

app.delete('/api/service-orders/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM service_orders WHERE id = ?').run(id);
  res.json({ message: 'Đã xóa dịch vụ thành công' });
});

// ==========================================
// 6. INVOICES & BILLING
// ==========================================
app.get('/api/invoices', (req, res) => {
  const query = `
    SELECT 
      i.*,
      s.actual_check_in, s.actual_check_out,
      r.room_number,
      c.full_name as customer_name, c.phone as customer_phone
    FROM invoices i
    JOIN stays s ON i.stay_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN customers c ON s.customer_id = c.id
    ORDER BY i.id DESC
  `;
  const invoices = db.prepare(query).all();
  res.json(invoices);
});

app.get('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const invoice = db.prepare(`
    SELECT 
      i.*,
      s.actual_check_in, s.actual_check_out,
      r.room_number, rt.name as room_type_name, rt.base_price,
      c.full_name as customer_name, c.phone as customer_phone, c.identity_card, c.address as customer_address, c.email as customer_email
    FROM invoices i
    JOIN stays s ON i.stay_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    JOIN customers c ON s.customer_id = c.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });

  // Get detailed services included in this invoice
  const services = db.prepare(`
    SELECT so.*, s.name as service_name, s.unit
    FROM service_orders so
    JOIN services s ON so.service_id = s.id
    WHERE so.stay_id = ?
  `).all(invoice.stay_id);

  res.json({ invoice, services });
});

// ==========================================
// 7. CUSTOMERS
// ==========================================
app.get('/api/customers', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) as booking_count,
      (SELECT COUNT(*) FROM stays s WHERE s.customer_id = c.id) as stay_count
    FROM customers c
    ORDER BY c.id DESC
  `).all();
  res.json(customers);
});

// ==========================================
// 8. REPORTS & DASHBOARD ANALYTICS
// ==========================================
app.get('/api/reports/dashboard', (req, res) => {
  // Room stats
  const rooms = db.prepare('SELECT status, count(*) as count FROM rooms GROUP BY status').all();
  const roomStats = {
    TOTAL: 0,
    AVAILABLE: 0,
    OCCUPIED: 0,
    RESERVED: 0,
    CLEANING: 0,
    MAINTENANCE: 0
  };
  rooms.forEach(r => {
    roomStats[r.status] = r.count;
    roomStats.TOTAL += r.count;
  });

  const occupancyRate = roomStats.TOTAL > 0 ? Math.round((roomStats.OCCUPIED / roomStats.TOTAL) * 100) : 0;

  // Revenue today & this month
  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(final_total), 0) as total 
    FROM invoices 
    WHERE date(created_at) = date('now', 'localtime')
  `).get().total;

  const monthRevenue = db.prepare(`
    SELECT COALESCE(SUM(final_total), 0) as total 
    FROM invoices 
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
  `).get().total;

  // Active bookings & stays
  const activeBookingsCount = db.prepare(`SELECT count(*) as count FROM bookings WHERE status = 'CONFIRMED'`).get().count;
  const activeStaysCount = db.prepare(`SELECT count(*) as count FROM stays WHERE status = 'ACTIVE'`).get().count;

  // Revenue breakdown by room type
  const revenueByType = db.prepare(`
    SELECT rt.name, COALESCE(SUM(i.room_charge), 0) as total
    FROM room_types rt
    LEFT JOIN rooms r ON rt.id = r.room_type_id
    LEFT JOIN stays s ON r.id = s.room_id
    LEFT JOIN invoices i ON s.id = i.stay_id
    GROUP BY rt.id
  `).all();

  // Recent system logs
  const recentLogs = db.prepare(`SELECT * FROM system_logs ORDER BY id DESC LIMIT 8`).all();

  res.json({
    roomStats,
    occupancyRate,
    todayRevenue,
    monthRevenue,
    activeBookingsCount,
    activeStaysCount,
    revenueByType,
    recentLogs
  });
});

// ==========================================
// 9. CLOUD EXPERIMENTS & DATA REPLICATION
// ==========================================
app.get('/api/cloud/ping', (req, res) => {
  res.json({
    status: 'ONLINE',
    pong: true,
    timestamp: Date.now(),
    latencyMs: Math.floor(4 + Math.random() * 8)
  });
});

app.get('/api/cloud/status', (req, res) => {
  const stats = fs.statSync(path.join(__dirname, 'hotelcloud.db'));
  const dbSizeKb = (stats.size / 1024).toFixed(1);
  const latency = app.locals.lastDuration || Math.floor(8 + Math.random() * 12);

  res.json({
    status: 'ONLINE',
    provider: 'Cloudflare Pages & D1 Architecture Simulator',
    database: 'SQLite 3 (D1 Dialect Compatible)',
    dbSizeBytes: stats.size,
    dbSizeFormatted: `${dbSizeKb} KB`,
    latencyMs: latency,
    uptimeSeconds: Math.floor(process.uptime()),
    region: 'APAC (Ho Chi Minh City / Singapore Edge)',
    storageType: 'Centralized Cloud Relational Database'
  });
});

// Export database snapshot (Backup test)
app.get('/api/cloud/backup', (req, res) => {
  const backupData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    hotel: 'HotelCloud Grand Luxury',
    tables: {
      users: db.prepare('SELECT * FROM users').all(),
      room_types: db.prepare('SELECT * FROM room_types').all(),
      rooms: db.prepare('SELECT * FROM rooms').all(),
      customers: db.prepare('SELECT * FROM customers').all(),
      bookings: db.prepare('SELECT * FROM bookings').all(),
      stays: db.prepare('SELECT * FROM stays').all(),
      services: db.prepare('SELECT * FROM services').all(),
      service_orders: db.prepare('SELECT * FROM service_orders').all(),
      invoices: db.prepare('SELECT * FROM invoices').all(),
      system_logs: db.prepare('SELECT * FROM system_logs').all()
    }
  };

  logSystemAction('CLOUD_BACKUP', `Thực hiện sao lưu cơ sở dữ liệu Cloud snapshot (${Object.keys(backupData.tables).length} bảng)`, 'Admin');

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=hotelcloud-backup-${Date.now()}.json`);
  res.send(JSON.stringify(backupData, null, 2));
});

// Cloudflare D1 SQL Schema export
app.get('/api/cloud/schema-d1', (req, res) => {
  const schemaSql = `
-- ========================================================
-- HOTELCLOUD SCHEMA CHO CLOUDFLARE D1 (SQLITE COMPATIBLE)
-- ========================================================

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

CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  amenities TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_number TEXT UNIQUE NOT NULL,
  floor INTEGER NOT NULL,
  room_type_id TEXT NOT NULL REFERENCES room_types(id),
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE')),
  notes TEXT
);

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

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1
);

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
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(schemaSql);
});

// ============================================================================
// 12. HOTELCLOUD AI CONCIERGE CHATBOT API
// ============================================================================

app.get('/api/chatbot/suggestions', (req, res) => {
  const mode = req.query.mode || 'PUBLIC';
  if (mode === 'PMS') {
    return res.json({
      suggestions: [
        '📊 Báo cáo doanh thu & công suất hôm nay',
        '🛎️ Hiện có bao nhiêu phòng đang trống?',
        '🧹 Danh sách phòng đang dọn dẹp (CLEANING)',
        '👑 Danh sách khách hàng VIP thân thiết',
        '📝 Danh sách các đơn đặt phòng mới xác nhận'
      ]
    });
  }
  return res.json({
    suggestions: [
      '🏨 Khách sạn có những hạng phòng nào và giá bao nhiêu?',
      '🔍 Tra cứu tình trạng đơn đặt phòng của tôi',
      '⏰ Quy định giờ nhận phòng (Check-in) & trả phòng (Check-out)?',
      '💆 Khách sạn có dịch vụ Spa và Ăn sáng Buffet không?',
      '🚗 Có xe đưa đón sân bay không và giá thế nào?'
    ]
  });
});

app.post('/api/chatbot/query', (req, res) => {
  try {
    const { message, context = {} } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ' });
    }

    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();
    const isPMS = context.viewMode === 'PMS';

    // ------------------------------------------------------------------------
    // INTENT 1: Tra cứu đơn đặt phòng (Booking Lookup)
    // ------------------------------------------------------------------------
    const phoneMatch = cleanMsg.match(/(?:0|\+84)[3|5|7|8|9][0-9]{8}/);
    const codeMatch = cleanMsg.match(/BK-[\w-]+/i) || cleanMsg.match(/BK\d+/i);
    const lookupKeywords = ['tra cứu', 'kiểm tra đơn', 'mã đặt phòng', 'mã booking', 'đơn đặt', 'tình trạng phòng đã đặt'];

    if (codeMatch || phoneMatch || (lookupKeywords.some(k => lower.includes(k)) && /\d+/.test(cleanMsg))) {
      const searchTerm = codeMatch ? `%${codeMatch[0].toUpperCase()}%` : (phoneMatch ? `%${phoneMatch[0]}%` : `%${cleanMsg.replace(/[^0-9a-zA-Z]/g, '')}%`);
      
      const query = `
        SELECT b.*, c.full_name as customer_name, c.phone as customer_phone,
               r.room_number, rt.name as room_type_name, rt.base_price
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN rooms r ON b.room_id = r.id
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE b.booking_code LIKE ? OR c.phone LIKE ?
        ORDER BY b.id DESC LIMIT 3
      `;
      const bookings = db.prepare(query).all(searchTerm, searchTerm);

      if (bookings.length > 0) {
        const statusMap = {
          'CONFIRMED': 'Đã xác nhận',
          'CHECKED_IN': 'Đang lưu trú',
          'CHECKED_OUT': 'Đã trả phòng',
          'CANCELLED': 'Đã hủy',
          'PENDING': 'Chờ xác nhận'
        };

        const cards = bookings.map(b => ({
          booking_code: b.booking_code,
          customer_name: b.customer_name,
          phone: b.customer_phone,
          room: `Phòng ${b.room_number} (${b.room_type_name})`,
          dates: `${b.check_in_date} ➔ ${b.check_out_date}`,
          total: b.total_estimated_price.toLocaleString('vi-VN') + ' đ',
          deposit: b.deposit_amount ? b.deposit_amount.toLocaleString('vi-VN') + ' đ' : 'Chưa đặt cọc',
          status: statusMap[b.status] || b.status
        }));

        const reply = `Tôi đã tìm thấy **${bookings.length} đơn đặt phòng** khớp với thông tin của bạn:\n\n` +
          bookings.map(b => 
            `📋 **Mã đơn: #${b.booking_code}**\n` +
            `• **Khách hàng:** ${b.customer_name} (${b.customer_phone})\n` +
            `• **Phòng:** Số ${b.room_number} - ${b.room_type_name}\n` +
            `• **Thời gian lưu trú:** ${b.check_in_date} đến ${b.check_out_date}\n` +
            `• **Tổng chi phí ước tính:** ${b.total_estimated_price.toLocaleString('vi-VN')} đ (Đã cọc: ${b.deposit_amount?.toLocaleString('vi-VN') || 0} đ)\n` +
            `• **Trạng thái:** **${statusMap[b.status] || b.status}**`
          ).join('\n\n---\n\n') +
          `\n\nQuý khách có thể xuất trình mã này tại quầy Lễ tân khi làm thủ tục nhận phòng.`;

        return res.json({
          reply,
          intent: 'BOOKING_LOOKUP',
          cards,
          suggestions: ['🏨 Xem các dịch vụ tại khách sạn', '⏰ Quy định nhận/trả phòng', '💬 Hỗ trợ thay đổi ngày nhận phòng']
        });
      } else {
        return res.json({
          reply: `Rất tiếc, tôi chưa tìm thấy đơn đặt phòng nào với từ khóa **"${cleanMsg}"**. Quý khách vui lòng kiểm tra lại **Mã đặt phòng** (VD: *BK-20261021-001*) hoặc **Số điện thoại** đã dùng khi đăng ký.`,
          intent: 'BOOKING_LOOKUP',
          suggestions: ['🔍 Tra cứu bằng số điện thoại khác', '📞 Liên hệ Lễ tân (0236 3888 999)', '🏨 Đặt phòng mới ngay hôm nay']
        });
      }
    }

    // ------------------------------------------------------------------------
    // INTENT 2: Tra cứu Giá phòng & Hạng phòng (Room Types & Prices)
    // ------------------------------------------------------------------------
    const roomKeywords = ['giá phòng', 'hạng phòng', 'loại phòng', 'standard', 'superior', 'deluxe', 'suite', 'penthouse', 'president', 'bao nhiêu tiền', 'rẻ nhất', 'view biển', 'sức chứa'];
    if (roomKeywords.some(k => lower.includes(k))) {
      const roomTypes = db.prepare(`
        SELECT rt.*, 
               COUNT(r.id) as total_rooms,
               SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_rooms
        FROM room_types rt
        LEFT JOIN rooms r ON rt.id = r.room_type_id
        GROUP BY rt.id
        ORDER BY rt.base_price ASC
      `).all();

      const cards = roomTypes.map(rt => {
        let amenities = [];
        try { amenities = typeof rt.amenities === 'string' ? JSON.parse(rt.amenities) : (rt.amenities || []); } catch (e) {}
        return {
          id: rt.id,
          name: rt.name,
          price: rt.base_price.toLocaleString('vi-VN') + ' đ/đêm',
          capacity: `${rt.capacity} người`,
          available: rt.available_rooms,
          description: rt.description,
          amenities: amenities.slice(0, 3)
        };
      });

      const reply = `Dưới đây là bảng giá và thông tin các hạng phòng nghỉ dưỡng 5 sao tại **HotelCloud Resort & Spa**:\n\n` +
        roomTypes.map(rt => 
          `🏨 **${rt.name}** (${rt.id})\n` +
          `• **Giá niêm yết:** **${rt.base_price.toLocaleString('vi-VN')} đ/đêm**\n` +
          `• **Sức chứa:** Tối đa ${rt.capacity} người lớn\n` +
          `• **Tình trạng:** Còn **${rt.available_rooms}** phòng trống sẵn sàng\n` +
          `• **Đặc điểm:** ${rt.description || 'Không gian ấm cúng, sang trọng'}`
        ).join('\n\n') +
        `\n\n*Giá trên đã bao gồm bữa sáng Buffet Á - Âu, hồ bơi vô cực và phòng gym miễn phí.*`;

      return res.json({
        reply,
        intent: 'ROOM_INQUIRY',
        cards,
        action: { type: 'OPEN_BOOKING' },
        suggestions: ['🛎️ Đặt phòng trực tuyến ngay', '🌊 Phòng có view biển đẹp nhất?', '⏰ Giờ Check-in & Check-out']
      });
    }

    // ------------------------------------------------------------------------
    // INTENT 3: Tình trạng phòng trống hôm nay (Vacancy / Availability)
    // ------------------------------------------------------------------------
    const vacancyKeywords = ['còn phòng', 'phòng trống', 'tình trạng phòng', 'bao nhiêu phòng trống', 'công suất phòng'];
    if (vacancyKeywords.some(k => lower.includes(k))) {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END) as reserved,
          SUM(CASE WHEN status = 'CLEANING' THEN 1 ELSE 0 END) as cleaning,
          SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance
        FROM rooms
      `).get();

      const occRate = stats.total > 0 ? Math.round(((stats.occupied + stats.reserved) / stats.total) * 100) : 0;

      const reply = `Tình trạng phòng thời gian thực tại **HotelCloud**:\n\n` +
        `• 🟢 **Phòng trống sẵn sàng (AVAILABLE):** **${stats.available}** phòng\n` +
        `• 🔴 **Đang có khách lưu trú (OCCUPIED):** **${stats.occupied}** phòng\n` +
        `• 🟡 **Đã giữ chỗ / Chờ nhận (RESERVED):** **${stats.reserved}** phòng\n` +
        `• 🧹 **Đang dọn phòng (CLEANING):** **${stats.cleaning}** phòng\n` +
        `• 🔧 **Đang bảo trì (MAINTENANCE):** **${stats.maintenance}** phòng\n` +
        `• 📊 **Công suất phòng hiện tại:** **${occRate}%** (Tổng cộng ${stats.total} phòng)\n\n` +
        (stats.available > 0 
          ? `👉 Khách sạn vẫn còn **${stats.available} phòng trống** rất đẹp. Quý khách có muốn đặt phòng ngay không?`
          : `Khách sạn hiện đang kín phòng, quý khách có thể liên hệ Lễ tân để được hỗ trợ sắp xếp danh sách chờ.`);

      return res.json({
        reply,
        intent: 'ROOM_AVAILABILITY',
        suggestions: ['🏨 Xem chi tiết các hạng phòng', '📝 Đặt phòng ngay bây giờ', '📊 Xem sơ đồ phòng (PMS)']
      });
    }

    // ------------------------------------------------------------------------
    // INTENT 4: Tra cứu Dịch vụ & Tiện ích (Services & Amenities)
    // ------------------------------------------------------------------------
    const serviceKeywords = ['dịch vụ', 'spa', 'massage', 'ăn sáng', 'buffet', 'giặt', 'sân bay', 'bể bơi', 'hồ bơi', 'gym', 'xe', 'nhà hàng', 'menu', 'ẩm thực'];
    if (serviceKeywords.some(k => lower.includes(k))) {
      const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY category, price ASC').all();
      
      const reply = `**HotelCloud Resort & Spa** cung cấp đầy đủ các tiện ích & dịch vụ cao cấp chuẩn 5 sao:\n\n` +
        `🍳 **Bữa sáng Buffet Quốc tế:** Miễn phí cho khách lưu trú, phục vụ tại Tầng 2 từ 06:30 - 10:00.\n` +
        `🏊 **Hồ bơi vô cực & Gym Tầng thượng:** Miễn phí, tầm nhìn 360 độ vịnh biển (06:00 - 22:00).\n` +
        `🚗 **Xe đưa đón sân bay Đà Nẵng:** Limousine sang trọng 350.000 đ/chuyến (24/7).\n` +
        `💆 **Lotus Herbal Spa:** Xông hơi đá muối & massage trị liệu cổ truyền từ 450.000 đ/liệu trình.\n` +
        `👔 **Giặt là cao cấp:** Giặt sấy lấy ngay trong ngày, giá 35.000 đ/kg.\n\n` +
        `*Quý khách có thể yêu cầu nhân viên phục vụ tận phòng 24/7 bằng cách gọi hotline nội bộ 0 từ điện thoại bàn.*`;

      return res.json({
        reply,
        intent: 'SERVICE_INQUIRY',
        suggestions: ['🚗 Đặt xe đưa đón sân bay', '💆 Bảng giá Lotus Herbal Spa', '🏨 Xem giá phòng hôm nay']
      });
    }

    // ------------------------------------------------------------------------
    // INTENT 5: Chính sách Khách sạn & FAQ (Policies & Check-in/out)
    // ------------------------------------------------------------------------
    const policyKeywords = ['check-in', 'check in', 'checkin', 'check-out', 'check out', 'checkout', 'nhận phòng', 'trả phòng', 'giờ giấc', 'giờ', 'chính sách', 'hủy phòng', 'wifi', 'mạng', 'địa chỉ', 'ở đâu', 'thanh toán'];
    if (policyKeywords.some(k => lower.includes(k))) {
      let specificReply = '';
      if (lower.includes('check-in') || lower.includes('check in') || lower.includes('checkin') || lower.includes('check-out') || lower.includes('check out') || lower.includes('checkout') || lower.includes('nhận phòng') || lower.includes('trả phòng') || lower.includes('giờ')) {
        specificReply = `⏰ **Quy định Giờ Nhận & Trả phòng:**\n` +
          `• **Giờ nhận phòng (Check-in):** Từ **14:00** chiều.\n` +
          `• **Giờ trả phòng (Check-out):** Trước **12:00** trưa.\n` +
          `• *Nhận phòng sớm hoặc trả phòng trễ sẽ phụ thuộc vào tình trạng phòng thực tế (có thể áp dụng phụ thu theo quy định).*`;
      } else if (lower.includes('wifi') || lower.includes('mạng') || lower.includes('internet')) {
        specificReply = `📶 **Thông tin WiFi Khách sạn:**\n` +
          `• **Tên mạng (SSID):** \`HotelCloud_Guest_5G\`\n` +
          `• **Mật khẩu:** Không yêu cầu mật khẩu (hoặc mật khẩu: \`hotelcloud2026\`). Tốc độ truyền tải cáp quang 500Mbps toàn khuôn viên.`;
      } else if (lower.includes('địa chỉ') || lower.includes('ở đâu') || lower.includes('vị trí')) {
        specificReply = `📍 **Địa chỉ & Vị trí:**\n` +
          `• **Địa chỉ:** Số 88 Đại lộ Hoàng Gia, Bãi Biển Mỹ Khê, Đà Nẵng, Việt Nam.\n` +
          `• **Khoảng cách:** Cách Sân bay Quốc tế Đà Nẵng 12 phút đi xe, cách Phố cổ Hội An 25 phút.`;
      } else if (lower.includes('hủy') || lower.includes('đổi ngày')) {
        specificReply = `🔄 **Chính sách Hủy phòng & Đổi lịch:**\n` +
          `• Miễn phí hủy phòng hoặc đổi ngày nếu thông báo trước **24 giờ** trước ngày nhận phòng.\n` +
          `• Hủy phòng trong vòng 24 giờ sẽ tính phí tương đương 50% tiền phòng đêm đầu tiên.`;
      } else {
        specificReply = `💳 **Phương thức Thanh toán chấp nhận:**\n` +
          `• Chuyển khoản quét mã **VietQR** tiện lợi tức thì.\n` +
          `• Tiền mặt tại quầy Lễ tân.\n` +
          `• Thẻ tín dụng quốc tế / nội địa (Visa, Mastercard, JCB, Napas).`;
      }

      return res.json({
        reply: specificReply,
        intent: 'POLICY_INQUIRY',
        suggestions: ['🏨 Khách sạn có những hạng phòng nào?', '🔍 Tra cứu đơn đặt phòng', '📞 Số điện thoại Lễ tân']
      });
    }

    // ------------------------------------------------------------------------
    // INTENT 6: Dành cho Nhân viên / Báo cáo PMS (Staff PMS Inquiry)
    // ------------------------------------------------------------------------
    if (isPMS && (lower.includes('báo cáo') || lower.includes('doanh thu') || lower.includes('hóa đơn') || lower.includes('vip') || lower.includes('thống kê'))) {
      const revenueStats = db.prepare(`
        SELECT 
          COUNT(*) as invoice_count,
          COALESCE(SUM(final_total), 0) as total_revenue
        FROM invoices WHERE payment_status = 'PAID'
      `).get();

      const bookingStats = db.prepare(`
        SELECT COUNT(*) as active_count FROM bookings WHERE status IN ('CONFIRMED', 'CHECKED_IN')
      `).get();

      const vipCustomers = db.prepare(`
        SELECT full_name, phone, notes FROM customers WHERE notes LIKE '%VIP%' LIMIT 3
      `).all();

      const reply = `📊 **Báo Cáo Tình Hình Kinh Doanh PMS:**\n\n` +
        `• 💰 **Tổng doanh thu đã thanh toán:** **${revenueStats.total_revenue.toLocaleString('vi-VN')} đ** (${revenueStats.invoice_count} hóa đơn)\n` +
        `• 📋 **Đơn đặt phòng đang hoạt động:** **${bookingStats.active_count}** lượt đặt\n` +
        (vipCustomers.length > 0 
          ? `• 👑 **Khách VIP gần nhất:** ` + vipCustomers.map(v => `${v.full_name} (${v.phone})`).join(', ') + `\n\n`
          : '\n\n') +
        `Bạn có thể truy cập tab **Báo Cáo** trên thanh điều hướng để xem biểu đồ doanh thu chi tiết 7 ngày qua.`;

      return res.json({
        reply,
        intent: 'PMS_STATS',
        suggestions: ['🛎️ Tình trạng phòng hôm nay', '🧹 Danh sách phòng cần dọn', '👥 Xem danh bạ khách hàng']
      });
    }

    // ------------------------------------------------------------------------
    // DEFAULT GREETING / FALLBACK RESPONSE
    // ------------------------------------------------------------------------
    const greetings = ['xin chào', 'chào', 'hello', 'hi', 'alo', 'bạn là ai', 'có thể làm gì'];
    const isGreeting = greetings.some(g => lower.includes(g));

    if (isGreeting) {
      const welcomeMsg = `Xin chào ${context.userName || 'quý khách'}! 👋\n\n` +
        `Tôi là **HotelCloud AI Concierge** — Trợ lý ảo thông minh 24/7 của khách sạn.\n\n` +
        `Tôi có thể hỗ trợ bạn:\n` +
        `• 🏨 **Tra cứu giá & tình trạng các hạng phòng** (Standard, Deluxe, Suite...)\n` +
        `• 🔍 **Tra cứu mã đơn đặt phòng** qua mã đơn hoặc số điện thoại\n` +
        `• ⏰ **Cung cấp quy định check-in, check-out, chính sách khách sạn**\n` +
        `• 🏊 **Thông tin dịch vụ ẩm thực, Spa, đưa đón sân bay**\n` +
        (isPMS ? `• 📊 **Thống kê doanh thu, báo cáo phòng cho nhân viên lễ tân & quản lý**\n\n` : `\n\n`) +
        `Bạn cần tôi giúp đỡ thông tin gì hôm nay?`;

      return res.json({
        reply: welcomeMsg,
        intent: 'GREETING',
        suggestions: isPMS ? [
          '📊 Báo cáo doanh thu & công suất',
          '🛎️ Kiểm tra phòng trống',
          '🧹 Danh sách phòng cần dọn'
        ] : [
          '🏨 Giá phòng hôm nay bao nhiêu?',
          '🔍 Tra cứu đơn đặt phòng',
          '⏰ Giờ nhận phòng và trả phòng',
          '🚗 Xe đưa đón sân bay'
        ]
      });
    }

    // Fallback response with helpful recommendations
    return res.json({
      reply: `Cảm ơn quý khách đã gửi câu hỏi: *"${cleanMsg}"*.\n\n` +
        `Tôi có thể hỗ trợ quý khách tra cứu nhanh các thông tin sau:\n` +
        `1. **Giá và tiện nghi các hạng phòng** (Gõ *"giá phòng Deluxe"* hoặc *"các loại phòng"*)\n` +
        `2. **Kiểm tra đơn đặt phòng** (Gõ *"tra cứu đơn 0905..."* hoặc nhập mã booking)\n` +
        `3. **Dịch vụ khách sạn** (Gõ *"dịch vụ spa"*, *"ăn sáng buffet"*, *"xe sân bay"*)\n` +
        `4. **Giờ giấc nhận trả phòng & WiFi**\n\n` +
        `Hoặc quý khách có thể chọn nhanh các gợi ý bên dưới:`,
      intent: 'GENERAL',
      suggestions: [
        '🏨 Khách sạn có những hạng phòng nào?',
        '🔍 Tra cứu đơn đặt phòng',
        '⏰ Quy định giờ Check-in / Check-out',
        '📞 Liên hệ Lễ tân khách sạn'
      ]
    });

  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({ error: 'Lỗi xử lý tin nhắn: ' + err.message });
  }
});

// Serve static built client if dist exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` HotelCloud API Server running on port ${PORT} `);
  console.log(` http://localhost:${PORT}                      `);
  console.log(`===============================================`);
});

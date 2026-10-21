async function runTests() {
  const tests = [
    { name: '1. Cloud Ping & Latency', url: 'http://localhost:5000/api/cloud/ping', method: 'GET' },
    { name: '2. Danh sách Phòng (Rooms)', url: 'http://localhost:5000/api/rooms', method: 'GET' },
    { name: '3. Danh mục Hạng phòng (Room Types)', url: 'http://localhost:5000/api/rooms/types', method: 'GET' },
    { name: '4. Danh sách Đặt phòng (Bookings)', url: 'http://localhost:5000/api/bookings', method: 'GET' },
    { name: '5. Danh mục Dịch vụ (Services)', url: 'http://localhost:5000/api/services', method: 'GET' },
    { name: '6. Danh sách Hóa đơn (Invoices)', url: 'http://localhost:5000/api/invoices', method: 'GET' },
    { name: '7. Báo cáo Doanh thu & Công suất', url: 'http://localhost:5000/api/reports/dashboard', method: 'GET' },
    { name: '8. Xác thực Đăng nhập Admin', url: 'http://localhost:5000/api/auth/login', method: 'POST', body: { username: 'admin', password: 'admin123' } },
    { name: '9. Kiểm tra Phòng Trống (Anti-Collision)', url: 'http://localhost:5000/api/rooms/available?check_in=2026-10-21&check_out=2026-10-23', method: 'GET' },
    { name: '10. Sao lưu Đám mây (Cloud Backup)', url: 'http://localhost:5000/api/cloud/backup', method: 'GET' }
  ];

  console.log('========================================================================');
  console.log('         HOTELCLOUD API SERVER HEALTH CHECK & TEST SUITE                ');
  console.log('========================================================================');
  
  for (const t of tests) {
    const start = Date.now();
    try {
      const opts = { method: t.method, headers: { 'Content-Type': 'application/json' } };
      if (t.body) opts.body = JSON.stringify(t.body);
      const res = await fetch(t.url, opts);
      const latency = Date.now() - start;
      const data = await res.json();
      let summary = '';
      if (Array.isArray(data)) {
        summary = data.length + ' bản ghi';
      } else if (data.message) {
        summary = data.message;
      } else if (data.status) {
        summary = 'Status: ' + data.status;
      } else if (data.metrics) {
        summary = 'Doanh thu: ' + data.metrics.total_revenue?.toLocaleString('vi-VN') + ' đ';
      } else {
        summary = 'OK';
      }
      console.log(`[PASS] ${t.name.padEnd(40)} | HTTP ${res.status} | ${latency}ms | ${summary}`);
    } catch (e) {
      console.log(`[FAIL] ${t.name.padEnd(40)} | ERROR: ${e.message}`);
    }
  }
  console.log('========================================================================');
}

runTests();

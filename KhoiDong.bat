@echo off
chcp 65001 >nul
title HotelCloud - Khởi Chạy Hệ Thống Quản Lý Khách Sạn
color 0b
cls
echo =========================================================================
echo    HOTELCLOUD - HỆ THỐNG QUẢN LÝ KHÁCH SẠN ĐIỆN TOÁN ĐÁM MÂY
echo =========================================================================
echo.
echo [*] Đang khởi động Backend Server (Port 5001)...
echo [*] Đang khởi động Frontend Client (Port 3001)...
echo.
echo [*] Trình duyệt web sẽ tự động mở sau ít giây...
echo.
echo [*] Để dừng hệ thống: Nhấn Ctrl + C rồi chọn Y
echo =========================================================================
echo.

start "" timeout /t 3 >nul ^& start "" "http://localhost:3001"

npm run dev
pause

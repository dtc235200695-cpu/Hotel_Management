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
echo [*] Máy chủ đang chạy! Vui lòng giữ cửa sổ này để duy trì hệ thống.
echo [*] Nhấn Ctrl + C để dừng hệ thống bất kỳ lúc nào.
echo =========================================================================
echo.

start "" "http://localhost:3001"

npm run dev
pause

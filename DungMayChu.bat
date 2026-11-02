@echo off
chcp 65001 >nul
title Dừng Máy Chủ HotelCloud
color 0c
cls
echo =========================================================================
echo    DỪNG TOÀN BỘ MÁY CHỦ HOTELCLOUD
echo =========================================================================
echo.
echo [*] Đang đóng các tiến trình máy chủ Node / Vite...
taskkill /F /IM node.exe 2>nul
echo.
echo [V] Đã dừng toàn bộ máy chủ HotelCloud thành công!
echo =========================================================================
echo.
pause

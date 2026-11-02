@echo off
chcp 65001 >nul
title Tắt Tự Động Chạy HotelCloud
color 0e
cls
echo =========================================================================
echo    HỦY TỰ ĐỘNG CHẠY HOTELCLOUD CÙNG WINDOWS
echo =========================================================================
echo.
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\HotelCloud.lnk" 2>nul
echo [V] Đã hủy khởi động tự động cùng Windows thành công!
echo [*] Khi nào cần dùng lại, bạn có thể chạy lại file CaiDatKhoiDongCungWindows.bat
echo =========================================================================
echo.
pause

@echo off
chcp 65001 >nul
title Cài Đặt Tự Động Chạy HotelCloud Cùng Windows
color 0a
cls
echo =========================================================================
echo    CÀI ĐẶT TỰ ĐỘNG CHẠY HOTELCLOUD CÙNG WINDOWS (CHẠY NGẦM KHÔNG CỬA SỔ)
echo =========================================================================
echo.
echo [*] Đang thiết lập để máy chủ tự động khởi động mỗi khi bạn bật máy tính...

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\HotelCloud.lnk\"); $s.TargetPath = \"wscript.exe\"; $s.Arguments = \"`\"%~dp0ChayNgam.vbs`\"\"; $s.WorkingDirectory = \"%~dp0\"; $s.Description = 'HotelCloud Background Service'; $s.Save()"

echo.
echo [V] THIẾT LẬP THÀNH CÔNG!
echo.
echo [*] Lợi ích:
echo   - Mỗi khi bạn mở máy tính, máy chủ sẽ TỰ ĐỘNG CHẠY NGẦM trong nền.
echo   - Hoàn toàn KHÔNG hiện màn hình đen cmd làm phiền bạn.
echo   - Bạn chỉ cần mở trình duyệt gõ: http://localhost:3001 là dùng ngay,
echo     hoặc nhấp đúp vào index.html / TruyCapHeThong.html mà KHÔNG CẦN gõ npm run dev.
echo.
echo =========================================================================
echo Bạn có muốn khởi động máy chủ chạy ngầm ngay bây giờ không? (Y/N)
set /p opt="Nhập lựa chọn (Mặc định Y): "
if /i "%opt%"=="N" goto end
wscript.exe "%~dp0ChayNgam.vbs"
echo [*] Đã kích hoạt máy chủ chạy ngầm thành công!
start "" "http://localhost:3001"
:end
pause


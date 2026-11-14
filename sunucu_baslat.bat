@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Sinif Panosu yerel sunucu baslatiliyor...
echo Tarayicida su adresi acin:  http://localhost:8000
echo Kapatmak icin bu pencereyi kapatin.
echo.
start "" http://localhost:8000
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
where npx >nul 2>nul && (npx --yes http-server -p 8000 -c-1 & goto :eof)
echo HATA: Python veya Node.js bulunamadi.
echo Python'u https://www.python.org/downloads/ adresinden kurun
echo (kurulumda "Add python.exe to PATH" kutusunu isaretleyin), sonra bu dosyayi tekrar calistirin.
pause

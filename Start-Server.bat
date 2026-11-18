@echo off
rem ─── Zoe's Italian app – local web server ───────────────────────
rem Starts a small web server so other devices on your Wi-Fi can open
rem the app. Your daughter can then browse to the address shown below,
rem e.g. http://192.168.1.20:8080  (leave this window open!)

cd /d "%~dp0"

echo.
echo  ============================================
echo    Zoe lernt Italienisch - lokaler Server
echo  ============================================
echo.
echo  Offne auf dem PC deiner Tochter (gleichen
echo  WLAN nutzen!), z.B.:
echo.

where py >nul 2>nul
if %errorlevel%==0 (
    echo  (Python gefunden – Server startet auf Port 8080 ...)
    echo.
    echo  Finde deine IP-Adresse unten bei "IPv4 Address",
    echo  dann oeffne auf dem PC deiner Tochter:
    echo      http://DEINE-IPv4-ADRESSE:8080
    echo.
    ipconfig | findstr /i "IPv4"
    echo.
    py -m http.server 8080
    goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo  (Python gefunden – Server startet auf Port 8080 ...)
    echo.
    echo  Finde deine IP-Adresse unten bei "IPv4 Address",
    echo  dann oeffne auf dem PC deiner Tochter:
    echo      http://DEINE-IPv4-ADRESSE:8080
    echo.
    ipconfig | findstr /i "IPv4"
    echo.
    python -m http.server 8080
    goto :eof
)

echo  Weder Python noch Node.js wurde gefunden.
echo  Bitte installiere Python von https://python.org
echo  und starte diese Datei erneut.
pause

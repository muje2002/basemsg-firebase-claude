@echo off
title basemsg Metro Server
cd /d C:\Project\basemsg_vs

echo ================================================
echo   basemsg Metro Server
echo ================================================
echo.

cd apps\mobile
npx expo start --lan --port 8081

echo.
echo Metro server stopped. Press any key to close.
pause

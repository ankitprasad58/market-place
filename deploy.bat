@echo off
echo Building for production...
echo.

echo 1. Building React App...
cd client
call npm run build
cd ..

echo 2. Backend is ready for deployment
echo.
echo For hosting:
echo - Frontend build: client/build
echo - Backend: server/
echo.
echo Recommended hosting platforms:
echo 1. Vercel (Frontend)
echo 2. Railway/Heroku (Backend)
echo 3. MySQL Database: AWS RDS or PlanetScale
pause
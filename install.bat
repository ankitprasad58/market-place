@echo off
echo Installing Presets Marketplace...
echo.

echo ========================================
echo 1. Setting up MySQL Database
echo ========================================
echo Please ensure MySQL is running on your system
echo.

echo ========================================
echo 2. Installing Backend Dependencies
echo ========================================
cd server
call npm install
cd ..

echo ========================================
echo 3. Installing Frontend Dependencies
echo ========================================
cd client
call npm install
cd ..

echo ========================================
echo 4. Installation Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Start MySQL service
echo 2. Import database/schema.sql to MySQL
echo 3. Run backend: cd server && npm start
echo 4. Run frontend: cd client && npm start
echo.
echo Open browser to: http://localhost:3000
pause
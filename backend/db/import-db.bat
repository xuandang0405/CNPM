@echo off
echo ========================================
echo  IMPORT DATABASE WITH NOTIFICATION SYSTEM
echo ========================================
echo.

set /p DB_HOST="Enter MySQL Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_USER="Enter MySQL User (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="Enter MySQL Password: "

echo.
echo Importing database schema...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% < database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Database imported successfully!
    echo.
    echo Database includes:
    echo - Users, Drivers, Buses, Routes, Schedules, Students, Trips
    echo - Notifications with indexes for performance
    echo - Notification settings for user preferences
    echo - Sample data for testing
    echo.
) else (
    echo.
    echo ❌ Error importing database!
    echo.
)

pause

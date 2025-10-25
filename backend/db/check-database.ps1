# Database Check Script
# Kiểm tra database có đầy đủ tables và indexes không

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DATABASE CHECK - CNPM System" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get MySQL credentials
$DB_HOST = Read-Host "MySQL Host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_USER = Read-Host "MySQL User (default: root)"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "root" }

$DB_PASS = Read-Host "MySQL Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS)
$DB_PASS_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Checking database..." -ForegroundColor Yellow

# Check if database exists
$check_db = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'cnpm';"
$result = mysql -h $DB_HOST -u $DB_USER -p$DB_PASS_PLAIN -e $check_db 2>&1

if ($result -match "cnpm") {
    Write-Host "✅ Database 'cnpm' exists" -ForegroundColor Green
    
    # Check tables
    Write-Host ""
    Write-Host "Checking tables..." -ForegroundColor Yellow
    
    $tables = @(
        "users",
        "drivers", 
        "buses",
        "routes",
        "schedules",
        "students",
        "trips",
        "trip_history",
        "notifications",
        "notification_settings",
        "safety_zones",
        "absence_reports"
    )
    
    $missing_tables = @()
    
    foreach ($table in $tables) {
        $check_table = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'cnpm' AND TABLE_NAME = '$table';"
        $result = mysql -h $DB_HOST -u $DB_USER -p$DB_PASS_PLAIN -e $check_table 2>&1
        
        if ($result -match $table) {
            Write-Host "  ✅ $table" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $table (missing)" -ForegroundColor Red
            $missing_tables += $table
        }
    }
    
    # Check notification indexes
    Write-Host ""
    Write-Host "Checking notification indexes..." -ForegroundColor Yellow
    
    $check_indexes = "SHOW INDEX FROM cnpm.notifications WHERE Key_name != 'PRIMARY';"
    $indexes = mysql -h $DB_HOST -u $DB_USER -p$DB_PASS_PLAIN -e $check_indexes 2>&1
    
    $required_indexes = @(
        "idx_user_created",
        "idx_user_read",
        "idx_target_role",
        "idx_sender",
        "idx_created"
    )
    
    $missing_indexes = @()
    
    foreach ($idx in $required_indexes) {
        if ($indexes -match $idx) {
            Write-Host "  ✅ $idx" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $idx (missing)" -ForegroundColor Red
            $missing_indexes += $idx
        }
    }
    
    # Check sample data
    Write-Host ""
    Write-Host "Checking sample data..." -ForegroundColor Yellow
    
    $count_users = mysql -h $DB_HOST -u $DB_USER -p$DB_PASS_PLAIN -D cnpm -e "SELECT COUNT(*) FROM users;" -s -N
    $count_notifications = mysql -h $DB_HOST -u $DB_USER -p$DB_PASS_PLAIN -D cnpm -e "SELECT COUNT(*) FROM notifications;" -s -N
    
    Write-Host "  Users: $count_users" -ForegroundColor Cyan
    Write-Host "  Notifications: $count_notifications" -ForegroundColor Cyan
    
    # Summary
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($missing_tables.Count -eq 0 -and $missing_indexes.Count -eq 0) {
        Write-Host "✅ DATABASE IS READY!" -ForegroundColor Green
        Write-Host "All tables and indexes exist." -ForegroundColor Green
    } else {
        Write-Host "⚠️ DATABASE INCOMPLETE" -ForegroundColor Yellow
        
        if ($missing_tables.Count -gt 0) {
            Write-Host ""
            Write-Host "Missing tables:" -ForegroundColor Red
            foreach ($t in $missing_tables) {
                Write-Host "  - $t" -ForegroundColor Red
            }
        }
        
        if ($missing_indexes.Count -gt 0) {
            Write-Host ""
            Write-Host "Missing indexes:" -ForegroundColor Red
            foreach ($i in $missing_indexes) {
                Write-Host "  - $i" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "To fix, run:" -ForegroundColor Yellow
        Write-Host "  mysql -u root -p < database.sql" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "❌ Database 'cnpm' does not exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "To create database, run:" -ForegroundColor Yellow
    Write-Host "  mysql -u root -p < database.sql" -ForegroundColor Cyan
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
pause

# Smart School Bus Database

Thư mục này chứa toàn bộ database schema và data cho hệ thống SSB 1.0.

## Files

- `database.sql` - Schema và sample data hoàn chỉnh cho toàn bộ hệ thống
- `connection.js` - Database connection configuration

## Quick Setup

1. Import database:
```sql
mysql -u root -p < database.sql
```

2. Or run in MySQL client:
```sql
source /path/to/database.sql;
```

## Database Structure

### Core Tables
- `users` - Người dùng (parents, drivers, admins)
- `drivers` - Thông tin tài xế
- `buses` - Xe buýt với real-time GPS
- `routes` - Tuyến đường
- `route_stops` - Điểm dừng
- `students` - Học sinh
- `schedules` - Lịch trình hàng ngày
- `trips` - Chuyến đi cá nhân

### Features Tables
- `emergency_alerts` - Cảnh báo khẩn cấp
- `notifications` - Thông báo
- `safety_zones` - Vùng an toàn
- `absence_reports` - Báo cáo vắng mặt
- `realtime_locations` - Lịch sử GPS
- `sessions` - Phiên đăng nhập

### Sample Data
Database đã có sẵn sample data để test:
- 6 users (1 admin, 2 drivers, 3 parents)
- 3 buses với GPS coordinates HCM
- 3 routes với 12 stops
- 5 students
- Active schedules và trips
- Emergency alerts và notifications

## Connection
Cấu hình trong `connection.js`:
- Database: `cnpm`
- Charset: `utf8mb4`
- Timezone: `+07:00` (Vietnam)
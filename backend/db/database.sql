-- ========================================
-- SMART SCHOOL BUS TRACKING SYSTEM
-- Complete Database Schema with Sample Data
-- ========================================

DROP DATABASE IF EXISTS cnpm;
CREATE DATABASE cnpm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cnpm;

-- ========================================
-- CORE TABLES
-- ========================================

-- Users: parents, drivers, admins
CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  role ENUM('parent','driver','admin') NOT NULL DEFAULT 'parent',
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Drivers (independent table with personal info)
CREATE TABLE drivers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  license_number VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Buses
CREATE TABLE buses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  plate VARCHAR(50) NOT NULL UNIQUE,
  driver_id CHAR(36) NULL,
  capacity INT DEFAULT 50,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  speed DECIMAL(5,2) DEFAULT 0.00,
  heading DECIMAL(5,2) DEFAULT 0.00,
  accuracy DECIMAL(5,2) DEFAULT 10.00,
  students_onboard INT DEFAULT 0,
  last_update TIMESTAMP NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Routes
CREATE TABLE routes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Route stops (ordered)
CREATE TABLE route_stops (
  id CHAR(36) NOT NULL PRIMARY KEY,
  route_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  stop_order INT NOT NULL,
  is_pickup BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  UNIQUE KEY route_stop_unique (route_id, stop_order)
) ENGINE=InnoDB;

-- Students
CREATE TABLE students (
  id CHAR(36) NOT NULL PRIMARY KEY,
  parent_user_id CHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  class VARCHAR(50),
  assigned_route_id CHAR(36),
  assigned_stop_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_route_id) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_stop_id) REFERENCES route_stops(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Schedules (route runs per day)
CREATE TABLE schedules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  route_id CHAR(36) NOT NULL,
  bus_id CHAR(36) NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  status ENUM('scheduled','active','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Trips: individual trip instances for students (pickups/dropoffs)
CREATE TABLE trips (
  id CHAR(36) NOT NULL PRIMARY KEY,
  schedule_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  status ENUM('waiting','picked','onboard','dropped','absent','cancelled') DEFAULT 'waiting',
  picked_at TIMESTAMP NULL,
  dropped_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Realtime locations (history)
CREATE TABLE realtime_locations (
  id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  bus_id CHAR(36) NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),
  heading DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Emergency alerts
CREATE TABLE emergency_alerts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  driver_user_id CHAR(36) NOT NULL,
  type ENUM('accident', 'breakdown', 'traffic', 'weather', 'medical', 'security', 'other') NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
  resolved_at TIMESTAMP NULL,
  resolved_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  sender_id CHAR(36) NULL,
  sender_role ENUM('admin', 'driver', 'system') DEFAULT 'system',
  target_role ENUM('parent', 'driver', 'admin', 'all') DEFAULT 'all',
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type VARCHAR(100),
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_target_role (target_role),
  INDEX idx_sender (sender_id, sender_role),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB;

-- Notification settings (user preferences)
CREATE TABLE notification_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  websocket_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  notification_types JSON COMMENT 'Which types of notifications to receive',
  quiet_hours_start TIME COMMENT 'Do not send notifications after this time',
  quiet_hours_end TIME COMMENT 'Resume sending notifications after this time',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Safety zones (for parent settings)
CREATE TABLE safety_zones (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  radius_m INT NOT NULL DEFAULT 200,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Absence reports
CREATE TABLE absence_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  student_id CHAR(36) NOT NULL,
  schedule_id CHAR(36) NULL,
  reported_by_user_id CHAR(36) NOT NULL,
  reason TEXT,
  start_date DATE,
  end_date DATE,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sessions (for admin/session manager)
CREATE TABLE sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Location and tracking indexes
CREATE INDEX idx_buses_location ON buses(current_lat, current_lng);
CREATE INDEX idx_buses_last_update ON buses(last_update);
CREATE INDEX idx_realtime_bus_time ON realtime_locations(bus_id, recorded_at);

-- Status and filtering indexes
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_emergency_status ON emergency_alerts(status);
CREATE INDEX idx_emergency_type ON emergency_alerts(type);
CREATE INDEX idx_emergency_driver ON emergency_alerts(driver_user_id);
CREATE INDEX idx_emergency_created ON emergency_alerts(created_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- User and relationship indexes
CREATE INDEX idx_students_parent ON students(parent_user_id);
CREATE INDEX idx_students_route ON students(assigned_route_id);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_trips_schedule ON trips(schedule_id);

-- ========================================
-- SAMPLE DATA FOR DEVELOPMENT & TESTING
-- ========================================

-- Sample users (password: 123456 for all)
INSERT IGNORE INTO users (id, role, email, password_hash, full_name, phone) VALUES
('u-admin-1', 'admin', 'admin@ssb.com', '$2b$10$8lN1YzB2RV3GXhF.OkhTxOGQfA9xGx6gTkJ8Kx/1YzB2RV3GXhF.O', 'Admin Nguyen', '0901000001'),
('u-driver-1', 'driver', 'driver1@ssb.com', '$2b$10$8lN1YzB2RV3GXhF.OkhTxOGQfA9xGx6gTkJ8Kx/1YzB2RV3GXhF.O', 'Driver Tran', '0901000002'),
('u-driver-2', 'driver', 'driver2@ssb.com', '$2b$10$8lN1YzB2RV3GXhF.OkhTxOGQfA9xGx6gTkJ8Kx/1YzB2RV3GXhF.O', 'Driver Le', '0901000003'),
('u-parent-1', 'parent', 'parent1@ssb.com', '$2b$10$8lN1YzB2RV3GXhF.OkhTxOGQfA9xGx6gTkJ8Kx/1YzB2RV3GXhF.O', 'Parent Pham', '0901000004');

-- Sample drivers
INSERT IGNORE INTO drivers (id, user_id, full_name, phone, license_number, active) VALUES
('d-001', 'u-driver-1', 'Driver Tran', '0901000002', 'DL-123456789', TRUE),
('d-002', 'u-driver-2', 'Driver Le', '0901000003', 'DL-987654321', TRUE);

-- Sample buses
INSERT IGNORE INTO buses (id, plate, driver_id, capacity, current_lat, current_lng, speed, students_onboard, active) VALUES
('bus-001', '29A-12345', 'd-001', 45, 10.82302, 106.62966, 0.00, 0, TRUE),
('bus-002', '29A-67890', 'd-002', 50, 10.77700, 106.69500, 0.00, 0, TRUE);

-- Sample routes
INSERT IGNORE INTO routes (id, name, description, active) VALUES
('route-001', 'Route A', 'Main route for district 1', TRUE);

-- Sample route stops
INSERT IGNORE INTO route_stops (id, route_id, name, lat, lng, stop_order, is_pickup) VALUES
('stop-001', 'route-001', 'Stop 1 - Park', 10.78200, 106.69100, 1, TRUE),
('stop-002', 'route-001', 'Stop 2 - Market', 10.77200, 106.69800, 2, TRUE),
('stop-003', 'route-001', 'School', 10.77000, 106.70500, 3, FALSE);

-- Sample students
INSERT IGNORE INTO students (id, parent_user_id, full_name, grade, class, assigned_route_id, assigned_stop_id) VALUES
('stu-001', 'u-parent-1', 'Student A', 'Grade 8', 'Class 8A', 'route-001', 'stop-001');

-- Sample schedules for today
INSERT IGNORE INTO schedules (id, route_id, bus_id, scheduled_date, start_time, status) VALUES
('sch-001', 'route-001', 'bus-001', CURDATE(), '07:00:00', 'active');

-- Sample trips for today's schedule  
INSERT IGNORE INTO trips (id, schedule_id, student_id, status, picked_at, dropped_at) VALUES
('trip-001', 'sch-001', 'stu-001', 'onboard', NOW() - INTERVAL 30 MINUTE, NULL)
ON DUPLICATE KEY UPDATE 
    status = 'onboard',
    picked_at = NOW() - INTERVAL 30 MINUTE,
    dropped_at = NULL;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Database initialized successfully!' as status;
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM drivers) as total_drivers,
  (SELECT COUNT(*) FROM buses) as total_buses,
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM schedules) as total_schedules,
  (SELECT COUNT(*) FROM trips) as total_trips;
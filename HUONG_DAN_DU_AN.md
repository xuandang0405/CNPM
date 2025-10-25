# 🚌 HƯỚNG DẪN DỰ ÁN HỆ THỐNG QUẢN LÝ XE BUS TRƯỜNG HỌC

## 📋 MỤC LỤC
1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Cài đặt và chạy dự án](#3-cài-đặt-và-chạy-dự-án)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Hướng dẫn sử dụng](#5-hướng-dẫn-sử-dụng)
6. [Chi tiết kỹ thuật](#6-chi-tiết-kỹ-thuật)
7. [API Documentation](#7-api-documentation)
8. [Database Schema](#8-database-schema)
9. [Tính năng chi tiết](#9-tính-năng-chi-tiết)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
Hệ thống quản lý xe bus trường học là ứng dụng web full-stack giúp quản lý việc đưa đón học sinh, theo dõi vị trí xe bus theo thời gian thực, và giao tiếp giữa nhà trường, phụ huynh và tài xế.

### 1.2 Mục tiêu
- ✅ Theo dõi vị trí xe bus real-time
- ✅ Quản lý lịch trình đưa đón học sinh
- ✅ Thông báo tự động cho phụ huynh
- ✅ Quản lý thông tin học sinh, tài xế, xe bus
- ✅ Báo cáo và thống kê

### 1.3 Công nghệ sử dụng

#### **Frontend**
- **React 18** - UI Library
- **React Router v6** - Routing
- **Vite** - Build tool & Dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Leaflet** - Maps & GPS tracking
- **Socket.io-client** - Real-time communication

#### **Backend**
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
├─────────────────────────────────────────────────────────────┤
│  React App (Vite)                                          │
│  ├── Admin Panel (Quản lý toàn bộ hệ thống)               │
│  ├── Driver Panel (Tài xế - GPS tracking)                 │
│  └── Parent Panel (Phụ huynh - Theo dõi con)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS (REST API)
                 │ WebSocket (Real-time)
                 │
┌────────────────▼────────────────────────────────────────────┐
│                      SERVER SIDE                            │
├─────────────────────────────────────────────────────────────┤
│  Express.js Server                                          │
│  ├── REST API Endpoints                                     │
│  ├── Socket.io Server (Real-time GPS)                      │
│  ├── JWT Authentication                                     │
│  └── Middleware (CORS, Auth, Error handling)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ MySQL Connection
                 │
┌────────────────▼────────────────────────────────────────────┐
│                       DATABASE                              │
├─────────────────────────────────────────────────────────────┤
│  MySQL Database                                             │
│  ├── users (Người dùng)                                     │
│  ├── students (Học sinh)                                    │
│  ├── buses (Xe bus)                                         │
│  ├── routes (Tuyến đường)                                   │
│  ├── schedules (Lịch trình)                                 │
│  ├── trips (Chuyến đi)                                      │
│  └── notifications (Thông báo)                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flow hoạt động chính

#### **Luồng đăng nhập:**
```
User → Login Form → POST /api/auth/login 
     → Server verify credentials 
     → Generate JWT token 
     → Return user info + token 
     → Store in localStorage 
     → Redirect to role-based dashboard
```

#### **Luồng theo dõi GPS real-time:**
```
Driver App → Get GPS coordinates 
          → Emit 'location-update' via Socket.io 
          → Server broadcast to all clients 
          → Parent/Admin receive update 
          → Update map marker position
```

#### **Luồng tạo chuyến đi:**
```
Admin → Create Schedule 
      → Driver view schedule 
      → Driver start trip 
      → System track trip status 
      → Parents receive notifications 
      → Driver complete trip
```

---

## 3. CÀI ĐẶT VÀ CHẠY DỰ ÁN

### 3.1 Yêu cầu hệ thống
- Node.js >= 16.x
- MySQL >= 8.0
- npm hoặc yarn
- Git

### 3.2 Cài đặt

#### **Bước 1: Clone repository**
```bash
git clone https://github.com/xuandang0405/CNPM.git
cd CNPM
```

#### **Bước 2: Setup Backend**
```bash
cd backend
npm install
```

**Tạo file `.env`:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_bus_tracking
JWT_SECRET=your_super_secret_key_here_change_in_production
NODE_ENV=development
```

**Import database:**
```bash
# Windows
mysql -u root -p school_bus_tracking < db/database.sql

# Hoặc dùng script
node db/import-db.js
```

#### **Bước 3: Setup Frontend**
```bash
cd ../frontend
npm install
```

**File `src/config.js` đã được cấu hình:**
```javascript
export const API_URL = 'http://localhost:5000/api'
export const SOCKET_URL = 'http://localhost:5000'
```

### 3.3 Chạy dự án

#### **Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server chạy tại http://localhost:5000
```

#### **Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App chạy tại http://localhost:5173
```

### 3.4 Tài khoản test

| Vai trò | Email | Password | Mô tả |
|---------|-------|----------|-------|
| Admin | admin@school.com | admin123 | Quản trị viên |
| Driver | driver1@school.com | driver123 | Tài xế 1 |
| Driver | driver2@school.com | driver123 | Tài xế 2 |
| Parent | parent1@school.com | parent123 | Phụ huynh 1 |
| Parent | parent2@school.com | parent123 | Phụ huynh 2 |

---

## 4. CẤU TRÚC THƯ MỤC

### 4.1 Backend Structure
```
backend/
├── server.js                 # Entry point
├── db/
│   ├── connection.js        # MySQL connection
│   ├── database.sql         # Database schema
│   └── import-db.js         # Import script
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── admin.js            # Admin routes
│   ├── drivers.js          # Driver routes
│   ├── parents.js          # Parent routes
│   ├── buses.js            # Bus management
│   ├── routes.js           # Route management
│   ├── schedules.js        # Schedule management
│   ├── trips.js            # Trip tracking
│   └── notifications.js    # Notification system
├── middleware/
│   └── auth.js             # JWT verification
└── package.json
```

### 4.2 Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Main app component
│   ├── config.js                   # API configuration
│   ├── contexts/
│   │   ├── LanguageContext.jsx    # i18n context
│   │   └── ThemeContext.jsx       # Dark mode context
│   ├── store/
│   │   └── useUserStore.js        # Zustand store
│   ├── i18n/
│   │   └── index.js               # Translations (vi/en)
│   ├── api/
│   │   ├── admin.js               # Admin API calls
│   │   ├── driver.js              # Driver API calls
│   │   ├── parent.js              # Parent API calls
│   │   └── auth.js                # Auth API calls
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── DriverLayout.jsx
│   │   │   └── ParentLayout.jsx
│   │   └── common/
│   │       ├── LanguageSwitcher.jsx
│   │       ├── ThemeSwitcher.jsx
│   │       └── NotificationBadge.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── Buses.jsx
│   │   │   ├── Drivers.jsx
│   │   │   ├── Routes.jsx
│   │   │   ├── Schedule.jsx
│   │   │   ├── Tracking.jsx
│   │   │   └── Notifications.jsx
│   │   ├── driver/
│   │   │   ├── Home.jsx
│   │   │   ├── Map.jsx
│   │   │   └── Notifications.jsx
│   │   └── parent/
│   │       ├── Dashboard.jsx
│   │       ├── Tracking.jsx
│   │       └── Notifications.jsx
│   ├── hooks/
│   │   ├── useNotifications.js
│   │   └── useSocket.js
│   └── index.css
├── package.json
└── vite.config.js
```

---

## 5. HƯỚNG DẪN SỬ DỤNG

### 5.1 Admin Panel

#### **Đăng nhập:**
1. Truy cập `http://localhost:5173`
2. Đăng nhập với: `admin@school.com` / `admin123`
3. Chuyển đến Admin Dashboard

#### **Quản lý học sinh:**
1. Sidebar → Students
2. Click "Thêm học sinh mới"
3. Nhập thông tin: Họ tên, Lớp, Địa chỉ, Phụ huynh
4. Chọn xe bus và tuyến đường
5. Lưu

#### **Quản lý xe bus:**
1. Sidebar → Buses
2. Thêm xe: Biển số, Số ghế, Tài xế
3. Xem trạng thái: Đang hoạt động/Bảo trì

#### **Quản lý tài xế:**
1. Sidebar → Drivers
2. Thêm tài xế: Email, Tên, SĐT, GPLX
3. Gán xe bus

#### **Tạo lịch trình:**
1. Sidebar → Schedule
2. Click "Tạo lịch mới"
3. Chọn: Tuyến đường, Xe bus, Tài xế
4. Chọn ngày, giờ xuất phát
5. Chọn loại: Đón/Trả
6. Lưu lịch

#### **Theo dõi real-time:**
1. Sidebar → Tracking
2. Xem bản đồ với vị trí tất cả xe bus
3. Click vào marker để xem thông tin chi tiết
4. Theo dõi trạng thái chuyến đi

### 5.2 Driver Panel

#### **Đăng nhập:**
1. Login: `driver1@school.com` / `driver123`

#### **Xem lịch trình:**
1. Dashboard hiển thị lịch hôm nay
2. Xem chi tiết: Giờ khởi hành, Tuyến đường, Học sinh

#### **Bắt đầu chuyến đi:**
1. Click "Bắt đầu chuyến đi" trên lịch
2. Hệ thống tự động tracking GPS
3. Đánh dấu học sinh: Chờ đón → Đã lên xe → Đã xuống

#### **Kết thúc chuyến:**
1. Click "Hoàn thành chuyến đi"
2. Xác nhận tất cả học sinh đã xuống
3. Hệ thống lưu báo cáo

#### **Bản đồ:**
1. Sidebar → Map
2. Xem vị trí hiện tại
3. Xem tuyến đường
4. Navigation hỗ trợ

#### **Báo khẩn cấp:**
1. Click nút "Khẩn cấp" (Emergency)
2. Nhập lý do
3. Thông báo gửi đến Admin ngay lập tức

### 5.3 Parent Panel

#### **Đăng nhập:**
1. Login: `parent1@school.com` / `parent123`

#### **Theo dõi con:**
1. Dashboard hiển thị thông tin con
2. Xem xe bus, tài xế đang đưa đón
3. Trạng thái: Chờ đón / Đang trên xe / Đã về

#### **Theo dõi bản đồ:**
1. Sidebar → Tracking
2. Xem vị trí xe bus real-time
3. Xem khoảng cách ước tính
4. Thời gian đến dự kiến

#### **Thông báo:**
1. Nhận thông báo khi:
   - Xe bus bắt đầu chuyến
   - Con đã lên xe
   - Xe gần đến điểm đón/trả
   - Con đã xuống xe

#### **Báo nghỉ:**
1. Dashboard → Báo nghỉ
2. Chọn ngày nghỉ
3. Nhập lý do
4. Gửi thông báo

---

## 6. CHI TIẾT KỸ THUẬT

### 6.1 Authentication & Authorization

#### **JWT Token Flow:**
```javascript
// Backend - Generate token
const jwt = require('jsonwebtoken')
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Frontend - Store token
localStorage.setItem('token', token)

// Frontend - Send with requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

#### **Protected Routes:**
```javascript
// Backend middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' })
    req.user = decoded
    next()
  })
}

// Usage
router.get('/admin/students', verifyToken, (req, res) => {
  // Only accessible with valid token
})
```

### 6.2 Real-time GPS Tracking

#### **Socket.io Implementation:**

**Backend (server.js):**
```javascript
const io = require('socket.io')(server, {
  cors: { origin: 'http://localhost:5173' }
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Driver sends location
  socket.on('location-update', (data) => {
    // Broadcast to all clients
    io.emit('bus-location', {
      busId: data.busId,
      driverId: data.driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: Date.now()
    })
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})
```

**Frontend - Driver sends location:**
```javascript
// hooks/useSocket.js
import io from 'socket.io-client'
import { SOCKET_URL } from '../config'

const socket = io(SOCKET_URL)

// Driver component
const sendLocation = (latitude, longitude) => {
  socket.emit('location-update', {
    busId: currentBus.id,
    driverId: user.id,
    latitude,
    longitude
  })
}

// Get GPS from browser
navigator.geolocation.watchPosition((position) => {
  sendLocation(
    position.coords.latitude,
    position.coords.longitude
  )
}, null, { enableHighAccuracy: true })
```

**Frontend - Parent/Admin receives:**
```javascript
useEffect(() => {
  socket.on('bus-location', (data) => {
    // Update map marker
    setMarkerPosition([data.latitude, data.longitude])
  })
  
  return () => socket.off('bus-location')
}, [])
```

### 6.3 Internationalization (i18n)

#### **Language Context:**
```javascript
// contexts/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi'
  })
  
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi')
  }
  
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
```

#### **Translations:**
```javascript
// i18n/index.js
const translations = {
  vi: {
    dashboard: 'Bảng điều khiển',
    students: 'Học sinh',
    buses: 'Xe bus',
    // ... 200+ keys
  },
  en: {
    dashboard: 'Dashboard',
    students: 'Students',
    buses: 'Buses',
    // ... 200+ keys
  }
}

export const t = (lang, key) => {
  return translations[lang]?.[key] || key
}

// Usage in components
import { t } from '../i18n'
import { useLanguage } from '../contexts/LanguageContext'

const MyComponent = () => {
  const { language } = useLanguage()
  return <h1>{t(language, 'dashboard')}</h1>
}
```

### 6.4 State Management (Zustand)

```javascript
// store/useUserStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      logout: () => set({ user: null, token: null }),
      
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',
      isDriver: () => get().user?.role === 'driver',
      isParent: () => get().user?.role === 'parent'
    }),
    {
      name: 'user-storage',
      storage: localStorage
    }
  )
)

// Usage
const { user, setUser, logout } = useUserStore()
```

### 6.5 Dark Mode

```javascript
// contexts/ThemeContext.jsx
const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])
  
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Tailwind classes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

---

## 7. API DOCUMENTATION

### 7.1 Authentication

#### **POST /api/auth/login**
Đăng nhập vào hệ thống

**Request:**
```json
{
  "email": "admin@school.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@school.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

#### **POST /api/auth/register**
Đăng ký tài khoản mới (chỉ parent)

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "phone": "0123456789"
}
```

### 7.2 Admin APIs

#### **GET /api/admin/students**
Lấy danh sách học sinh

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
[
  {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "grade": "Lớp 5A",
    "address": "123 Nguyễn Trãi, Q.1",
    "parent_name": "Nguyễn Thị B",
    "bus_number": "BUS-001",
    "route_name": "Tuyến 1"
  }
]
```

#### **POST /api/admin/students**
Thêm học sinh mới

**Request:**
```json
{
  "full_name": "Trần Văn B",
  "grade": "Lớp 3B",
  "address": "456 Lê Lợi",
  "parent_id": 5,
  "bus_id": 2,
  "route_id": 1
}
```

#### **GET /api/admin/buses**
Lấy danh sách xe bus

#### **POST /api/admin/buses**
Thêm xe bus mới

**Request:**
```json
{
  "bus_number": "BUS-003",
  "capacity": 45,
  "driver_id": 3,
  "status": "active"
}
```

#### **GET /api/admin/drivers**
Lấy danh sách tài xế

#### **POST /api/admin/schedules**
Tạo lịch trình mới

**Request:**
```json
{
  "route_id": 1,
  "bus_id": 2,
  "driver_id": 3,
  "scheduled_date": "2025-10-26",
  "departure_time": "07:00:00",
  "trip_type": "pickup"
}
```

### 7.3 Driver APIs

#### **GET /api/drivers/schedule/:driverId**
Lấy lịch trình của tài xế

**Response:**
```json
[
  {
    "schedule_id": 1,
    "route_name": "Tuyến 1",
    "bus_number": "BUS-001",
    "scheduled_date": "2025-10-26",
    "departure_time": "07:00:00",
    "trip_type": "pickup",
    "students": [
      {
        "id": 1,
        "name": "Nguyễn Văn A",
        "address": "123 Nguyễn Trãi",
        "status": "waiting"
      }
    ]
  }
]
```

#### **POST /api/drivers/trip/start**
Bắt đầu chuyến đi

**Request:**
```json
{
  "schedule_id": 1,
  "driver_id": 3
}
```

#### **PUT /api/drivers/trip/:tripId/student/:studentId**
Cập nhật trạng thái học sinh

**Request:**
```json
{
  "status": "picked_up"
}
```

**Possible statuses:**
- `waiting_pickup` - Chờ đón
- `picked_up` - Đã lên xe
- `dropped_off` - Đã xuống xe
- `absent` - Vắng mặt

#### **POST /api/drivers/trip/:tripId/complete**
Hoàn thành chuyến đi

### 7.4 Parent APIs

#### **GET /api/parents/children/:parentId**
Lấy thông tin con của phụ huynh

**Response:**
```json
[
  {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "grade": "Lớp 5A",
    "bus_number": "BUS-001",
    "driver_name": "Trần Văn C",
    "driver_phone": "0987654321",
    "current_status": "picked_up",
    "current_trip": {
      "id": 5,
      "type": "pickup",
      "status": "in_progress"
    }
  }
]
```

#### **GET /api/parents/notifications/:parentId**
Lấy thông báo của phụ huynh

### 7.5 Notifications

#### **GET /api/notifications/:role/:userId**
Lấy thông báo theo role

**Query params:**
- `unread_only=true` - Chỉ lấy chưa đọc

**Response:**
```json
[
  {
    "id": 1,
    "title": "Xe bus đang đến",
    "message": "Xe bus BUS-001 sẽ đến trong 5 phút",
    "type": "trip_update",
    "is_read": false,
    "created_at": "2025-10-26T07:25:00"
  }
]
```

#### **PUT /api/notifications/:id/read**
Đánh dấu đã đọc

---

## 8. DATABASE SCHEMA

### 8.1 Table: users
Lưu thông tin người dùng (Admin, Driver, Parent)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'driver', 'parent') NOT NULL,
  license_number VARCHAR(50),  -- Chỉ cho driver
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.2 Table: buses
Thông tin xe bus

```sql
CREATE TABLE buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_number VARCHAR(20) UNIQUE NOT NULL,
  capacity INT NOT NULL,
  driver_id INT,
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  FOREIGN KEY (driver_id) REFERENCES users(id)
);
```

### 8.3 Table: routes
Tuyến đường

```sql
CREATE TABLE routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_name VARCHAR(255) NOT NULL,
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  distance_km DECIMAL(10,2),
  estimated_duration INT  -- minutes
);
```

### 8.4 Table: students
Học sinh

```sql
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  address TEXT,
  parent_id INT NOT NULL,
  bus_id INT,
  route_id INT,
  latitude DECIMAL(10, 8),  -- GPS của nhà
  longitude DECIMAL(11, 8),
  FOREIGN KEY (parent_id) REFERENCES users(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);
```

### 8.5 Table: schedules
Lịch trình

```sql
CREATE TABLE schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  bus_id INT NOT NULL,
  driver_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  trip_type ENUM('pickup', 'dropoff') NOT NULL,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);
```

### 8.6 Table: trips
Chuyến đi thực tế

```sql
CREATE TABLE trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id INT NOT NULL,
  driver_id INT NOT NULL,
  bus_id INT NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);
```

### 8.7 Table: trip_students
Trạng thái học sinh trong chuyến đi

```sql
CREATE TABLE trip_students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('waiting_pickup', 'picked_up', 'dropped_off', 'absent') DEFAULT 'waiting_pickup',
  pickup_time TIMESTAMP,
  dropoff_time TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### 8.8 Table: notifications
Thông báo

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type ENUM('trip_start', 'trip_update', 'trip_complete', 'emergency', 'system') NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 8.9 Database Relationships

```
users (parent) ─┬─── students
                │
users (driver) ─┴─── buses ──── schedules ──── trips ──── trip_students
                      │           │                           │
                      │           │                           │
routes ───────────────┴───────────┘                           │
                                                               │
students ──────────────────────────────────────────────────────┘
```

---

## 9. TÍNH NĂNG CHI TIẾT

### 9.1 GPS Tracking Real-time

#### **Cách hoạt động:**
1. Driver app request quyền truy cập GPS từ browser
2. Sử dụng `navigator.geolocation.watchPosition()`
3. Mỗi khi vị trí thay đổi → emit lên server qua Socket.io
4. Server broadcast đến tất cả clients
5. Map component nhận và cập nhật marker

#### **Code example:**

**Driver component:**
```javascript
useEffect(() => {
  if (!navigator.geolocation) {
    alert('Trình duyệt không hỗ trợ GPS')
    return
  }
  
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      
      // Send to server
      socket.emit('location-update', {
        busId: currentBus.id,
        driverId: user.id,
        latitude,
        longitude,
        accuracy: position.coords.accuracy
      })
      
      // Update local map
      setCurrentLocation({ lat: latitude, lng: longitude })
    },
    (error) => {
      console.error('GPS Error:', error)
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  )
  
  return () => navigator.geolocation.clearWatch(watchId)
}, [socket, currentBus, user])
```

**Parent Tracking component:**
```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const ParentTracking = () => {
  const [busLocation, setBusLocation] = useState(null)
  
  useEffect(() => {
    socket.on('bus-location', (data) => {
      if (data.busId === childBusId) {
        setBusLocation([data.latitude, data.longitude])
      }
    })
    
    return () => socket.off('bus-location')
  }, [])
  
  return (
    <MapContainer center={[10.762622, 106.660172]} zoom={13}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {busLocation && (
        <Marker position={busLocation} icon={busIcon}>
          <Popup>Xe bus của con bạn</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
```

### 9.2 Notification System

#### **Tự động gửi thông báo khi:**

1. **Trip Start** - Chuyến đi bắt đầu
```javascript
// Backend - trips.js
router.post('/trip/start', verifyToken, async (req, res) => {
  const { schedule_id, driver_id } = req.body
  
  // Create trip
  const trip = await createTrip(schedule_id, driver_id)
  
  // Get all students in this trip
  const students = await getStudentsInSchedule(schedule_id)
  
  // Send notification to all parents
  for (const student of students) {
    await createNotification({
      user_id: student.parent_id,
      title: 'Chuyến đi đã bắt đầu',
      message: `Xe bus ${student.bus_number} đã bắt đầu chuyến đi`,
      type: 'trip_start'
    })
  }
  
  res.json({ trip })
})
```

2. **Student Status Update** - Học sinh lên/xuống xe
```javascript
router.put('/trip/:tripId/student/:studentId', async (req, res) => {
  const { status } = req.body
  
  await updateStudentStatus(tripId, studentId, status)
  
  const student = await getStudent(studentId)
  
  if (status === 'picked_up') {
    await createNotification({
      user_id: student.parent_id,
      title: 'Con đã lên xe',
      message: `${student.full_name} đã lên xe bus`,
      type: 'trip_update'
    })
  }
  
  if (status === 'dropped_off') {
    await createNotification({
      user_id: student.parent_id,
      title: 'Con đã xuống xe',
      message: `${student.full_name} đã được đưa về`,
      type: 'trip_update'
    })
  }
})
```

3. **Emergency Alert** - Cảnh báo khẩn cấp
```javascript
router.post('/emergency', async (req, res) => {
  const { driver_id, bus_id, message } = req.body
  
  // Notify admin
  const admins = await getAdmins()
  for (const admin of admins) {
    await createNotification({
      user_id: admin.id,
      title: '🚨 CẢNH BÁO KHẨN CẤP',
      message: `Tài xế ${driverName} báo khẩn cấp: ${message}`,
      type: 'emergency'
    })
  }
  
  // Notify all parents of students on this bus
  const students = await getStudentsOnBus(bus_id)
  for (const student of students) {
    await createNotification({
      user_id: student.parent_id,
      title: 'Thông báo khẩn cấp',
      message: 'Xe bus của con bạn có tình huống khẩn cấp',
      type: 'emergency'
    })
  }
})
```

### 9.3 Trip Status Flow

```
scheduled (Đã lên lịch)
    │
    ▼
in_progress (Đang thực hiện)
    │
    ├─→ Student: waiting_pickup
    ├─→ Student: picked_up
    ├─→ Student: dropped_off
    │
    ▼
completed (Hoàn thành)
```

**Driver workflow:**
```
1. View schedule
2. Click "Bắt đầu chuyến đi"
   → Trip status: in_progress
   → All students: waiting_pickup
   
3. Arrive at student location
4. Click student name → "Đã lên xe"
   → Student status: picked_up
   → Parent receives notification
   
5. Arrive at school/home
6. Click student name → "Đã xuống xe"
   → Student status: dropped_off
   → Parent receives notification
   
7. All students dropped off
8. Click "Hoàn thành chuyến đi"
   → Trip status: completed
   → Save trip report
```

### 9.4 Route Optimization

**Tính toán tuyến đường tối ưu:**
```javascript
// Helper function
const calculateOptimalRoute = async (studentAddresses) => {
  // Sử dụng thuật toán TSP (Traveling Salesman Problem)
  // hoặc Google Maps Directions API
  
  const waypoints = studentAddresses.map(addr => ({
    location: addr,
    stopover: true
  }))
  
  // Gọi Google Maps API
  const route = await getDirections({
    origin: schoolAddress,
    destination: schoolAddress,
    waypoints: waypoints,
    optimizeWaypoints: true
  })
  
  return route
}
```

### 9.5 Absence Reporting

**Phụ huynh báo nghỉ:**
```javascript
// Parent component
const reportAbsence = async (studentId, date, reason) => {
  await axios.post('/api/parents/absence', {
    student_id: studentId,
    absence_date: date,
    reason: reason
  })
  
  // Notify driver
  await createNotification({
    user_id: driverId,
    title: 'Học sinh nghỉ',
    message: `${studentName} nghỉ ngày ${date}`,
    type: 'system'
  })
}

// Driver sees absent students marked in red
<div className={student.status === 'absent' ? 'text-red-500' : ''}>
  {student.name}
</div>
```

---

## 10. TROUBLESHOOTING

### 10.1 Frontend không kết nối được Backend

**Lỗi:** `Network Error` hoặc `CORS Error`

**Giải pháp:**
```javascript
// 1. Kiểm tra backend đang chạy
// Terminal 1: cd backend && npm run dev

// 2. Kiểm tra config.js
// frontend/src/config.js
export const API_URL = 'http://localhost:5000/api' // Đúng port

// 3. Kiểm tra CORS trong backend
// backend/server.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

### 10.2 Socket.io không hoạt động

**Lỗi:** Không nhận được location updates

**Giải pháp:**
```javascript
// 1. Kiểm tra Socket.io server
// backend/server.js - Đảm bảo đã khởi tạo
const io = require('socket.io')(server, {
  cors: { origin: '*' }
})

// 2. Kiểm tra client connection
// Frontend
useEffect(() => {
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })
  
  socket.on('connect_error', (error) => {
    console.error('Socket error:', error)
  })
}, [])

// 3. Kiểm tra firewall/antivirus
// Tắt tạm thời để test
```

### 10.3 Database connection failed

**Lỗi:** `ER_ACCESS_DENIED_ERROR` hoặc `ECONNREFUSED`

**Giải pháp:**
```bash
# 1. Kiểm tra MySQL đang chạy
# Windows: Services → MySQL → Start

# 2. Kiểm tra credentials
# backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password  # Đổi lại đúng
DB_NAME=school_bus_tracking

# 3. Test connection
node backend/db/connection.js

# 4. Tạo database nếu chưa có
mysql -u root -p
CREATE DATABASE school_bus_tracking;
EXIT;

# 5. Import lại database
mysql -u root -p school_bus_tracking < backend/db/database.sql
```

### 10.4 JWT Token hết hạn

**Lỗi:** `403 Forbidden` - Invalid token

**Giải pháp:**
```javascript
// Frontend - Tự động logout khi token hết hạn
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Hoặc refresh token
// Backend - Tăng thời gian expire
jwt.sign(payload, secret, { expiresIn: '30d' })
```

### 10.5 Map không hiển thị

**Lỗi:** Bản đồ trắng hoặc tiles không load

**Giải pháp:**
```javascript
// 1. Import CSS
// main.jsx hoặc index.html
import 'leaflet/dist/leaflet.css'

// 2. Fix marker icons
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
})

L.Marker.prototype.options.icon = DefaultIcon

// 3. Kiểm tra internet connection
// OpenStreetMap tiles cần internet
```

### 10.6 GPS không hoạt động

**Lỗi:** `User denied Geolocation`

**Giải pháp:**
```javascript
// 1. HTTPS required cho production
// Development: Allow in browser settings

// 2. Xử lý permission denied
navigator.geolocation.getCurrentPosition(
  (position) => {
    // Success
  },
  (error) => {
    if (error.code === error.PERMISSION_DENIED) {
      alert('Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt')
    }
  }
)

// 3. Chrome: Settings → Privacy → Location → Allow

// 4. Mobile: Bật GPS trong cài đặt điện thoại
```

### 10.7 Performance Issues

**Vấn đề:** App chậm, lag

**Giải pháp:**
```javascript
// 1. Throttle GPS updates
import { throttle } from 'lodash'

const sendLocation = throttle((lat, lng) => {
  socket.emit('location-update', { lat, lng })
}, 3000) // Chỉ gửi mỗi 3 giây

// 2. Optimize re-renders
import { memo } from 'react'

const MapComponent = memo(({ location }) => {
  // Component chỉ re-render khi location thay đổi
})

// 3. Lazy load pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))

// 4. Database indexes
CREATE INDEX idx_trip_date ON schedules(scheduled_date);
CREATE INDEX idx_user_role ON users(role);
```

### 10.8 Build/Deploy Issues

**Lỗi:** Production build failed

**Giải pháp:**
```bash
# 1. Clear cache
cd frontend
rm -rf node_modules package-lock.json
npm install

# 2. Build với error log
npm run build -- --debug

# 3. Kiểm tra env variables
# .env.production
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=https://your-domain.com

# 4. Backend production
# .env
NODE_ENV=production
PORT=5000

# 5. Deploy checklist
- Database đã import
- .env đã cấu hình đúng
- CORS cho phép domain production
- SSL certificate (HTTPS)
```

---

## 📞 HỖ TRỢ

### Liên hệ:
- **Email:** xuandang0405@gmail.com
- **GitHub:** https://github.com/xuandang0405/CNPM

### Tài liệu tham khảo:
- React: https://react.dev
- Express: https://expressjs.com
- Socket.io: https://socket.io
- Leaflet: https://leafletjs.com
- Tailwind CSS: https://tailwindcss.com


## 📝 CHANGELOG

### Version 1.0.0 (Current)
- ✅ Hệ thống authentication với JWT
- ✅ 3 role: Admin, Driver, Parent
- ✅ GPS tracking real-time
- ✅ Trip management
- ✅ Notification system
- ✅ Multi-language (vi/en)
- ✅ Dark mode
- ✅ Responsive design
- ✅ Map integration

### Future Updates (Roadmap)
- [ ] Push notifications (FCM)
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Video call support
- [ ] Attendance reports
- [ ] Parent feedback system

---

**Chúc bạn thành công với dự án! 🎉**

# Quản lý Xe Buýt - Frontend

Giao diện frontend (Vite + React) cho dự án quản lý xe buýt trường học.

Tính năng nhỏ:
- Hỗ trợ đa ngôn ngữ (Tiếng Việt / English) — chuyển đổi ngôn ngữ bằng nút trên header.
- Dashboard quản trị, quản lý xe/tài xế/tuyến/lịch, theo dõi realtime (yêu cầu backend socket).

Features included:
- Vite React setup
- Tailwind CSS configured
- React Router with role-based PrivateRoute
- Zustand store for user info
- Mocked useAuth hook
- Socket.IO realtime hook (`useRealtimeLocation`)
- React-Leaflet map components

Quick start (Windows PowerShell):

# Install dependencies
npm install

# Start dev server
npm run dev

Notes:
- Tailwind and Vite are preconfigured. If editor shows CSS lint errors for `@tailwind` rules, that's normal until PostCSS/Tailwind build runs.
- Update Socket.IO backend URL in `src/hooks/useRealtimeLocation.js`.

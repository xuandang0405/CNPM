import axios from 'axios';

// Normalize backend URL to avoid cases like ":25565/api" (missing host)
function normalizeBaseUrl(raw) {
    let url = (raw || '').trim();
    if (!url) return 'http://localhost:25565/api';
    // If starts with ":", prepend localhost (e.g., ":25565/api" => "http://localhost:25565/api")
    if (url.startsWith(':')) url = `http://localhost${url}`;
    // If missing protocol, default to http
    if (!/^https?:\/\//i.test(url)) url = `http://${url.replace(/^\/+/, '')}`;
    return url;
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL) || 'http://localhost:25565/api'; 

const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
instance.interceptors.request.use(
    (config) => {
        // Try sessionStorage first (per-tab), then fallback to localStorage
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle auth errors
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;
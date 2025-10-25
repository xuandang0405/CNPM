// src/api/buses.js

import axios from './axios'; // Giả định bạn có file axios.js để cấu hình baseURL

const BUS_API = '/buses'; 

const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Lấy token từ localStorage
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/** Lấy danh sách xe buýt. Gọi GET /api/buses. */
export async function listBuses() {
    try {
        const response = await axios.get(BUS_API, getAuthHeaders());
        return response.data; 
    } catch (error) {
        console.error('Error listing buses:', error);
        return [];
    }
}

/** Tạo xe buýt mới. Gọi POST /api/buses. */
export async function createBus(busData) {
    try {
        const response = await axios.post(BUS_API, busData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to create bus');
    }
}

/** Cập nhật xe buýt. Gọi PUT /api/buses/:id. */
export async function updateBus(id, busData) {
    try {
        const response = await axios.put(`${BUS_API}/${id}`, busData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to update bus');
    }
}

/** Xóa xe buýt. Gọi DELETE /api/buses/:id. */
export async function deleteBus(id) {
    try {
        const response = await axios.delete(`${BUS_API}/${id}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to delete bus');
    }
}
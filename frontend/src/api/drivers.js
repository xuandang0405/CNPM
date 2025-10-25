import axios from './axios'; // Giả định import từ file cấu hình Axios

const DRIVER_API = '/admin/drivers'; 

// Helper để lấy token (giả sử bạn đã có trong src/api/buses.js hoặc một file helper chung)
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/**
 * Lấy danh sách tất cả tài xế.
 * Tương ứng với: GET /api/drivers
 * @returns {Promise<Array>} Danh sách tài xế
 */
export async function listDrivers() {
    try {
        console.log('API: Calling listDrivers...')
        const response = await axios.get(DRIVER_API, getAuthHeaders())
        console.log('API: listDrivers response:', response.data)
        return response.data
    } catch (error) {
        console.error('Error listing drivers:', error)
        console.error('Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        })
        return []
    }
}

/**
 * Thêm tài xế mới.
 * Tương ứng với: POST /api/drivers
 * @param {object} driverData - Dữ liệu tài xế mới ({ full_name, email, phone, ... })
 * @returns {Promise<object>} Thông tin tài xế đã tạo
 */
export async function createDriver(driverData) {
    try {
        console.log('API: Creating driver with data:', driverData)
        const response = await axios.post(DRIVER_API, driverData, getAuthHeaders());
        console.log('API: Create driver response:', response.data)
        return response.data;
    } catch (error) {
        console.error('API: Create driver error:', error)
        const errorData = error.response?.data || error.message;
        console.error('API: Error data:', errorData);
        console.error('API: Error status:', error.response?.status);
        throw {
            error: errorData?.error || 'Failed to create driver',
            message: error.message,
            status: error.response?.status
        };
    }
}

/**
 * Cập nhật thông tin tài xế.
 * Tương ứng với: PUT /api/drivers/:id
 * @param {string} id - ID của tài xế cần cập nhật
 * @param {object} driverData - Dữ liệu cập nhật ({ full_name, email, phone, active, ...})
 * @returns {Promise<object>} Thông tin tài xế đã cập nhật
 */
export async function updateDriver(id, driverData) {
    try {
        console.log(`API: Updating driver ${id} with data:`, driverData)
        const response = await axios.put(`${DRIVER_API}/${id}`, driverData, getAuthHeaders());
        console.log(`API: Update driver ${id} response:`, response.data)
        return response.data;
    } catch (error) {
        console.error(`API: Update driver ${id} error:`, error)
        const errorData = error.response?.data || error.message;
        console.error(`API: Error data for driver ${id}:`, errorData);
        console.error(`API: Error status for driver ${id}:`, error.response?.status);
        throw {
            error: errorData?.error || 'Failed to update driver',
            message: error.message,
            status: error.response?.status
        };
    }
}

/**
 * Xóa tài xế.
 * Tương ứng với: DELETE /api/drivers/:id
 * @param {string} id - ID của tài xế cần xóa
 * @returns {Promise<object>} Trạng thái thành công
 */
export async function deleteDriver(id) {
    try {
        console.log(`API: Deleting driver ${id}`)
        const response = await axios.delete(`${DRIVER_API}/${id}`, getAuthHeaders());
        console.log(`API: Delete driver ${id} response:`, response.data)
        return response.data;
    } catch (error) {
        console.error(`API: Delete driver ${id} error:`, error)
        const errorData = error.response?.data || error.message;
        console.error(`API: Error data for driver ${id}:`, errorData);
        console.error(`API: Error status for driver ${id}:`, error.response?.status);
        throw {
            error: errorData?.error || 'Failed to delete driver',
            message: error.message,
            status: error.response?.status
        };
    }
}

// export default listDrivers; // Giữ lại cho tương thích
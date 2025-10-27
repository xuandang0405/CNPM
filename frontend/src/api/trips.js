import axios from './axios';

// Lấy lịch làm việc của driver hôm nay
export const getDriverSchedule = async () => {
  try {
    const response = await axios.get('/trips/my-schedule');
    return response.data;
  } catch (error) {
    console.error('Error fetching driver schedule:', error);
    throw error;
  }
};

// Lấy danh sách học sinh trong lịch trình
export const getScheduleStudents = async (scheduleId) => {
  try {
    const response = await axios.get(`/trips/schedule/${scheduleId}/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule students:', error);
    throw error;
  }
};

// Cập nhật trạng thái chuyến đi của học sinh
export const updateTripStatus = async (tripId, status, notes = null) => {
  try {
    const response = await axios.put(`/trips/${tripId}/status`, { 
      status,
      notes 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating trip status:', error);
    throw error;
  }
};

// Note: Emergency APIs removed.

// Cập nhật vị trí thời gian thực
export const updateDriverLocation = async (lat, lng, speed = 0, heading = 0, accuracy = 10) => {
  try {
    const response = await axios.post('/trips/location', {
      lat,
      lng,
      speed,
      heading,
      accuracy
    });
    return response.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Lấy thông tin điểm dừng của tuyến đường
export const getRouteStops = async (routeId) => {
  try {
    const response = await axios.get(`/trips/route/${routeId}/stops`);
    return response.data;
  } catch (error) {
    console.error('Error fetching route stops:', error);
    throw error;
  }
};

// Test kết nối database
export const testDatabaseConnection = async () => {
  try {
    const response = await axios.get('/trips/test');
    return response.data;
  } catch (error) {
    console.error('Error testing database connection:', error);
    throw error;
  }
};

// Bắt đầu chuyến đi
export const startTrip = async (scheduleId) => {
  try {
    const response = await axios.post(`/trips/schedule/${scheduleId}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting trip:', error);
    throw error;
  }
};

// Kết thúc chuyến đi
export const completeTrip = async (scheduleId) => {
  try {
    const response = await axios.post(`/trips/schedule/${scheduleId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing trip:', error);
    throw error;
  }
};

// Admin: get active drivers currently running trips
export const getActiveDriversAdmin = async () => {
  try {
    const response = await axios.get('/trips/admin/active-drivers');
    return response.data;
  } catch (error) {
    console.error('Error fetching active drivers (admin):', error);
    throw error;
  }
};

// Admin: get students for a specific schedule
export const getScheduleStudentsAdmin = async (scheduleId) => {
  try {
    const response = await axios.get(`/trips/admin/schedule/${scheduleId}/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule students (admin):', error);
    throw error;
  }
};
import axiosInstance from './axios';

// Get all children of parent
export const getChildren = async () => {
  const response = await axiosInstance.get('/parents/children');
  return response.data;
};

// Get dashboard data with children and today's trips
export const getDashboard = async () => {
  const response = await axiosInstance.get('/parents/dashboard');
  return response.data;
};

// Get child's bus location (real-time tracking)
export const getChildBusLocation = async (childId) => {
  const response = await axiosInstance.get(`/parents/child/${childId}/bus-location`);
  return response.data;
};

// Get child's trip history
export const getChildTripHistory = async (childId, params = {}) => {
  const { limit = 30, offset = 0 } = params;
  const response = await axiosInstance.get(`/parents/child/${childId}/trip-history`, {
    params: { limit, offset }
  });
  return response.data;
};

// Report child absence
export const reportAbsence = async (data) => {
  const response = await axiosInstance.post('/parents/absence-report', data);
  return response.data;
};

// Get absence reports
export const getAbsenceReports = async () => {
  const response = await axiosInstance.get('/parents/absence-reports');
  return response.data;
};

// Get safety zones
export const getSafetyZones = async () => {
  const response = await axiosInstance.get('/parents/safety-zones');
  return response.data;
};

// Create safety zone
export const createSafetyZone = async (data) => {
  const response = await axiosInstance.post('/parents/safety-zones', data);
  return response.data;
};

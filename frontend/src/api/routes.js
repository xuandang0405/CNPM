import axios from './axios'

const ROUTES_API = '/routes'

const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
}

export async function listRoutes() {
    try {
        const response = await axios.get(ROUTES_API, getAuthHeaders())
        return response.data
    } catch (error) {
        console.error('Error listing routes:', error)
        return []
    }
}

export async function getRoute(id) {
    try {
        const response = await axios.get(`${ROUTES_API}/${id}`, getAuthHeaders())
        return response.data
    } catch (error) {
        console.error('Error getting route:', error)
        return null
    }
}

export async function createRoute(payload) {
    try {
        const response = await axios.post(ROUTES_API, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to create route')
    }
}

export async function updateRoute(id, payload) {
    try {
        const response = await axios.put(`${ROUTES_API}/${id}`, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to update route')
    }
}

export async function deleteRoute(id) {
    try {
        const response = await axios.delete(`${ROUTES_API}/${id}`, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to delete route')
    }
}

// Route Stops APIs
export async function addRouteStop(routeId, payload) {
    try {
        const response = await axios.post(`${ROUTES_API}/${routeId}/stops`, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to add route stop')
    }
}

export async function updateRouteStop(routeId, stopId, payload) {
    try {
        const response = await axios.put(`${ROUTES_API}/${routeId}/stops/${stopId}`, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to update route stop')
    }
}

export async function deleteRouteStop(routeId, stopId) {
    try {
        const response = await axios.delete(`${ROUTES_API}/${routeId}/stops/${stopId}`, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to delete route stop')
    }
}

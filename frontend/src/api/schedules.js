import axios from './axios'

const SCHEDULES_API = '/schedules'

const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
}

export async function listSchedules() {
    try {
        const response = await axios.get(SCHEDULES_API, getAuthHeaders())
        return response.data
    } catch (error) {
        console.error('Error listing schedules:', error)
        return []
    }
}

export async function getSchedule(id) {
    try {
        const response = await axios.get(`${SCHEDULES_API}/${id}`, getAuthHeaders())
        return response.data
    } catch (error) {
        console.error('Error getting schedule:', error)
        return null
    }
}

export async function createSchedule(payload) {
    try {
        const response = await axios.post(SCHEDULES_API, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to create schedule')
    }
}

export async function updateSchedule(id, payload) {
    try {
        const response = await axios.put(`${SCHEDULES_API}/${id}`, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to update schedule')
    }
}

export async function deleteSchedule(id) {
    try {
        const response = await axios.delete(`${SCHEDULES_API}/${id}`, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to delete schedule')
    }
}

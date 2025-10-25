import axios from './axios'

const NOTIFICATIONS_API = '/notifications'

const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
}

export async function listNotifications() {
    try {
        const response = await axios.get(NOTIFICATIONS_API, getAuthHeaders())
        return response.data
    } catch (error) {
        console.error('Error listing notifications:', error)
        return []
    }
}

export async function sendNotification(payload) {
    try {
        const response = await axios.post(`${NOTIFICATIONS_API}/send`, payload, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to send notification')
    }
}

export async function getNotification(id) {
    try {
        const response = await axios.get(`${NOTIFICATIONS_API}/${id}`, getAuthHeaders())
        return response.data
    } catch (error) {
        console.error('Error getting notification:', error)
        return null
    }
}

export async function deleteNotification(id) {
    try {
        const response = await axios.delete(`${NOTIFICATIONS_API}/${id}`, getAuthHeaders())
        return response.data
    } catch (error) {
        throw error.response?.data || new Error('Failed to delete notification')
    }
}

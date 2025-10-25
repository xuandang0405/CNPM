import { useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import axiosInstance from '../api/axios'
import useUserStore from '../store/useUserStore'

let socket = null

export default function useNotifications() {
  const { user } = useUserStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  // Connect to WebSocket
  useEffect(() => {
    if (!user?.id) return

    const SOCKET_URL = 'http://localhost:25565'
    
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      })

      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id)
        socket.emit('join', user.id)
      })

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
      })
    }

    // Listen for new notifications
    socket.on('new_notification', (notification) => {
      console.log('Received new notification:', notification)
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev])
      
      // Increment unread count
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico'
        })
      }
    })

    return () => {
      if (socket) {
        socket.off('new_notification')
      }
    }
  }, [user?.id])

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      let endpoint = '/notifications'
      if (user.role === 'parent') {
        endpoint = '/parents/notifications'
      } else if (user.role === 'driver') {
        endpoint = '/drivers/notifications'
      }
      
      const { data } = await axiosInstance.get(endpoint)
      const notifList = data.notifications || []
      
      setNotifications(notifList)
      setUnreadCount(notifList.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Don't throw, just log - notifications are not critical
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role])

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return
    
    try {
      let endpoint = '/notifications/unread/count'
      if (user.role === 'parent') {
        endpoint = '/parents/notifications/unread/count'
      } else if (user.role === 'driver') {
        endpoint = '/drivers/notifications/unread/count'
      }
      
      const { data } = await axiosInstance.get(endpoint)
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
      // Don't throw, just set to 0
      setUnreadCount(0)
    }
  }, [user?.id, user?.role])

  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      let endpoint = `/notifications/${notificationId}`
      if (user.role === 'parent') {
        endpoint = `/parents/notifications/${notificationId}/read`
      }
      
      await axiosInstance.put(endpoint, { is_read: true })
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [user?.role])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      let endpoint = `/notifications/${notificationId}`
      if (user.role === 'parent') {
        endpoint = `/parents/notifications/${notificationId}`
      }
      
      await axiosInstance.delete(endpoint)
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [user?.role, notifications])

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      }
      return Notification.permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [])

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          loadNotifications(),
          loadUnreadCount(),
          requestPermission()
        ])
      } catch (error) {
        console.error('Error initializing notifications:', error)
      }
    }
    
    init()
  }, [loadNotifications, loadUnreadCount, requestPermission])

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    deleteNotification,
    requestPermission
  }
}

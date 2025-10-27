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
      // If driver, ignore emergency-type notifications entirely
      if (user?.role === 'driver' && (notification?.type === 'emergency' || notification?.notif_type === 'emergency')) {
        return;
      }
      
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
      
      // Use generic endpoint for all roles to avoid route conflicts
      const { data } = await axiosInstance.get('/notifications')
      let notifList = data.notifications || []
      // Safety filter on client as well (in case backend changes)
      if (user.role === 'driver') {
        notifList = notifList.filter(n => (n?.type || n?.notif_type) !== 'emergency')
      }
      
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
  const { data } = await axiosInstance.get('/notifications/unread/count')
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
      // Generic mark-as-read
      await axiosInstance.put(`/notifications/${notificationId}`, { is_read: true })
      
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
      // Generic delete
      await axiosInstance.delete(`/notifications/${notificationId}`)
      
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

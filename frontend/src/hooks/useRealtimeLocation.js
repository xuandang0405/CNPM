import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

// mode: 'all' | 'single'
export default function useRealtimeLocation({ mode = 'all', busId = null } = {}) {
  const [buses, setBuses] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    // NOTE: replace with your backend socket URL
    const socket = io('http://localhost:3000')
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('socket connected', socket.id)
      if (mode === 'single' && busId) socket.emit('subscribeBus', busId)
      else socket.emit('subscribeAll')
    })

    socket.on('busLocation', data => {
      // data: { id, lat, lng, speed, students }
      setBuses(prev => {
        const idx = prev.findIndex(b => b.id === data.id)
        if (idx === -1) return [...prev, data]
        const copy = [...prev]
        copy[idx] = { ...copy[idx], ...data }
        return copy
      })
    })

    socket.on('disconnect', () => console.log('socket disconnected'))

    return () => {
      if (socket) socket.disconnect()
    }
  }, [mode, busId])

  return { buses, socket: socketRef.current }
}

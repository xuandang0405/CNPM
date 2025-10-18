const { io } = require('socket.io-client')

const socket = io('http://localhost:3000')

socket.on('connect', () => {
  console.log('test-client connected', socket.id)
  socket.emit('subscribeAll')
})

socket.on('busLocation', data => {
  console.log('busLocation', data)
})

socket.on('disconnect', () => {
  console.log('test-client disconnected')
})

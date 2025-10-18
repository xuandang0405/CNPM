import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

// initial buses
let buses = [
  { id: 'bus-1', lat: 10.770, lng: 106.680, speed: 25, students: 12, plate: '29A-0001' },
  { id: 'bus-2', lat: 10.780, lng: 106.690, speed: 20, students: 18, plate: '29A-0002' },
  { id: 'bus-3', lat: 10.760, lng: 106.700, speed: 22, students: 10, plate: '29A-0003' },
]

function moveBus(b) {
  // simple movement: add small delta to lat/lng
  const dLat = (Math.random() - 0.5) * 0.001
  const dLng = (Math.random() - 0.5) * 0.001
  b.lat += dLat
  b.lng += dLng
  // random small speed change
  b.speed = Math.max(5, Math.round((b.speed || 20) + (Math.random()-0.5)*4))
  // randomly set delay flag
  if (Math.random() < 0.05) b.delay = Math.floor(Math.random()*15)+1
  else delete b.delay
}

io.on('connection', socket => {
  console.log('client connected', socket.id)

  socket.on('subscribeAll', () => {
    console.log('subscribeAll from', socket.id)
  })

  socket.on('subscribeBus', busId => {
    console.log('subscribeBus', busId)
  })

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id)
  })
})

// periodically move and emit locations
setInterval(() => {
  buses.forEach(b => {
    moveBus(b)
    io.emit('busLocation', { id: b.id, lat: b.lat, lng: b.lng, speed: b.speed, students: b.students, plate: b.plate, delay: b.delay })
  })
}, 2000)

const PORT = 3000
httpServer.listen(PORT, () => console.log('Mock socket server running on', PORT))

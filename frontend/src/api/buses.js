// Mock API helpers for buses
let buses = [
  { id: 'bus-1', plate: '29A-0001', capacity: 30, driverId: 'driver-1' },
  { id: 'bus-2', plate: '29A-0002', capacity: 25, driverId: 'driver-2' },
]

export async function listBuses() {
  return buses
}
export async function getBus(id) {
  return buses.find(b => b.id === id)
}
export async function createBus(payload) {
  const newBus = { id: 'bus-' + (buses.length + 1), ...payload }
  buses.push(newBus)
  return newBus
}
export async function updateBus(id, payload) {
  buses = buses.map(b => (b.id === id ? { ...b, ...payload } : b))
  return getBus(id)
}
export async function deleteBus(id) {
  buses = buses.filter(b => b.id !== id)
  return true
}

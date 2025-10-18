let drivers = [
  { id: 'driver-1', name: 'Nguyen Van A', phone: '0123456789' },
  { id: 'driver-2', name: 'Tran Thi B', phone: '0987654321' },
]
export async function listDrivers() { return drivers }
export async function getDriver(id) { return drivers.find(d => d.id === id) }
export async function createDriver(payload) { const newD = { id: 'driver-' + (drivers.length + 1), ...payload }; drivers.push(newD); return newD }
export async function updateDriver(id, payload) { drivers = drivers.map(d => (d.id === id ? { ...d, ...payload } : d)); return getDriver(id) }
export async function deleteDriver(id) { drivers = drivers.filter(d => d.id !== id); return true }

let routes = [
  { id: 'route-1', name: 'Route 1', stops: [{ id: 's1', name: 'Stop 1', lat: 10.77, lng: 106.69 }] },
]
export async function listRoutes() { return routes }
export async function getRoute(id) { return routes.find(r => r.id === id) }
export async function createRoute(payload) { const newR = { id: 'route-' + (routes.length + 1), ...payload }; routes.push(newR); return newR }
export async function updateRoute(id, payload) { routes = routes.map(r => (r.id === id ? { ...r, ...payload } : r)); return getRoute(id) }
export async function deleteRoute(id) { routes = routes.filter(r => r.id !== id); return true }

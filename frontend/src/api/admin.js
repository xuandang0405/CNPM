const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:25565'

async function handleResponse(res){
  let data = null
  try{ data = await res.json() }catch(e){ data = null }
  if (!res.ok) {
    const error = data && data.error ? { error: data.error, status: res.status } : { error: 'network_error', status: res.status }
    throw error
  }
  return data
}

function authHeader(){
  try{ const t = localStorage.getItem('token'); return t ? { Authorization: 'Bearer '+t } : {} }catch(e){ return {} }
}

export async function adminListUsers(){
  const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { ...authHeader(), 'Content-Type': 'application/json' } })
  return await handleResponse(res)
}

export async function adminDeleteUser(id){
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE', headers: { ...authHeader(), 'Content-Type': 'application/json' } })
  return await handleResponse(res)
}

export async function adminListBuses(){
  const res = await fetch(`${API_BASE}/api/admin/buses`, { headers: { ...authHeader(), 'Content-Type': 'application/json' } })
  return await handleResponse(res)
}

export async function adminCreateBus({ license_plate, capacity }){
  const res = await fetch(`${API_BASE}/api/admin/buses`, { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ license_plate, capacity }) })
  return await handleResponse(res)
}

export async function adminDeleteBus(id){
  const res = await fetch(`${API_BASE}/api/admin/buses/${id}`, { method: 'DELETE', headers: { ...authHeader(), 'Content-Type': 'application/json' } })
  return await handleResponse(res)
}

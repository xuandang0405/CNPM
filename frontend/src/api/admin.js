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

// Internal: fetch with retry and timeout to improve reliability
async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 10000){
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++){
    const controller = new AbortController()
    const id = setTimeout(()=>controller.abort(), timeoutMs)
    try{
      const res = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' })
      clearTimeout(id)
      return await handleResponse(res)
    }catch(e){
      clearTimeout(id)
      lastErr = e
      // Only retry on network/timeout
      const retriable = (e?.name === 'AbortError') || (e?.error === 'network_error') || (e instanceof TypeError)
      if (!retriable) break
      // small backoff
      await new Promise(r=>setTimeout(r, 300 * (attempt+1)))
    }
  }
  throw lastErr || new Error('request_failed')
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

// Password reset requests (admin)
export async function adminListPasswordResetRequests(status = 'pending') {
  const ts = Date.now()
  if (status === 'all'){
    const [p, a, r] = await Promise.all([
      fetchWithRetry(`${API_BASE}/api/auth/password-reset-requests?status=pending&_=${ts}`, { headers: { ...authHeader(), 'Content-Type': 'application/json' } }),
      fetchWithRetry(`${API_BASE}/api/auth/password-reset-requests?status=approved&_=${ts}`, { headers: { ...authHeader(), 'Content-Type': 'application/json' } }),
      fetchWithRetry(`${API_BASE}/api/auth/password-reset-requests?status=rejected&_=${ts}`, { headers: { ...authHeader(), 'Content-Type': 'application/json' } }),
    ])
    const all = [
      ...(Array.isArray(p?.requests) ? p.requests : []),
      ...(Array.isArray(a?.requests) ? a.requests : []),
      ...(Array.isArray(r?.requests) ? r.requests : []),
    ].sort((x,y)=> new Date(y.requested_at||0) - new Date(x.requested_at||0))
    return { count: all.length, requests: all }
  }
  return await fetchWithRetry(`${API_BASE}/api/auth/password-reset-requests?status=${encodeURIComponent(status)}&_=${ts}`, {
    headers: { ...authHeader(), 'Content-Type': 'application/json' }
  })
}

// Admin create user (parent/driver/admin)
export async function adminCreateUser({ email, full_name, phone, role }){
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, full_name, phone, role })
  })
  return await handleResponse(res)
}

export async function adminApprovePasswordReset(request_id) {
  const res = await fetch(`${API_BASE}/api/auth/approve-password-reset`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id })
  })
  return await handleResponse(res)
}

export async function adminRejectPasswordReset({ request_id, notes }) {
  const res = await fetch(`${API_BASE}/api/auth/reject-password-reset`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id, notes })
  })
  return await handleResponse(res)
}

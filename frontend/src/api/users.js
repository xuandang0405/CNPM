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

export async function createUser({ name, phone, email, password, role }){
	try{
		const res = await fetch(`${API_BASE}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, full_name: name, phone, role })
		})
		return await handleResponse(res)
	}catch(e){
		if (e && e.error) throw e
		throw { error: 'network_error' }
	}
}

export async function createTestUser(){
	try{
		const res = await fetch(`${API_BASE}/api/auth/debug/create-test-user`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }
		})
		return await handleResponse(res)
	}catch(e){ if (e && e.error) throw e; throw { error: 'network_error' } }
}

export async function createAdminUser(){
	try{
		const res = await fetch(`${API_BASE}/api/auth/debug/create-admin-user`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
		return await handleResponse(res)
	}catch(e){ if (e && e.error) throw e; throw { error: 'network_error' } }
}

export async function loginUser({ email, password }){
	try{
		const res = await fetch(`${API_BASE}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		})
		return await handleResponse(res)
	}catch(e){
		if (e && e.error) throw e
		throw { error: 'network_error' }
	}
}

export async function listUsers(){
	return []
}

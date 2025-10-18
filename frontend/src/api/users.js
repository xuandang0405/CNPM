let users = []
export async function createUser(payload){ const id = 'user-' + (users.length+1); users.push({ id, ...payload }); return { id, ...payload } }
export async function listUsers(){ return users }

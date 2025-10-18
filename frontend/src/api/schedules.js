let schedules = []
export async function listSchedules() { return schedules }
export async function createSchedule(payload) { const newS = { id: 'sched-' + (schedules.length + 1), ...payload }; schedules.push(newS); return newS }
export async function updateSchedule(id, payload) { schedules = schedules.map(s => (s.id === id ? { ...s, ...payload } : s)); return schedules.find(s => s.id === id) }
export async function deleteSchedule(id) { schedules = schedules.filter(s => s.id !== id); return true }

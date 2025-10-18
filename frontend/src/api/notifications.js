let notifications = []
export async function listNotifications() { return notifications }
export async function sendNotification(payload) { const n = { id: 'n-' + (notifications.length + 1), ...payload, date: new Date().toISOString() }; notifications.unshift(n); return n }

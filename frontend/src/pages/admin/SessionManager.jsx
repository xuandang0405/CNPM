import React from 'react'
import useUserStore from '../../store/useUserStore'

export default function SessionManager(){
  const { user, clearUser } = useUserStore()
  return (
    <div>
      <h2 className="text-xl mb-4">Session</h2>
      {user ? (
        <div className="p-4 bg-white rounded shadow">
          <div><strong>User:</strong> {user.username}</div>
          <div><strong>Role:</strong> {user.role}</div>
          <button className="mt-3 bg-red-600 text-white px-3 py-1 rounded" onClick={clearUser}>Logout</button>
        </div>
      ) : (
        <div>No active session</div>
      )}
    </div>
  )
}

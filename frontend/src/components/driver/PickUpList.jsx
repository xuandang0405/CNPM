import React from 'react'
import StudentCard from './StudentCard'

export default function PickUpList({ students = [], onPicked, onDropped }){
  return (
    <div className="space-y-2">
      {students.map(s => (
        <StudentCard key={s.id} student={s} onPicked={onPicked} onDropped={onDropped} />
      ))}
    </div>
  )
}

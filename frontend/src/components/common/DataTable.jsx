import React from 'react'
import Button from './Button'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function DataTable({ columns = [], data = [], onEdit, onDelete }) {
  const { lang } = useUserStore()
  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className="p-3 border-b text-left text-sm text-gray-600">{c.title}</th>
            ))}
            <th className="p-3 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {columns.map(c => (
                <td key={c.key} className="p-3 border-b text-sm">{c.render ? c.render(row) : row[c.key]}</td>
              ))}
              <td className="p-3 border-b">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => onEdit && onEdit(row)}>Sửa</Button>
                  <Button variant="danger" onClick={() => onDelete && onDelete(row)}>Xóa</Button>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="p-4 text-center text-gray-500">{t(lang,'no_data')}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

import React, { useState } from 'react'
import axiosInstance from '../../api/axios'
import { Send, Bell, Users, AlertCircle, Info, CheckCircle, MessageSquare } from 'lucide-react'

export default function DriverNotifications() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('info')
  const [priority, setPriority] = useState('medium')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung')
      return
    }
    try {
      setSending(true)
      setError('')
      setSuccess('')
      
      // Driver sends to parents of students on current trip
      const response = await axiosInstance.post('/notifications/send', { 
        title,
        body,
        type,
        priority
      })
      
      setTitle('')
      setBody('')
      setSuccess(`Đã gửi thông báo đến ${response.data.count} phụ huynh trên chuyến đi hôm nay`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Failed to send notification:', err)
      const errorMsg = err.response?.data?.error
      if (errorMsg === 'no_recipients_found') {
        setError('Không tìm thấy phụ huynh nào trên chuyến đi hôm nay')
      } else {
        setError('Lỗi gửi thông báo')
      }
    } finally {
      setSending(false)
    }
  }

  const typeOptions = [
    { value: 'info', label: 'Thông tin', icon: Info, color: 'blue' },
    { value: 'alert', label: 'Cảnh báo', icon: AlertCircle, color: 'red' },
    { value: 'success', label: 'Thành công', icon: CheckCircle, color: 'green' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Thấp', color: 'gray' },
    { value: 'medium', label: 'Trung bình', color: 'yellow' },
    { value: 'high', label: 'Cao', color: 'red' },
  ]

  const quickMessages = [
    { title: 'Xuất phát đúng giờ', body: 'Xe buýt đã xuất phát đúng lịch trình. Phụ huynh vui lòng đưa con ra điểm đón.', type: 'info' },
    { title: 'Trễ 10 phút', body: 'Xe buýt sẽ đến trễ khoảng 10 phút do tình trạng giao thông. Xin lỗi vì sự bất tiện này.', type: 'alert' },
    { title: 'Đã đón tất cả học sinh', body: 'Tất cả học sinh đã lên xe an toàn. Xe đang trên đường đến trường.', type: 'success' },
    { title: 'Thay đổi tuyến đường', body: 'Do tình trạng giao thông, xe sẽ đi tuyến đường khác. Thời gian đến có thể thay đổi.', type: 'alert' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quick Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Tin nhắn nhanh</h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Chọn tin nhắn mẫu để gửi nhanh cho phụ huynh
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickMessages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTitle(msg.title)
                  setBody(msg.body)
                  setType(msg.type)
                }}
                className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{msg.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{msg.body}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Send Custom Notification */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Gửi Thông Báo Cho Phụ Huynh</h2>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">{success}</span>
            </div>
          )}

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium mb-1">Gửi đến phụ huynh trên chuyến đi hôm nay</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                Thông báo sẽ được gửi đến tất cả phụ huynh có con đang chờ hoặc đang trên xe của bạn hôm nay.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }} className="space-y-4">
            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại thông báo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ví dụ: Xe sẽ đến muộn 10 phút"
                disabled={sending}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nội dung
              </label>
              <textarea 
                value={body} 
                onChange={e=>setBody(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                placeholder="Nhập nội dung chi tiết thông báo" 
                disabled={sending}
                rows="4"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 font-medium flex items-center justify-center gap-2 transition-all" 
              disabled={sending || !title.trim() || !body.trim()}
            >
              <Send className="w-5 h-5" />
              {sending ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

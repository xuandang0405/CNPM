import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Bus,
  Route,
  Phone,
  MessageSquare,
  Navigation,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AlertBanner } from '../../components/common/AlertBanner';
import { Modal } from '../../components/common/Modal';
import { 
  getScheduleStudents, 
  updateTripStatus, 
  sendEmergencyAlert,
  getDriverSchedule
} from '../../api/trips';

export default function DriverTrip() {
  const { id } = useParams(); // schedule_id
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [message, setMessage] = useState('');

  // Load schedules list if no ID provided
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoading(true);
        const response = await getDriverSchedule();
        if (response.success && response.schedules) {
          setSchedules(response.schedules);
          
          // Auto redirect to first active schedule
          const activeSchedule = response.schedules.find(s => s.status === 'in-progress');
          if (activeSchedule) {
            navigate(`/driver/trip/${activeSchedule.schedule_id}`, { replace: true });
            return;
          }
          
          // Otherwise redirect to first schedule
          if (response.schedules.length > 0) {
            navigate(`/driver/trip/${response.schedules[0].schedule_id}`, { replace: true });
            return;
          }
          
          setAlert({ 
            type: 'info', 
            message: 'Chưa có lịch trình nào được phân công.' 
          });
        }
      } catch (error) {
        console.error('Error loading schedules:', error);
        setAlert({ 
          type: 'error', 
          message: 'Không thể tải danh sách lịch trình' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      loadSchedules();
    }
  }, [id, navigate]);

  // Load real data from database
  useEffect(() => {
    const loadTripData = async () => {
      try {
        setLoading(true);
        console.log('Loading trip data for schedule:', id);
        const response = await getScheduleStudents(id);
        console.log('Trip data response:', response);
        
        if (response.success) {
          setStudents(response.students || []);
          
          if (response.students && response.students.length === 0) {
            setAlert({ 
              type: 'warning', 
              message: 'Chuyến đi này chưa có học sinh nào được phân công.' 
            });
          }
          
          // Create trip summary from students data
          const tripData = {
            schedule_id: response.schedule_id,
            total_students: response.total_count || 0,
            completed: response.students?.filter(s => s.trip_status === 'dropped').length || 0,
            onboard: response.students?.filter(s => s.trip_status === 'onboard').length || 0,
            remaining: response.students?.filter(s => s.trip_status === 'waiting').length || 0,
            absent: response.students?.filter(s => s.trip_status === 'absent').length || 0
          };
          setTrip(tripData);
        } else {
          setAlert({ 
            type: 'error', 
            message: response.message || 'Không thể tải dữ liệu chuyến đi' 
          });
        }
      } catch (error) {
        console.error('Error loading trip data:', error);
        setAlert({ 
          type: 'error', 
          message: error.response?.data?.message || 'Không thể tải dữ liệu chuyến đi! Vui lòng thử lại.' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTripData();
    }
  }, [id]);

  // Update student trip status with real API
  const updateStudentStatus = async (tripId, newStatus, notes = null) => {
    try {
      const response = await updateTripStatus(tripId, newStatus, notes);
      
      if (response.success) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student.trip_id === tripId 
            ? { 
                ...student, 
                trip_status: newStatus,
                [newStatus === 'onboard' ? 'picked_at' : newStatus === 'dropped' ? 'dropped_at' : 'updated_at']: new Date().toISOString(),
                notes: notes || student.notes
              }
            : student
        ));
        
        // Update trip summary
        const updatedStudents = students.map(student => 
          student.trip_id === tripId ? { ...student, trip_status: newStatus } : student
        );
        
        setTrip(prev => ({
          ...prev,
          completed: updatedStudents.filter(s => s.trip_status === 'dropped').length,
          onboard: updatedStudents.filter(s => s.trip_status === 'onboard').length,
          remaining: updatedStudents.filter(s => s.trip_status === 'waiting').length,
          absent: updatedStudents.filter(s => s.trip_status === 'absent').length
        }));
        
        setAlert({ 
          type: 'success', 
          message: response.message || `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"` 
        });
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái!' 
      });
    }
  };

  // Call parent
  const callParent = (phoneNumber) => {
    if (confirm(`Gọi cho phụ huynh: ${phoneNumber}?`)) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  // Send emergency alert with real API
  const handleEmergencyAlert = async () => {
    const alertMessage = prompt('Nhập tin nhắn cảnh báo khẩn cấp:');
    if (!alertMessage) return;
    
    try {
      const response = await sendEmergencyAlert('emergency', alertMessage);
      
      if (response.success) {
        setAlert({ 
          type: 'success', 
          message: response.message || 'Cảnh báo khẩn cấp đã được gửi!' 
        });
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Không thể gửi cảnh báo khẩn cấp!' 
      });
    }
  };

  // Get status text helper
  // Send message to parent (placeholder - would need SMS/notification API)
  const sendMessageToParent = async () => {
    if (!message.trim() || !selectedStudent) return;
    
    try {
      // For now just show success - would need SMS API integration
      setAlert({ 
        type: 'success', 
        message: `Đã gửi tin nhắn đến phụ huynh của ${selectedStudent.student?.name || selectedStudent.student_name}` 
      });
      setShowQuickMessage(false);
      setMessage('');
      setSelectedStudent(null);
    } catch (error) {
      setAlert({ type: 'error', message: 'Có lỗi xảy ra khi gửi tin nhắn!' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'onboard': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'dropped': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'absent': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'onboard': return <Bus className="w-4 h-4" />;
      case 'dropped': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Chờ đón';
      case 'onboard': return 'Trên xe';
      case 'dropped': return 'Đã trả';
      case 'absent': return 'Vắng mặt';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {trip?.route_name}
                </h1>
                <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {trip?.start_time} - {trip?.end_time}
                  </div>
                  <div className="flex items-center">
                    <Bus className="w-4 h-4 mr-1" />
                    {trip?.license_plate}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                trip?.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {trip?.status === 'active' ? 'Đang hoạt động' : 'Đã lên lịch'}
              </div>
              
              <Button
                onClick={handleEmergencyAlert}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Báo khẩn cấp
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-6"
          />
        )}

        {/* Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Tổng học sinh
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {trip?.total_students}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Đã hoàn thành
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.trip_status === 'dropped').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Còn lại
                </h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => ['waiting', 'onboard'].includes(s.trip_status)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Route className="w-5 h-5 mr-2 text-blue-600" />
              Danh sách học sinh theo lộ trình
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {students
                .sort((a, b) => a.stop_order - b.stop_order)
                .map((student, index) => (
                <div key={student.trip_id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mr-3">
                        {student.stop_order}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {student.student_name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
                          <span>{student.grade}</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {student.stop_name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.trip_status)}`}>
                      {getStatusIcon(student.trip_status)}
                      <span className="ml-1">{getStatusText(student.trip_status)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Dự kiến: {student.pickup_time}
                      </div>
                      {student.actual_time && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          Thực tế: {student.actual_time}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => callParent(student.parent_phone)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Gọi
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowQuickMessage(true);
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Nhắn
                      </Button>

                      {student.trip_status === 'waiting' && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={() => updateStudentStatus(student.trip_id, 'onboard')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Đón lên
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStudentStatus(student.trip_id, 'absent')}
                          >
                            Vắng mặt
                          </Button>
                        </div>
                      )}

                      {student.trip_status === 'onboard' && (
                        <Button
                          size="sm"
                          onClick={() => updateStudentStatus(student.trip_id, 'dropped')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Trả học sinh
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Message Modal */}
      <Modal
        isOpen={showQuickMessage}
        onClose={() => {
          setShowQuickMessage(false);
          setSelectedStudent(null);
          setMessage('');
        }}
        title="Gửi tin nhắn nhanh"
      >
        <div className="p-6">
          {selectedStudent && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedStudent.student_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phụ huynh: {selectedStudent.parent_phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tin nhắn
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn cho phụ huynh..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={sendMessageToParent}
              disabled={!message.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Gửi tin nhắn
            </Button>
            <Button
              onClick={() => {
                setShowQuickMessage(false);
                setSelectedStudent(null);
                setMessage('');
              }}
              variant="outline"
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

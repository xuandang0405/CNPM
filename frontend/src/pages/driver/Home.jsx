import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Bus, Users, MapPin, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { AlertBanner } from '../../components/common/AlertBanner';
import { Button } from '../../components/common/Button';
import { StatsCard } from '../../components/common/StatsCard';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/Skeleton';
import { useUserStore } from '../../store/useUserStore';
import { t } from '../../i18n';
import { 
  getDriverSchedule, 
  getScheduleStudents, 
  updateTripStatus, 
  updateDriverLocation,
  startTrip,
  completeTrip
} from '../../api/trips';

export default function DriverHome() {
  const navigate = useNavigate();
  const { lang } = useUserStore();
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching driver schedule...');
        const scheduleData = await getDriverSchedule();
        console.log('Schedule data received:', scheduleData);
        
        if (scheduleData.success === false) {
          // Show warning if driver profile not found or not active
          setAlert({ 
            type: 'warning', 
            message: t(lang, 'no_schedules_assigned_short') 
          });
          setSchedules([]);
        } else if (scheduleData.success && scheduleData.schedules) {
          setSchedules(scheduleData.schedules);
          
          if (scheduleData.schedules.length === 0) {
            setAlert({ 
              type: 'info', 
              message: t(lang, 'no_schedules_contact_admin') 
            });
          } else {
            // If there's an active schedule, fetch its students
            const activeSchedule = scheduleData.schedules.find(s => s.status === 'active');
            if (activeSchedule) {
              setSelectedSchedule(activeSchedule);
              console.log('Loading students for active schedule:', activeSchedule.schedule_id);
              const studentsData = await getScheduleStudents(activeSchedule.schedule_id);
              console.log('Students data received:', studentsData);
              if (studentsData.success && studentsData.students) {
                setStudents(studentsData.students);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlert({ 
          type: 'error', 
          message: error.response?.data?.message || t(lang, 'data_load_failed_generic') 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStudentStatusUpdate = async (tripId, newStatus) => {
    try {
      const response = await updateTripStatus(tripId, newStatus);
      
      if (response.success) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student.trip_id === tripId 
            ? { ...student, trip_status: newStatus }
            : student
        ));
        
        setAlert({ 
          type: 'success', 
          message: response.message || t(lang, 'update_status_success') 
        });
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || t(lang, 'update_status_failed') 
      });
    }
  };

  

  const updateLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await updateDriverLocation(
              position.coords.latitude, 
              position.coords.longitude,
              position.coords.accuracy
            );
            setAlert({ type: 'success', message: t(lang, 'location_updated') });
          } catch (error) {
            setAlert({ type: 'error', message: t(lang, 'location_update_failed') });
          }
        },
        (error) => {
          setAlert({ type: 'error', message: t(lang, 'cannot_get_current_location') });
        }
      );
    }
  };

  const handleScheduleSelect = async (schedule) => {
    setSelectedSchedule(schedule);
    try {
      const studentsData = await getScheduleStudents(schedule.schedule_id);
      if (studentsData.success && studentsData.students) {
        setStudents(studentsData.students);
      }
    } catch (error) {
  setAlert({ type: 'error', message: t(lang, 'load_students_failed') });
    }
  };

  const handleStartTrip = async (scheduleId) => {
    try {
      const response = await startTrip(scheduleId);
      if (response.success) {
  setAlert({ type: 'success', message: t(lang, 'start_trip_success') });
        // Refresh schedules
        const scheduleData = await getDriverSchedule();
        if (scheduleData.success && scheduleData.schedules) {
          setSchedules(scheduleData.schedules);
          const updatedSchedule = scheduleData.schedules.find(s => s.schedule_id === scheduleId);
          if (updatedSchedule) {
            setSelectedSchedule(updatedSchedule);
            // Fetch students for this schedule
            try {
              const studentsData = await getScheduleStudents(scheduleId);
              if (studentsData.success && studentsData.students) {
                setStudents(studentsData.students);
                // Navigate to map page to show route and students
                setTimeout(() => {
                  navigate('/driver/map', { 
                    state: { 
                      schedule: updatedSchedule,
                      students: studentsData.students 
                    } 
                  });
                }, 500);
              }
            } catch (err) {
              console.error('Error fetching students:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error starting trip:', error);
  setAlert({ type: 'error', message: error.response?.data?.message || t(lang, 'start_trip_failed') });
    }
  };

  const handleCompleteTrip = async (scheduleId) => {
    try {
      const response = await completeTrip(scheduleId);
      if (response.success) {
  setAlert({ type: 'success', message: t(lang, 'complete_trip_success') });
        // Refresh schedules
        const scheduleData = await getDriverSchedule();
        if (scheduleData.success && scheduleData.schedules) {
          setSchedules(scheduleData.schedules);
          setSelectedSchedule(null);
          setStudents([]);
        }
      }
    } catch (error) {
      console.error('Error completing trip:', error);
  setAlert({ type: 'error', message: error.response?.data?.message || t(lang, 'complete_trip_failed') });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-50';
      case 'onboard': return 'text-blue-600 bg-blue-50';
      case 'dropped': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Bus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse">
                    <div className="w-8 h-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Schedule List Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="h-6 w-40 bg-white/30 rounded animate-pulse"></div>
                </div>
                <div className="p-6 space-y-4">
                  {[1,2].map(i => (
                    <div key={i} className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/30">
                      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-3"></div>
                      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                      <div className="grid grid-cols-3 gap-4">
                        {[1,2,3].map(j => (
                          <div key={j} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                            <div className="h-6 w-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mx-auto mb-1"></div>
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mx-auto"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Students & Emergency Skeleton */}
            <div className="space-y-6">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-600">
                  <div className="h-6 w-36 bg-white/30 rounded animate-pulse"></div>
                </div>
                <div className="p-6">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-pink-600">
                  <div className="h-6 w-40 bg-white/30 rounded animate-pulse"></div>
                </div>
                <div className="p-6">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Bus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t(lang,'driver_dashboard')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <Button 
              onClick={updateLocation}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Navigation className="w-5 h-5 mr-2 animate-pulse" />
              {t(lang,'update_location')}
            </Button>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t(lang,'today_schedules')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {schedules.length}
                </h3>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t(lang,'waiting_students')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {schedules.reduce((sum, s) => sum + s.pending_pickups, 0)}
                </h3>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t(lang,'on_bus')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {schedules.reduce((sum, s) => sum + s.onboard_students, 0)}
                </h3>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                <Bus className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t(lang,'completed')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {schedules.reduce((sum, s) => sum + s.completed_drops, 0)}
                </h3>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schedule List */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Bus className="w-6 h-6 mr-3" />
                  {t(lang,'today_schedules')}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div 
                      key={schedule.schedule_id}
                      className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedSchedule?.schedule_id === schedule.schedule_id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white/50 dark:bg-gray-700/30'
                      }`}
                      onClick={() => handleScheduleSelect(schedule)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${
                            schedule.status === 'active' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : schedule.status === 'completed'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          }`}>
                            {schedule.status === 'active' ? `🚀 ${t(lang,'in_progress')}` : schedule.status === 'completed' ? `✅ ${t(lang,'completed')}` : `📅 ${t(lang,'scheduled')}`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {schedule.start_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                        {schedule.route_name}
                      </h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            🚌 {schedule.license_plate}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {schedule.pending_pickups}
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{t(lang,'waiting_pickup')}</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {schedule.onboard_students}
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{t(lang,'on_bus')}</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {schedule.completed_drops}
                          </div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{t(lang,'completed')}</div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                        {schedule.status === 'scheduled' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTrip(schedule.schedule_id);
                            }}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            <Navigation className="w-5 h-5 mr-2" />
                            {t(lang,'start_trip')}
                          </Button>
                        )}
                        {schedule.status === 'active' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTrip(schedule.schedule_id);
                            }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {t(lang,'complete_trip')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Students List & Emergency Alert */}
          <div className="space-y-6">
            {/* Students List */}
            {selectedSchedule && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-600">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <Users className="w-6 h-6 mr-3" />
                    {t(lang,'student_list')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.trip_id} className="group p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 bg-white/50 dark:bg-gray-700/30 hover:shadow-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                              {student.student_name}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md font-medium">
                                {student.grade}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {student.stop_name}
                              </span>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${
                            student.trip_status === 'waiting' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                            student.trip_status === 'onboard' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                            student.trip_status === 'dropped' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                            'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                          }`}>
                            {getStatusIcon(student.trip_status)}
                            <span className="ml-1.5">
                              {student.trip_status === 'waiting' && t(lang,'waiting_pickup')}
                              {student.trip_status === 'onboard' && t(lang,'on_bus')}
                              {student.trip_status === 'dropped' && t(lang,'dropped_off')}
                              {student.trip_status === 'absent' && t(lang,'absent')}
                            </span>
                          </div>
                        </div>
                        
                        {student.trip_status === 'waiting' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleStudentStatusUpdate(student.trip_id, 'onboard')}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transform hover:scale-105 transition-all"
                            >
                              <Bus className="w-4 h-4 mr-1" />
                              {t(lang,'pick_up')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStudentStatusUpdate(student.trip_id, 'absent')}
                              className="border-2 hover:bg-gray-100 dark:hover:bg-gray-700 transform hover:scale-105 transition-all"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {t(lang,'absent')}
                            </Button>
                          </div>
                        )}
                        
                        {student.trip_status === 'onboard' && (
                          <Button
                            size="sm"
                            onClick={() => handleStudentStatusUpdate(student.trip_id, 'dropped')}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 mt-3 shadow-md transform hover:scale-105 transition-all"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {t(lang,'drop_off')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            
          </div>
        </div>
      </div>
      
    </div>
  );
}

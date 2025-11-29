import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Calendar, Plus, Trash2, Bus, User, MapPin, Clock, Save, X } from 'lucide-react';
import { t } from '../../i18n'
import { useUserStore } from '../../store/useUserStore'

export default function AdminSchedule() {
  const { lang } = useUserStore()
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    route_id: '',
    bus_id: '',
    scheduled_date: '',
    start_time: '',
    recurrence: 'once',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh current schedules list to reflect driver start/complete in near real-time
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadData();
    }, 15000); // 15s
    return () => clearInterval(id);
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, routesRes, busesRes] = await Promise.all([
        axiosInstance.get('/admin/schedules'),
        axiosInstance.get('/admin/routes'),
        axiosInstance.get('/admin/buses')
      ]);

      setSchedules(schedulesRes.data.schedules || []);
      setRoutes(routesRes.data.routes || []);
      setBuses(busesRes.data.buses || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate if bus has driver assigned
    if (formData.bus_id) {
      const selectedBus = buses.find(b => b.id === formData.bus_id);
      if (selectedBus && !selectedBus.driver_id) {
        const confirmWithoutDriver = window.confirm(
          `⚠️ ${t(lang,'warning')}: ${t(lang,'bus')} "${selectedBus.plate}" ${t(lang,'no_driver')}!\n\n` +
          `${t(lang,'proceed_create_schedule_question')}\n\n` +
          `💡 ${t(lang,'hint_assign_driver_first')}`
        );
        if (!confirmWithoutDriver) {
          return; // Cancel submission
        }
      }
    }
    
    try {
      if (formData.recurrence === 'once') {
        await axiosInstance.post('/admin/schedules', {
          route_id: formData.route_id,
          bus_id: formData.bus_id || null,
          scheduled_date: formData.scheduled_date,
          start_time: formData.start_time
        });
      } else {
        const startDate = new Date(formData.scheduled_date);
        const endDate = new Date(formData.end_date || formData.scheduled_date);
        const dates = [];

        if (formData.recurrence === 'daily') {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d).toISOString().split('T')[0]);
          }
        } else if (formData.recurrence === 'weekly') {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
            dates.push(new Date(d).toISOString().split('T')[0]);
          }
        } else if (formData.recurrence === 'monthly') {
          for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
            dates.push(new Date(d).toISOString().split('T')[0]);
          }
        }

        await Promise.all(dates.map(date =>
          axiosInstance.post('/admin/schedules', {
            route_id: formData.route_id,
            bus_id: formData.bus_id || null,
            scheduled_date: date,
            start_time: formData.start_time
          })
        ));
      }

      setShowModal(false);
      setFormData({ route_id: '', bus_id: '', scheduled_date: '', start_time: '', recurrence: 'once', end_date: '' });
      loadData();
      alert(`✅ ${formData.recurrence === 'once' ? t(lang,'schedule_created_success') : t(lang,'recurring_schedule_created_success')}`);
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('❌ ' + t(lang,'error') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t(lang,'confirm_delete_schedule'))) return;
    try {
      await axiosInstance.delete(`/admin/schedules/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert(t(lang,'error_deleting_schedule'));
    }
  };

  const assignBus = async (scheduleId, busId) => {
    try {
      await axiosInstance.put(`/admin/schedules/${scheduleId}`, { bus_id: busId });
      loadData();
    } catch (error) {
      console.error('Error assigning bus:', error);
      alert(t(lang,'error_assigning_bus'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return t(lang,'completed');
      case 'in-progress': return t(lang,'in_progress');
      case 'active': return t(lang,'in_progress');
      case 'cancelled': return t(lang,'cancelled');
      case 'scheduled': return t(lang,'scheduled');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-3">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t(lang,'schedule_page_title')}</h1>
              <p className="text-blue-100 mt-1">{t(lang,'schedule_subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="hidden md:inline-flex items-center gap-2 text-sm text-white/90">
              <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />
              {t(lang,'auto_refresh_15s_label')}
            </label>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t(lang,'add_schedule')}
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'date')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'time')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'routes')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'buses')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'driver_label')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'status')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">{t(lang,'actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t(lang,'no_schedules_yet')}</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t(lang,'add_schedule')}
                    </button>
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(schedule.scheduled_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-200">{schedule.start_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700 dark:text-gray-200">{schedule.route_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {schedule.bus_plate ? (
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700 dark:text-gray-200">{schedule.bus_plate}</span>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => assignBus(schedule.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t(lang,'assign_bus')}</option>
                          {buses.filter(b => b.active).map(bus => (
                            <option key={bus.id} value={bus.id}>{bus.plate}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {schedule.bus_plate && buses.find(b => b.id === schedule.bus_id)?.driver_name ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700 dark:text-gray-200">
                            {buses.find(b => b.id === schedule.bus_id)?.driver_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">{t(lang,'not_assigned')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                        {getStatusText(schedule.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-xl text-white sticky top-0">
              <h2 className="text-xl font-bold">{t(lang,'create_new_schedule_title')}</h2>
              <p className="text-sm text-blue-100 mt-1">{t(lang,'schedule_create_subtitle')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Recurrence Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t(lang,'schedule_type')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'once', label: t(lang,'once_label'), desc: t(lang,'once_desc') },
                    { value: 'daily', label: t(lang,'daily_label'), desc: t(lang,'daily_desc') },
                    { value: 'weekly', label: t(lang,'weekly_label'), desc: t(lang,'weekly_desc') },
                    { value: 'monthly', label: t(lang,'monthly_label'), desc: t(lang,'monthly_desc') }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, recurrence: option.value })}
                      className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                        formData.recurrence === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Route Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(lang,'route_name')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.route_id}
                  onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t(lang,'choose_route')}</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>

              {/* Bus Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(lang,'bus_assign_later')}
                </label>
                <select
                  value={formData.bus_id}
                  onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t(lang,'choose_bus_optional')}</option>
                  {buses.filter(b => b.active).map(bus => (
                    <option key={bus.id} value={bus.id}>
                      🚌 {bus.plate} {bus.driver_name ? `- ${bus.driver_name}` : `(${t(lang,'no_driver')})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.recurrence === 'once' ? t(lang,'date') : t(lang,'from_date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.recurrence !== 'once' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(lang,'to_date')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.scheduled_date}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(lang,'departure_time')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t(lang,'cancel_button')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t(lang,'add_schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

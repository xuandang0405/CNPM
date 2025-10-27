import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Users, Plus, Pencil, Trash2, Search, UserPlus } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useUserStore } from '../../store/useUserStore';
import { t } from '../../i18n';

export default function Students() {
  const { lang } = useUserStore();
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    grade: '',
    class: '',
    parent_user_id: '',
    assigned_route_id: '',
    assigned_stop_id: '',
    assigned_bus_id: '',
    address: ''
  });

  useEffect(() => {
    loadStudents();
    loadParents();
    loadRoutes();
    loadBuses();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/students');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParents = async () => {
    try {
      const response = await axiosInstance.get('/admin/users?role=parent');
      setParents(response.data.users || []);
    } catch (error) {
      console.error('Error loading parents:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await axiosInstance.get('/admin/routes');
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadBuses = async () => {
    try {
      const response = await axiosInstance.get('/admin/buses');
      setBuses(response.data.buses || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  const loadStopsForRoute = async (routeId) => {
    if (!routeId) {
      setStops([]);
      return;
    }
    try {
      const route = routes.find(r => r.id === routeId);
      setStops(route?.stops || []);
    } catch (error) {
      console.error('Error loading stops:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.parent_user_id) {
        alert('Vui lòng chọn phụ huynh!');
        return;
      }
      await axiosInstance.post('/admin/students', formData);
      setShowAddModal(false);
      setParentSearchTerm('');
      setFormData({ 
        full_name: '', 
        grade: '', 
        class: '', 
        parent_user_id: '', 
        assigned_route_id: '',
        assigned_stop_id: '',
        assigned_bus_id: '',
        address: ''
      });
      loadStudents();
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Lỗi khi tạo học sinh: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setParentSearchTerm('');
    setFormData({
      full_name: student.full_name,
      grade: student.grade,
      class: student.class || '',
      parent_user_id: student.parent_user_id,
      assigned_route_id: student.assigned_route_id || '',
      assigned_stop_id: student.assigned_stop_id || '',
      assigned_bus_id: student.assigned_bus_id || '',
      address: student.address || ''
    });
    if (student.assigned_route_id) {
      loadStopsForRoute(student.assigned_route_id);
    }
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/admin/students/${editingStudent.id}`, formData);
      setShowEditModal(false);
      setEditingStudent(null);
      setParentSearchTerm('');
      setFormData({ 
        full_name: '', 
        grade: '', 
        class: '', 
        parent_user_id: '', 
        assigned_route_id: '', 
        assigned_stop_id: '',
        assigned_bus_id: ''
      });
      loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Lỗi khi cập nhật học sinh: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t(lang,'confirm_delete_student'))) return;
    try {
      await axiosInstance.delete(`/admin/students/${id}`);
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Lỗi khi xóa học sinh');
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter parents based on search term (name, email, phone)
  const filteredParents = parents.filter(parent => {
    if (!parentSearchTerm) return true;
    const searchLower = parentSearchTerm.toLowerCase();
    return (
      parent.full_name?.toLowerCase().includes(searchLower) ||
      parent.email?.toLowerCase().includes(searchLower) ||
      parent.phone?.toLowerCase().includes(searchLower) ||
      parent.phone?.replace(/\s/g, '').includes(searchLower.replace(/\s/g, ''))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6">
          <div className="h-6 bg-purple-400 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-8 bg-purple-400 rounded w-32 animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <TableSkeleton rows={8} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-3">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t(lang,'students_page_title')}</h1>
              <p className="text-purple-100 mt-1">{t(lang,'students_total_label')}: {students.length}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              setParentSearchTerm('');
            }}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t(lang,'add_student_button')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t(lang,'search_students_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t(lang,'student_name')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t(lang,'grade_level')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t(lang,'class_name')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t(lang,'parent_label')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t(lang,'pickup_stop')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t(lang,'actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <UserPlus className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? t(lang,'no_students_found') : t(lang,'no_students_yet')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
                        {t(lang,'grade_level')} {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {student.class || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {student.parent_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {student.stop_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-2 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title={t(lang,'edit_item')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title={t(lang,'delete_item')}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-xl text-white">
              <h2 className="text-xl font-bold">{t(lang,'add_new_student')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'student_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t(lang,'grade_level')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="1, 2, 3..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t(lang,'class_name')}
                  </label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="1A, 2B..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'parent_label')} <span className="text-red-500">*</span>
                </label>
                {/* Search Input */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="🔍 Tìm theo tên, email hoặc số điện thoại..."
                    value={parentSearchTerm}
                    onChange={(e) => setParentSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm dark:bg-gray-900 dark:text-gray-100"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {/* Parent Select */}
                <select
                  required
                  value={formData.parent_user_id}
                  onChange={(e) => setFormData({ ...formData, parent_user_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                  size="5"
                >
                  <option value="">-- {t(lang,'choose_parent')} --</option>
                  {filteredParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.full_name || parent.email} {parent.phone ? `- ${parent.phone}` : ''}
                    </option>
                  ))}
                </select>
                {filteredParents.length === 0 && parentSearchTerm && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{t(lang,'no_matching_parents')}</p>
                )}
                {filteredParents.length > 0 && parentSearchTerm && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'found_parents_count_prefix')} {filteredParents.length} {t(lang,'found_parents_count_suffix')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'routes')}
                </label>
                <select
                  value={formData.assigned_route_id}
                  onChange={(e) => {
                    setFormData({ ...formData, assigned_route_id: e.target.value, assigned_stop_id: '' });
                    loadStopsForRoute(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">-- {t(lang,'choose_route_optional')} --</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.assigned_route_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t(lang,'pickup_stop')}
                  </label>
                  <select
                    value={formData.assigned_stop_id}
                    onChange={(e) => setFormData({ ...formData, assigned_stop_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- {t(lang,'choose_stop')} --</option>
                    {stops.map(stop => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name} {stop.is_pickup ? '(Đón)' : '(Trả)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'buses')} 🚌
                </label>
                <select
                  value={formData.assigned_bus_id}
                  onChange={(e) => setFormData({ ...formData, assigned_bus_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">-- {t(lang,'choose_bus_optional')} --</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      {bus.plate} - {bus.capacity} chỗ {bus.driver_name ? `(Tài xế: ${bus.driver_name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'bus_tracking_hint')}</p>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'home_address')} 🏠
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nhập địa chỉ nhà của học sinh (VD: 123 Lê Lợi, Quận 1, TP.HCM)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                  rows="2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'address')}</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setParentSearchTerm('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t(lang,'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  {t(lang,'create_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl text-white">
              <h2 className="text-xl font-bold">{t(lang,'edit_student')}</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'student_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t(lang,'grade_level')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="1, 2, 3..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t(lang,'class_name')}
                  </label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                    placeholder="1A, 2B..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'parent_label')} <span className="text-red-500">*</span>
                </label>
                {/* Search Input */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="🔍 Tìm theo tên, email hoặc số điện thoại..."
                    value={parentSearchTerm}
                    onChange={(e) => setParentSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-900 dark:text-gray-100"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {/* Parent Select */}
                <select
                  required
                  value={formData.parent_user_id}
                  onChange={(e) => setFormData({ ...formData, parent_user_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  size="5"
                >
                  <option value="">-- {t(lang,'choose_parent')} --</option>
                  {filteredParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.full_name || parent.email} {parent.phone ? `- ${parent.phone}` : ''}
                    </option>
                  ))}
                </select>
                {filteredParents.length === 0 && parentSearchTerm && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{t(lang,'no_matching_parents')}</p>
                )}
                {filteredParents.length > 0 && parentSearchTerm && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'found_parents_count_prefix')} {filteredParents.length} {t(lang,'found_parents_count_suffix')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'routes')}
                </label>
                <select
                  value={formData.assigned_route_id}
                  onChange={(e) => {
                    setFormData({ ...formData, assigned_route_id: e.target.value, assigned_stop_id: '' });
                    loadStopsForRoute(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">-- {t(lang,'choose_route_optional')} --</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.assigned_route_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t(lang,'pickup_stop')}
                  </label>
                  <select
                    value={formData.assigned_stop_id}
                    onChange={(e) => setFormData({ ...formData, assigned_stop_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- {t(lang,'choose_stop')} --</option>
                    {stops.map(stop => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name} {stop.is_pickup ? '(Đón)' : '(Trả)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'buses')} 🚌
                </label>
                <select
                  value={formData.assigned_bus_id}
                  onChange={(e) => setFormData({ ...formData, assigned_bus_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">-- {t(lang,'choose_bus_optional')} --</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>
                      {bus.plate} - {bus.capacity} chỗ {bus.driver_name ? `(Tài xế: ${bus.driver_name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'bus_tracking_hint')}</p>
              </div>

              {/* Address Field - Edit Modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t(lang,'home_address')} 🏠
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nhập địa chỉ nhà của học sinh"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                  rows="2"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                    setParentSearchTerm('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t(lang,'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  {t(lang,'update_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

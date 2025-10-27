import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { t } from '../../i18n';
import { getChildren, getChildBusLocation } from '../../api/parents';
import { Clock, MapPin, Bus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/Skeleton';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, lang } = useUserStore();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading children data...');
      const data = await getChildren();
      console.log('Children data received:', data);
      
      if (!data.children || data.children.length === 0) {
        setChildren([]);
        return;
      }
      
      // Load trip info for each child
      const childrenWithStatus = await Promise.all(
        data.children.map(async (child) => {
          try {
            const busLocation = await getChildBusLocation(child.id);
            console.log(`Bus location for ${child.full_name}:`, busLocation);
            return {
              ...child,
              busStatus: busLocation.has_active_trip ? busLocation : null
            };
          } catch (err) {
            console.error(`Error loading bus location for child ${child.id}:`, err);
            return { ...child, busStatus: null };
          }
        })
      );
      
      setChildren(childrenWithStatus);
    } catch (err) {
      console.error('Error loading dashboard:', err);
  setError(err.response?.data?.message || err.message || t(lang,'error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      picked: 'bg-blue-100 text-blue-800 border-blue-200',
      onboard: 'bg-blue-100 text-blue-800 border-blue-200',
      dropped: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-4 h-4" />;
      case 'picked':
      case 'onboard':
        return <Bus className="w-4 h-4" />;
      case 'dropped':
        return <CheckCircle className="w-4 h-4" />;
      case 'absent':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    const texts = {
      waiting: 'Chờ đón',
      picked: 'Đã lên xe',
      onboard: 'Trên xe',
      dropped: 'Đã trả',
      absent: 'Vắng mặt',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-6 pb-8">
        {/* Header Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/60">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-10 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl w-2/3 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Children Cards Skeletons */}
        <div className="space-y-4">
          <div className="h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl w-64 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-red-200 dark:border-red-900/40 max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-6 pb-8">
      {/* Header with Glass Morphism */}
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/60">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 shadow-lg animate-float">
            <span className="text-5xl">👨‍👩‍👧</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t(lang,'hello')}, {user?.full_name || t(lang,'parent_role')}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg mt-1">{t(lang,'track_children_today')}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards with Gradient & Animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-blue-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span> {t(lang,'total_children')}
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
                {children.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 shadow-lg">
              <Bus className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

  <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-green-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                <span>🚌</span> {t(lang,'on_bus')}
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                {children.filter(c => c.busStatus?.trip?.status === 'onboard' || c.busStatus?.trip?.status === 'picked').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

  <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-yellow-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                <span>⏰</span> {t(lang,'waiting_pickup')}
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mt-2">
                {children.filter(c => c.busStatus?.trip?.status === 'waiting').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Children Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>🎓</span> {t(lang,'your_children')}
          </h2>
        </div>
        
        {children.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20 dark:border-gray-700/60">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Bus className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">{t(lang,'no_student_info_title')}</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm mt-2">{t(lang,'please_contact_school')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 dark:border-gray-700 hover:scale-[1.02]"
              >
                {/* Child Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                        <span className="text-3xl">👶</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{child.full_name}</h3>
                        <p className="text-indigo-100 text-sm mt-1 flex items-center gap-1">
                          <span>📚</span> {child.grade} - {child.class}
                        </p>
                      </div>
                    </div>
                    {child.busStatus?.trip && (
                      <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm border ${
                        child.busStatus.trip.status === 'dropped' ? 'bg-green-500/30 border-green-300/50' :
                        child.busStatus.trip.status === 'onboard' ? 'bg-blue-500/30 border-blue-300/50' :
                        child.busStatus.trip.status === 'waiting' ? 'bg-yellow-500/30 border-yellow-300/50' :
                        'bg-gray-500/30 border-gray-300/50'
                      } text-white shadow-lg`}>
                        {getStatusIcon(child.busStatus.trip.status)}
                        {child.busStatus.trip.status === 'waiting' ? t(lang,'waiting_pickup') :
                         child.busStatus.trip.status === 'onboard' ? t(lang,'picked_up') :
                         child.busStatus.trip.status === 'dropped' ? t(lang,'dropped_off') :
                         child.busStatus.trip.status === 'absent' ? t(lang,'absent') :
                         t(lang,'cancelled')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Child Body */}
                <div className="p-6 space-y-4">
                  {/* Route Info */}
                  {child.route_name && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-4 border border-blue-100 dark:border-gray-600">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 rounded-lg p-2">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                            <span>🗺️</span> {child.route_name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
                            <span>📍</span> {child.stop_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bus Info */}
                  {child.busStatus?.bus && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-4 border border-green-100 dark:border-gray-600">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-600 rounded-lg p-2">
                            <Bus className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            🚌 {child.busStatus.bus.plate}
                          </span>
                        </div>
                        {child.busStatus.driver && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 ml-10 flex items-center gap-1">
                            <span>👨‍✈️</span> {t(lang,'driver_colon')} <span className="font-semibold">{child.busStatus.driver.name}</span>
                          </p>
                        )}
                        {child.busStatus.trip?.picked_at && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 ml-10 flex items-center gap-1">
                            <span>⏰</span> {t(lang,'boarded_at')} <span className="font-medium">{new Date(child.busStatus.trip.picked_at).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons with Gradient */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => navigate(`/parent/tracking/${child.id}`)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <MapPin className="w-5 h-5" />
                      {t(lang,'track')}
                    </button>
                    <button
                      onClick={() => navigate(`/parent/history/${child.id}`)}
                      className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <Clock className="w-5 h-5" />
                      {t(lang,'history')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

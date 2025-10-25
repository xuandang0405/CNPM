import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBuses } from '../../api/buses'
import { listDrivers } from '../../api/drivers'
import axiosInstance from '../../api/axios'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import SimpleBarChart from '../../components/common/SimpleBarChart'
import { StatCardSkeleton, TableSkeleton } from '../../components/common/Skeleton'

export default function Dashboard() {
    const [buses, setBuses] = useState([])
    const [drivers, setDrivers] = useState([])
    const [stats, setStats] = useState({
        buses: 0,
        activeBuses: 0,
        drivers: 0,
        activeDrivers: 0,
        students: 0,
        routes: 0,
        todaySchedules: 0,
        activeTrips: 0
    })
    const [loading, setLoading] = useState(true)
    const { lang } = useUserStore()

    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                
                // Lấy stats từ backend
                const statsResponse = await axiosInstance.get('/admin/stats')
                setStats(statsResponse.data)
                
                // Lấy danh sách xe buýt
                const busesData = await listBuses()
                const busesList = Array.isArray(busesData) ? busesData : (busesData?.buses || [])
                setBuses(busesList)
                
                // Lấy danh sách tài xế
                const driversData = await listDrivers()
                const driversList = Array.isArray(driversData) ? driversData : (driversData?.drivers || [])
                setDrivers(driversList)
            } catch (err) {
                console.error('Failed to load dashboard data:', err)
                setBuses([])
                setDrivers([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])
    
    // Tính toán thống kê
    const activeBuses = stats.activeBuses
    const activeDrivers = stats.activeDrivers
    const totalStudents = stats.students
    const ongoingTrips = stats.activeTrips

    const statsCards = [
        {
            title: 'Total Buses',
            value: stats.buses,
            subtitle: `${activeBuses} active`,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            title: 'Drivers',
            value: stats.drivers,
            subtitle: `${activeDrivers} active`,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
        },
        {
            title: 'Students',
            value: totalStudents,
            subtitle: 'Total registered',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
            ),
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            title: 'Active Trips',
            value: ongoingTrips,
            subtitle: 'Currently running',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        }
    ]

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                </div>
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
                        <p className="text-blue-100 text-lg">Here's what's happening with your school buses today.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                            <div className="text-sm text-blue-100">Today</div>
                            <div className="text-xl font-bold">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                    <div
                        key={index}
                        className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    {stat.title}
                                </h3>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {stat.subtitle}
                                </p>
                            </div>
                            <div className={`${stat.bgColor} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                <div className={`text-transparent bg-gradient-to-r ${stat.color} bg-clip-text`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center text-sm">
                                <span className="text-green-600 dark:text-green-400 font-medium">↗ 12%</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bus Activity</h3>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">Today</button>
                            <button className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">This Week</button>
                        </div>
                    </div>
                    <SimpleBarChart 
                        data={[
                            { label: 'Tổng số xe', value: stats.buses },
                            { label: 'Xe đang hoạt động', value: stats.activeBuses },
                            { label: 'Tổng tài xế', value: stats.drivers },
                            { label: 'Tài xế sẵn sàng', value: stats.activeDrivers },
                            { label: 'Học sinh', value: stats.students },
                            { label: 'Lịch trình hôm nay', value: stats.todaySchedules },
                        ]}
                    />
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {[
                            { icon: '🚌', title: 'Bus #001 started route', time: '2 minutes ago', color: 'text-green-600' },
                            { icon: '👨‍✈️', title: 'Driver John checked in', time: '5 minutes ago', color: 'text-blue-600' },
                            { icon: '📍', title: 'Route B completed', time: '12 minutes ago', color: 'text-purple-600' },
                            { icon: '🎓', title: '25 students picked up', time: '18 minutes ago', color: 'text-orange-600' },
                            { icon: '⚠️', title: 'Traffic delay on Route A', time: '25 minutes ago', color: 'text-red-600' }
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="text-2xl">{activity.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {activity.title}
                                    </p>
                                    <p className={`text-xs ${activity.color}`}>
                                        {activity.time}
                                    </p>
                                </div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
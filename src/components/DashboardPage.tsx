import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingCart, AlertCircle, DollarSign, Plus, UserPlus, CheckCircle, XCircle, Edit, Trash2, LogIn, LogOut, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DashboardStats } from '@/types';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, PageTransition } from '@/lib/motion';
import { StatsGridSkeleton, ChartSkeleton } from '@/components/ui/skeletons';

interface ActivityLog {
  _id: string;
  admin: { firstName: string; lastName: string; email: string };
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'status-change' | 'login' | 'logout';
  resourceType: 'user' | 'category' | 'product' | 'customization-request' | 'order' | 'auth' | 'vendor_invitation';
  description: string;
  createdAt: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getDashboardStats();
        if (response.success && response.data) {
          // If no monthly stats exist, create placeholder data for demo
          const statsData = response.data;
          if (!statsData.monthlyStats || statsData.monthlyStats.length === 0) {
            statsData.monthlyStats = [
              { month: 'Aug', orders: 0, revenue: 0 },
              { month: 'Sep', orders: 0, revenue: 0 },
              { month: 'Oct', orders: 0, revenue: 0 },
              { month: 'Nov', orders: 0, revenue: 0 },
              { month: 'Dec', orders: 0, revenue: 0 },
              { month: 'Jan', orders: 0, revenue: 0 },
            ];
          }
          setStats(statsData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard statistics';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setActivityLoading(true);
        const response = await apiClient.getActivityLogs({ limit: 10 });
        if (response.success && response.data) {
          setActivityLogs(response.data);
        }
      } catch (err) {
        // Silent fail for activity logs
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActionIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create':
        return <Plus className="w-4 h-4" />;
      case 'update':
        return <Edit className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      case 'approve':
        return <CheckCircle className="w-4 h-4" />;
      case 'reject':
        return <XCircle className="w-4 h-4" />;
      case 'login':
        return <LogIn className="w-4 h-4" />;
      case 'logout':
        return <LogOut className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-600';
      case 'update':
        return 'bg-blue-100 text-blue-600';
      case 'delete':
        return 'bg-red-100 text-red-600';
      case 'approve':
        return 'bg-emerald-100 text-emerald-600';
      case 'reject':
        return 'bg-orange-100 text-orange-600';
      case 'login':
      case 'logout':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <PageTransition className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the Ebunly admin portal. Manage products on behalf of vendors.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="stats-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StatsGridSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="stats-loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Products Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card className="border-0 shadow-sm h-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-bl-full" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F6511E' }}>
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    {stats?.recentProducts !== undefined && stats.recentProducts > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        +{stats.recentProducts} this week
                      </span>
                    )}
                  </div>
                  <div>
                    {error ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts ?? 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Total Products</p>
                      </>
                    )}
                  </div>
                  {/* Mini sparkline decoration */}
                  <div className="mt-4 flex items-end gap-1 h-8">
                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: '#F6511E', opacity: 0.2 + (i * 0.1) }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vendors Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card className="border-0 shadow-sm h-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-bl-full" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-blue-500">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Active
                    </span>
                  </div>
                  <div>
                    {error ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalVendors ?? 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Total Vendors</p>
                      </>
                    )}
                  </div>
                  {/* Circular progress decoration */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 transform -rotate-90">
                        <circle cx="16" cy="16" r="12" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                        <motion.circle
                          cx="16" cy="16" r="12"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 100" }}
                          animate={{ strokeDasharray: "75 100" }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500">75% verified</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card className="border-0 shadow-sm h-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-bl-full" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-emerald-500">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    {stats?.recentOrders !== undefined && stats.recentOrders > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        +{stats.recentOrders} this week
                      </span>
                    )}
                  </div>
                  <div>
                    {error ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders ?? 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Total Orders</p>
                      </>
                    )}
                  </div>
                  {/* Trend line decoration */}
                  <div className="mt-4">
                    <svg className="w-full h-8" viewBox="0 0 100 32">
                      <motion.path
                        d="M0 28 Q20 24 30 20 T50 16 T70 8 T100 4"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                      />
                      <motion.path
                        d="M0 28 Q20 24 30 20 T50 16 T70 8 T100 4 V32 H0 Z"
                        fill="url(#emeraldGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 1, duration: 0.5 }}
                      />
                      <defs>
                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revenue Card */}
      {stats?.totalRevenue !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ₦{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F6511E' }}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Section */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="charts-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <ChartSkeleton />
            <ChartSkeleton />
          </motion.div>
        ) : stats?.monthlyStats && (
          <motion.div
            key="charts-loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Orders Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Orders</CardTitle>
                  <CardDescription>
                    {stats.totalOrders === 0
                      ? 'No orders yet - chart will populate as orders come in'
                      : 'Order trends over the last 6 months'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#F6511E" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </motion.div>

          {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Revenue</CardTitle>
              <CardDescription>
                {stats.totalRevenue === 0
                  ? 'No revenue yet - chart will populate as orders are paid'
                  : 'Revenue trends over the last 6 months'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                  />
                  <Bar dataKey="revenue" fill="#F6511E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest actions performed in the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <AnimatePresence mode="wait">
              {activityLoading ? (
                <motion.div
                  key="activity-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-7 h-7 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : activityLogs.length === 0 ? (
                <motion.div
                  key="no-activity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: '#FEF3F0' }}
                  >
                    <Clock className="w-6 h-6" style={{ color: '#F6511E' }} />
                  </div>
                  <p className="text-gray-600 text-sm">No activity yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Actions you perform will appear here
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="activity-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative max-h-[320px] overflow-y-auto pr-1 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Timeline vertical line */}
                  <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-ebunly-orange via-gray-200 to-gray-100" />
                  
                  <div className="space-y-1">
                    {activityLogs.slice(0, 8).map((log, index) => (
                      <motion.div
                        key={log._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-4 py-3 pl-1 pr-2 relative group"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10">
                          <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center ring-4 ring-white ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm text-gray-900 leading-snug">
                            {log.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(log.createdAt)}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              {log.admin.firstName} {log.admin.lastName}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingCart, Plus, Loader2, AlertCircle, UserPlus, DollarSign, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DashboardStats } from '@/types';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleInviteVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const response = await apiClient.inviteVendor(inviteEmail);
      if (response.success) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setDialogOpen(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the Craft Basket admin portal. Manage products on behalf of vendors.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(to bottom right, #f5f3f3, #ede9e9)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b4a4d' }}>
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : error ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts ?? 0}</p>
                    <p className="text-sm text-gray-600">Products</p>
                    {stats?.recentProducts !== undefined && stats.recentProducts > 0 && (
                      <p className="text-xs text-gray-500 mt-1">+{stats.recentProducts} this week</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(to bottom right, #f5f3f3, #ede9e9)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b4a4d' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : error ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalVendors ?? 0}</p>
                    <p className="text-sm text-gray-600">Vendors</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(to bottom right, #f5f3f3, #ede9e9)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b4a4d' }}>
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : error ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders ?? 0}</p>
                    <p className="text-sm text-gray-600">Orders</p>
                    {stats?.recentOrders !== undefined && stats.recentOrders > 0 && (
                      <p className="text-xs text-gray-500 mt-1">+{stats.recentOrders} this week</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      {stats?.totalRevenue !== undefined && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b4a4d' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      {!isLoading && stats?.monthlyStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Chart */}
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
                  <Line type="monotone" dataKey="orders" stroke="#4a3032" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
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
                  <Bar dataKey="revenue" fill="#4a3032" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/create-product')}
              className="h-auto py-6 flex flex-col items-center gap-2 text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#4a3032' }}
            >
              <Plus className="w-8 h-8" />
              <span className="font-semibold">Create Product</span>
              <span className="text-xs opacity-80">Add a product for a vendor</span>
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="h-auto py-6 flex flex-col items-center gap-2 bg-white text-gray-700 border-2 hover:bg-gray-50"
                  variant="outline"
                >
                  <UserPlus className="w-8 h-8" />
                  <span className="font-semibold">Invite Vendor</span>
                  <span className="text-xs opacity-70">Send invitation email</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Vendor</DialogTitle>
                  <DialogDescription>
                    Send an invitation email to a new vendor to join the marketplace.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteVendor} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-email">Vendor Email</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      placeholder="vendor@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      disabled={isInviting}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={isInviting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isInviting}
                      className="text-white"
                      style={{ backgroundColor: '#4a3032' }}
                    >
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

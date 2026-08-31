import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Loader2, Users, Gift, UserPlus, Store } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { SubscriberCardSkeleton } from '@/components/ui/skeletons';
import type { Subscriber, SubscriberStats } from '@/types';

export function SubscribersPage() {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [page, search, segment]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getSubscriberStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch {
      // Non-critical
    }
  };

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getSubscribers({
        page,
        limit: 15,
        search: search || undefined,
        segment: segment || undefined,
      });
      if (response.success && response.data) {
        setSubscribers(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Customers', value: stats.totalCustomers, icon: <Users className="w-5 h-5" />, color: '#F6511E' },
    { label: 'With Birthday', value: stats.customersWithBirthday, icon: <Gift className="w-5 h-5" />, color: '#DB2777' },
    { label: 'New (30 days)', value: stats.newCustomers30d, icon: <UserPlus className="w-5 h-5" />, color: '#16A34A' },
    { label: 'Vendors', value: stats.totalVendors, icon: <Store className="w-5 h-5" />, color: '#2563EB' },
  ] : [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
            <p className="text-sm text-gray-500">View your audience and subscriber data</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search subscribers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={segment || 'all'} onValueChange={(v) => { setSegment(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="with_birthday">With Birthday</SelectItem>
              <SelectItem value="new_30d">New (30 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SubscriberCardSkeleton key={i} />
                ))}
              </>
            ) : subscribers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">No subscribers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Member Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.firstName} {sub.lastName}</TableCell>
                      <TableCell className="text-gray-600">{sub.email}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {sub.dateOfBirth ? new Date(sub.dateOfBirth).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

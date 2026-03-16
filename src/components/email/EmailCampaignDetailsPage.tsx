import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Send, 
  MailOpen, 
  MousePointer2, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { FormSkeleton } from '@/components/ui/skeletons';
import type { EmailCampaign } from '@/types';

interface Recipient {
  _id: string;
  status: 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  lastEvent: string;
  events: Array<{
    type: string;
    timestamp: string;
    link?: string;
  }>;
}

export function EmailCampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchRecipients();
    }
  }, [id, page]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.getCampaignAnalytics(id!);
      if (res.success && res.data) {
        setCampaign(res.data.campaign);
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load campaign analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      setIsRecipientsLoading(true);
      const res = await apiClient.getCampaignRecipients(id!, { page, limit: 10 });
      if (res.success && res.data) {
        setRecipients(res.data as any);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load recipients');
    } finally {
      setIsRecipientsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      opened: 'bg-green-100 text-green-800',
      clicked: 'bg-purple-100 text-purple-800',
      bounced: 'bg-red-100 text-red-800',
      unsubscribed: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  if (isLoading) {
    return <FormSkeleton />;
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Campaign Not Found</h2>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/email/campaigns')}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const openRate = campaign.totalRecipients > 0 
    ? ((stats.uniqueOpens || 0) / campaign.totalRecipients * 100).toFixed(1)
    : '0.0';
  
  const clickRate = campaign.totalRecipients > 0
    ? ((stats.uniqueClicks || 0) / campaign.totalRecipients * 100).toFixed(1)
    : '0.0';

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-sm text-gray-500">Subject: {campaign.subject}</p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/email/preview/${campaign._id}`, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview HTML
            </Button>
            {campaign.status === 'draft' && (
              <Button onClick={() => navigate(`/email/campaigns/${campaign._id}/edit`)} style={{ backgroundColor: '#F6511E' }} className="text-white">
                Edit Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Delivery</p>
                  <p className="text-2xl font-bold">{stats.sent || campaign.successCount || 0} / {campaign.totalRecipients || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Send className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {(stats.sent || campaign.successCount) && campaign.totalRecipients > 0 
                  ? `${(((stats.sent || campaign.successCount) / campaign.totalRecipients) * 100).toFixed(1)}% success rate`
                  : 'Sending in progress...'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Open Rate</p>
                  <p className="text-2xl font-bold">{openRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <MailOpen className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {stats.uniqueOpens || 0} unique opens
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Click Rate</p>
                  <p className="text-2xl font-bold">{clickRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <MousePointer2 className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {stats.uniqueClicks || 0} unique clicks
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bounce/Unsub</p>
                  <p className="text-2xl font-bold">{(stats.bounced || 0) + (stats.unsubscribed || 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {stats.bounced || 0} bounces, {stats.unsubscribed || 0} unsubscribes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recipients</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Activity feed for all recipients</p>
            </div>
            {isRecipientsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </CardHeader>
          <CardContent className="p-0">
            {recipients.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No recipient activity tracked yet</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>History</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((recipient) => (
                      <TableRow key={recipient._id}>
                        <TableCell className="font-medium">{recipient._id}</TableCell>
                        <TableCell>{getStatusBadge(recipient.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(recipient.lastEvent).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(recipient.events.map(e => e.type))).map((type) => {
                              const count = recipient.events.filter(e => e.type === type).length;
                              return (
                                <Badge key={type} variant="outline" className="text-[10px] py-0">
                                  {type}{count > 1 ? ` x${count}` : ''}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-4 border-t">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

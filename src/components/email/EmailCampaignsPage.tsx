import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, Edit, Trash2, Send, XCircle, Mail, ArrowLeft, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTransition } from '@/lib/motion';
import { EmailCampaignTableSkeleton } from '@/components/ui/skeletons';
import type { EmailCampaign } from '@/types';

const AUDIENCE_LABELS: Record<string, string> = {
  all_customers: 'All Customers',
  all_vendors: 'All Vendors',
  birthday_this_month: 'Birthday This Month',
  new_customers_30d: 'New Customers (30d)',
  inactive_customers_90d: 'Inactive (90d)',
  custom: 'Custom List',
};

export function EmailCampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('productdevteam0@gmail.com');

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getEmailCampaigns({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      if (response.success && response.data) {
        setCampaigns(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsActioning(true);
      await apiClient.deleteEmailCampaign(deleteId);
      toast.success('Campaign deleted');
      setDeleteId(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsActioning(false);
    }
  };

  const handleSend = async () => {
    if (!sendId) return;
    try {
      setIsActioning(true);
      await apiClient.sendEmailCampaign(sendId);
      toast.success('Campaign is being sent!');
      setSendId(null);
      // Refresh immediately and then poll for status updates
      await fetchCampaigns();
      // Poll every 2 seconds for 30 seconds to catch status changes
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        await fetchCampaigns();
        if (pollCount >= 15) clearInterval(pollInterval);
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      setIsActioning(true);
      await apiClient.cancelEmailCampaign(cancelId);
      toast.success('Campaign cancelled');
      setCancelId(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setIsActioning(false);
    }
  };
  const handleSendTest = async () => {
    try {
      setIsActioning(true);
      await apiClient.sendTestEmail({
        email: testEmail,
        subject: '🎉 Test Email from Ebunly',
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>Test Email</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #F6511E 0%, #FF6B3D 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Test Email</h1>
              </div>
              <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0;">Hello from Ebunly!</h2>
                <p style="color: #4b5563; line-height: 1.6;">This is a test email to verify that your email automation system is working correctly.</p>
                <p style="color: #4b5563; line-height: 1.6;">If you're seeing this, congratulations! Your email system is fully operational. 🚀</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px;">© ${new Date().getFullYear()} Ebunly. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
      toast.success(`Test email sent to ${testEmail}!`);
      setShowTestDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setIsActioning(false);
    }
  };
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return <Badge className={styles[status] || styles.draft}>{status}</Badge>;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-sm text-gray-500">Create and send email campaigns</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowTestDialog(true)} variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Send Test
            </Button>
            <Button onClick={() => navigate('/email/campaigns/create')} style={{ backgroundColor: '#F6511E' }} className="text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="sending">Sending</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <EmailCampaignTableSkeleton />
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Mail className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">No campaigns found</p>
                <p className="text-sm">Create your first email campaign</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{campaign.subject}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className="pointer-events-none">{getStatusBadge(campaign.status)}</span></TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {AUDIENCE_LABELS[campaign.audienceSegment] || campaign.audienceSegment}
                      </TableCell>
                      <TableCell>
                        {campaign.status === 'sent' || campaign.status === 'sending' ? (
                          <span className="text-sm">
                            <span className="text-green-600">{campaign.successCount}</span>
                            {campaign.failCount > 0 && (
                              <span className="text-red-600"> / {campaign.failCount} failed</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">{campaign.totalRecipients || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {campaign.sentAt
                          ? new Date(campaign.sentAt).toLocaleDateString()
                          : campaign.scheduledAt
                          ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString()}`
                          : new Date(campaign.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {['sent', 'sending', 'scheduled'].includes(campaign.status) && (
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/email/campaigns/${campaign._id}`)}>
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {['draft', 'scheduled'].includes(campaign.status) && (
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/email/campaigns/${campaign._id}/edit`)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {['draft', 'scheduled'].includes(campaign.status) && (
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => setSendId(campaign._id)}>
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {campaign.status === 'scheduled' && (
                            <Button variant="ghost" size="sm" className="text-orange-600" onClick={() => setCancelId(campaign._id)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {['draft', 'cancelled'].includes(campaign.status) && (
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(campaign._id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}

        <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Campaign" description="Are you sure you want to delete this campaign?" confirmText="Delete" cancelText="Cancel" onConfirm={handleDelete} variant="destructive" isLoading={isActioning} />
        <ConfirmDialog open={!!sendId} onOpenChange={(o) => !o && setSendId(null)} title="Send Campaign" description="Are you sure you want to send this campaign now? Emails will be delivered to all recipients in the selected audience." confirmText="Send Now" cancelText="Cancel" onConfirm={handleSend} isLoading={isActioning} />
        <ConfirmDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} title="Cancel Campaign" description="Are you sure you want to cancel this scheduled campaign?" confirmText="Cancel Campaign" cancelText="Go Back" onConfirm={handleCancel} variant="destructive" isLoading={isActioning} />
        
        {/* Test Email Dialog */}
        <ConfirmDialog 
          open={showTestDialog} 
          onOpenChange={(o) => !o && setShowTestDialog(false)} 
          title="Send Test Email" 
          description={
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Send a test email to verify your email system is working.</p>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          }
          confirmText="Send Test" 
          cancelText="Cancel" 
          onConfirm={handleSendTest} 
          isLoading={isActioning} 
        />
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Send, XCircle, Mail, Eye, Users, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTransition } from '@/lib/motion';
import type { EmailCampaign } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const AUDIENCE_LABELS: Record<string, string> = {
  all_customers:        'All Customers',
  all_vendors:          'All Vendors',
  birthday_this_month:  'Birthday This Month',
  new_customers_30d:    'New Customers (30d)',
  inactive_customers_90d: 'Inactive (90d)',
  custom:               'Custom List',
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  draft:     { label: 'Draft',     dot: 'bg-gray-400',   text: 'text-gray-600',  bg: 'bg-gray-100' },
  scheduled: { label: 'Scheduled', dot: 'bg-blue-500',   text: 'text-blue-700',  bg: 'bg-blue-50' },
  sending:   { label: 'Sending',   dot: 'bg-amber-400 animate-pulse', text: 'text-amber-700', bg: 'bg-amber-50' },
  sent:      { label: 'Sent',      dot: 'bg-green-500',  text: 'text-green-700', bg: 'bg-green-50' },
  failed:    { label: 'Failed',    dot: 'bg-red-500',    text: 'text-red-700',   bg: 'bg-red-50' },
  cancelled: { label: 'Cancelled', dot: 'bg-gray-300',   text: 'text-gray-500',  bg: 'bg-gray-100' },
};

const TABS = ['all', 'draft', 'scheduled', 'sending', 'sent'] as const;

export function EmailCampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('productdevteam0@gmail.com');

  const fetchCampaigns = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await apiClient.getEmailCampaigns({ page, limit: 10, status: statusFilter || undefined });
      if (response.success && response.data) {
        setCampaigns(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      if (!silent) toast.error(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [page, statusFilter]);

  useEffect(() => {
    const hasSending = campaigns.some((c) => c.status === 'sending');
    if (!hasSending) return;
    const interval = setInterval(() => fetchCampaigns(true), 3000);
    return () => clearInterval(interval);
  }, [campaigns]);

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
      await fetchCampaigns(true);
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
        subject: 'Test Email from Ebunly',
        htmlContent: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="background:#F6511E;padding:40px;border-radius:12px 12px 0 0;text-align:center;"><h1 style="color:white;margin:0;">Test Email</h1></div><div style="background:white;padding:40px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,.1);"><h2 style="color:#1f2937;margin-top:0;">Hello from Ebunly!</h2><p style="color:#4b5563;line-height:1.6;">Your email system is working correctly.</p><p style="color:#9ca3af;font-size:12px;margin-top:40px;text-align:center;">Sent at ${new Date().toLocaleString()}</p></div></body></html>`,
      });
      toast.success(`Test email sent to ${testEmail}!`);
      setShowTestDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setIsActioning(false);
    }
  };

  const filtered = search
    ? campaigns.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()))
    : campaigns;

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and send targeted email campaigns</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl h-9 text-sm" onClick={() => setShowTestDialog(true)}>
              <Mail className="w-4 h-4 mr-1.5" />
              Send Test
            </Button>
            <Button className="rounded-xl h-9 text-sm text-white" style={{ backgroundColor: '#F6511E' }} onClick={() => navigate('/email/campaigns/create')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
            />
          </div>
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab === 'all' ? '' : tab); setPage(1); }}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
                  (tab === 'all' ? !statusFilter : statusFilter === tab)
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">No campaigns found</p>
            <p className="text-xs text-gray-400 mb-4">Create your first campaign to reach your audience</p>
            <Button className="rounded-xl text-xs text-white h-8" style={{ backgroundColor: '#F6511E' }} onClick={() => navigate('/email/campaigns/create')}>
              <Plus className="w-3 h-3 mr-1" /> Create Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((campaign, idx) => {
                const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all px-5 py-4 flex items-center gap-4"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      {campaign.status === 'sent' && <CheckCircle2 className={`w-5 h-5 ${cfg.text}`} />}
                      {campaign.status === 'sending' && <Loader2 className={`w-5 h-5 ${cfg.text} animate-spin`} />}
                      {campaign.status === 'scheduled' && <Clock className={`w-5 h-5 ${cfg.text}`} />}
                      {campaign.status === 'failed' && <AlertCircle className={`w-5 h-5 ${cfg.text}`} />}
                      {['draft', 'cancelled'].includes(campaign.status) && <Mail className={`w-5 h-5 ${cfg.text}`} />}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{campaign.subject}</p>
                    </div>

                    {/* Meta */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{AUDIENCE_LABELS[campaign.audienceSegment] || campaign.audienceSegment}</span>
                      </div>
                      {(campaign.status === 'sent' || campaign.status === 'sending') && (
                        <div className="flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" />
                          <span className="text-green-600 font-medium">{campaign.successCount}</span>
                          {campaign.failCount > 0 && <span className="text-red-500">/{campaign.failCount} failed</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {campaign.sentAt
                            ? new Date(campaign.sentAt).toLocaleDateString()
                            : campaign.scheduledAt
                            ? new Date(campaign.scheduledAt).toLocaleDateString()
                            : new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {['sent', 'sending', 'scheduled'].includes(campaign.status) && (
                        <button onClick={() => navigate(`/email/campaigns/${campaign.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="View analytics">
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                      {['draft', 'scheduled'].includes(campaign.status) && (
                        <button onClick={() => navigate(`/email/campaigns/${campaign.id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      {['draft', 'scheduled'].includes(campaign.status) && (
                        <button onClick={() => setSendId(campaign.id)} className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="Send now">
                          <Send className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                      {campaign.status === 'scheduled' && (
                        <button onClick={() => setCancelId(campaign.id)} className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors" title="Cancel">
                          <XCircle className="w-4 h-4 text-orange-500" />
                        </button>
                      )}
                      {['draft', 'cancelled'].includes(campaign.status) && (
                        <button onClick={() => setDeleteId(campaign.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}

        <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Campaign" description="Are you sure you want to delete this campaign?" confirmText="Delete" cancelText="Cancel" onConfirm={handleDelete} variant="destructive" isLoading={isActioning} />
        <ConfirmDialog open={!!sendId} onOpenChange={(o) => !o && setSendId(null)} title="Send Campaign" description="This will send the email to all recipients immediately. This action cannot be undone." confirmText="Send Now" cancelText="Cancel" onConfirm={handleSend} isLoading={isActioning} />
        <ConfirmDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} title="Cancel Campaign" description="Are you sure you want to cancel this scheduled campaign?" confirmText="Cancel Campaign" cancelText="Go Back" onConfirm={handleCancel} variant="destructive" isLoading={isActioning} />
        <ConfirmDialog
          open={showTestDialog}
          onOpenChange={(o) => !o && setShowTestDialog(false)}
          title="Send Test Email"
          description={
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Send a quick test to verify your email setup.</p>
              <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Enter email address" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
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

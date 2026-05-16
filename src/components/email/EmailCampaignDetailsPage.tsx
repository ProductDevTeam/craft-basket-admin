import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send, MailOpen, MousePointer2, AlertCircle, CheckCircle2,
  Users, Clock, ExternalLink, Loader2, TrendingUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { CampaignDetailsSkeleton } from '@/components/ui/skeletons';
import type { EmailCampaign } from '@/types';

interface Recipient {
  _id: string;
  status: 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  lastEvent: string;
  events: Array<{ type: string; timestamp: string; link?: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  sent:         'bg-green-50 text-green-700',
  opened:       'bg-blue-50 text-blue-700',
  clicked:      'bg-purple-50 text-purple-700',
  bounced:      'bg-red-50 text-red-700',
  unsubscribed: 'bg-gray-100 text-gray-500',
};

const EVENT_COLORS: Record<string, string> = {
  sent:    'bg-gray-100 text-gray-600',
  opened:  'bg-blue-50 text-blue-600',
  clicked: 'bg-purple-50 text-purple-600',
};

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

  useEffect(() => { if (id) fetchData(); }, [id]);
  useEffect(() => { if (id) fetchRecipients(); }, [id, page]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.getCampaignAnalytics(id!);
      if (res.success && res.data) {
        setCampaign(res.data.campaign);
        setStats(res.data.stats);
      }
    } catch {
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
    } catch {
      toast.error('Failed to load recipients');
    } finally {
      setIsRecipientsLoading(false);
    }
  };

  if (isLoading) return <CampaignDetailsSkeleton />;
  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Campaign not found</h2>
        <Button variant="ghost" className="mt-4 rounded-xl" onClick={() => navigate('/email/campaigns')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Campaigns
        </Button>
      </div>
    );
  }

  const openRate = campaign.totalRecipients > 0
    ? ((stats.uniqueOpens || 0) / campaign.totalRecipients * 100).toFixed(1) : '0.0';
  const clickRate = campaign.totalRecipients > 0
    ? ((stats.uniqueClicks || 0) / campaign.totalRecipients * 100).toFixed(1) : '0.0';
  const deliveryRate = campaign.totalRecipients > 0
    ? (((stats.sent || campaign.successCount || 0) / campaign.totalRecipients) * 100).toFixed(1) : '0.0';

  const statCards = [
    {
      label: 'Delivery',
      value: `${stats.sent || campaign.successCount || 0} / ${campaign.totalRecipients || 0}`,
      sub: `${deliveryRate}% success rate`,
      icon: <Send className="w-5 h-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      highlight: false,
    },
    {
      label: 'Open Rate',
      value: `${openRate}%`,
      sub: `${stats.uniqueOpens || 0} unique opens`,
      icon: <MailOpen className="w-5 h-5" />,
      color: 'text-green-600',
      bg: 'bg-green-50',
      highlight: parseFloat(openRate) > 20,
    },
    {
      label: 'Click Rate',
      value: `${clickRate}%`,
      sub: `${stats.uniqueClicks || 0} unique clicks`,
      icon: <MousePointer2 className="w-5 h-5" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      highlight: parseFloat(clickRate) > 5,
    },
    {
      label: 'Bounce / Unsub',
      value: `${(stats.bounced || 0) + (stats.unsubscribed || 0)}`,
      sub: `${stats.bounced || 0} bounces, ${stats.unsubscribed || 0} unsubs`,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      highlight: false,
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{campaign.name}</h1>
              <p className="text-xs text-gray-400 truncate mt-0.5">Subject: {campaign.subject}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-8"
              onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/email/preview/${campaign._id}`, '_blank')}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Preview HTML
            </Button>
            {campaign.status === 'draft' && (
              <Button size="sm" className="rounded-xl text-xs h-8 text-white" style={{ backgroundColor: '#F6511E' }} onClick={() => navigate(`/email/campaigns/${campaign._id}/edit`)}>
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl border p-5 transition-all ${s.highlight ? 'border-green-200 shadow-sm' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                  {s.icon}
                </div>
                {s.highlight && <TrendingUp className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-sm text-gray-900">Recipients</span>
              <span className="text-xs text-gray-400">Activity feed</span>
            </div>
            {isRecipientsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
          </div>

          {recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No recipient activity tracked yet</p>
              <p className="text-xs text-gray-300 mt-1">Opens and clicks will appear here once recipients engage</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {recipients.map((r) => (
                  <div key={r._id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      {r._id.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r._id}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {Array.from(new Set(r.events.map((e) => e.type))).map((type) => {
                          const count = r.events.filter((e) => e.type === type).length;
                          return (
                            <span key={type} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${EVENT_COLORS[type] || 'bg-gray-100 text-gray-500'}`}>
                              {type}{count > 1 ? ` ×${count}` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(r.lastEvent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-50">
                  <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

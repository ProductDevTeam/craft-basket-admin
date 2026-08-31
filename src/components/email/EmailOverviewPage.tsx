import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Zap, Users, Plus, ArrowRight, TrendingUp, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PageTransition } from '@/lib/motion';
import { EmailOverviewSkeleton } from '@/components/ui/skeletons';
import type { EmailTemplate, EmailCampaign, EmailAutomationRule, SubscriberStats } from '@/types';

export function EmailOverviewPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [rules, setRules] = useState<EmailAutomationRule[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [templatesRes, campaignsRes, rulesRes, statsRes] = await Promise.all([
        apiClient.getEmailTemplates({ limit: 5 }),
        apiClient.getEmailCampaigns({ limit: 5 }),
        apiClient.getAutomationRules(),
        apiClient.getSubscriberStats(),
      ]);
      if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data);
      if (campaignsRes.success && campaignsRes.data) setCampaigns(campaignsRes.data);
      if (rulesRes.success && rulesRes.data) setRules(rulesRes.data);
      if (statsRes.success && statsRes.data) setSubscriberStats(statsRes.data);
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  };

  const activeRules = rules.filter((r) => r.isEnabled).length;
  const sentCampaigns = campaigns.filter((c) => c.status === 'sent').length;

  const stats = [
    {
      label: 'Templates',
      value: templates.length,
      sub: 'Reusable designs',
      icon: <FileText className="w-5 h-5" />,
      color: '#F6511E',
      bg: '#FFF4F0',
      path: '/email/templates',
    },
    {
      label: 'Campaigns',
      value: campaigns.length,
      sub: `${sentCampaigns} sent`,
      icon: <Send className="w-5 h-5" />,
      color: '#2563EB',
      bg: '#EFF6FF',
      path: '/email/campaigns',
    },
    {
      label: 'Active Rules',
      value: activeRules,
      sub: `${rules.length} total rules`,
      icon: <Zap className="w-5 h-5" />,
      color: '#16A34A',
      bg: '#F0FDF4',
      path: '/email/automation',
    },
    {
      label: 'Subscribers',
      value: subscriberStats?.totalCustomers || 0,
      sub: `${subscriberStats?.newCustomers30d || 0} new this month`,
      icon: <Users className="w-5 h-5" />,
      color: '#7C3AED',
      bg: '#F5F3FF',
      path: '/email/subscribers',
    },
  ];

  const statusConfig: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700' },
    sending:   { label: 'Sending',   cls: 'bg-amber-50 text-amber-700' },
    sent:      { label: 'Sent',      cls: 'bg-green-50 text-green-700' },
    failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-700' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
  };

  const triggerLabels: Record<string, string> = {
    welcome:           'New signup',
    birthday:          'Birthday',
    abandoned_cart:    'Abandoned cart',
    order_confirmed:   'Order confirmed',
    order_shipped:     'Order shipped',
    win_back:          'Win-back',
  };

  return (
    <PageTransition>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage templates, campaigns and automation</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl h-9 text-sm" onClick={() => navigate('/email/templates/create')}>
              <FileText className="w-4 h-4 mr-1.5" />
              New Template
            </Button>
            <Button className="rounded-xl h-9 text-sm text-white" style={{ backgroundColor: '#F6511E' }} onClick={() => navigate('/email/campaigns/create')}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Campaign
            </Button>
          </div>
        </div>

        {isLoading ? <EmailOverviewSkeleton /> : (<>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            </button>
          ))}
        </div>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Campaigns */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-sm text-gray-900">Recent Campaigns</span>
              </div>
              <button onClick={() => navigate('/email/campaigns')} className="text-xs text-[#F6511E] font-medium flex items-center gap-1 hover:opacity-80 transition-opacity">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="w-8 h-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No campaigns yet</p>
                <button onClick={() => navigate('/email/campaigns/create')} className="mt-3 text-xs text-[#F6511E] font-medium">
                  Create your first campaign →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {campaigns.map((c) => {
                  const cfg = statusConfig[c.status] || statusConfig.draft;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
                      onClick={() => ['sent','sending','scheduled'].includes(c.status) && navigate(`/email/campaigns/${c.id}`)}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF4F0' }}>
                        <Mail className="w-3.5 h-3.5" style={{ color: '#F6511E' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.status === 'sent' && c.successCount > 0 && (
                          <span className="text-xs text-gray-400">{c.successCount} sent</span>
                        )}
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Automation Rules */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-sm text-gray-900">Automation Rules</span>
              </div>
              <button onClick={() => navigate('/email/automation')} className="text-xs text-[#F6511E] font-medium flex items-center gap-1 hover:opacity-80 transition-opacity">
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="w-8 h-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No automation rules set up</p>
                <button onClick={() => navigate('/email/automation')} className="mt-3 text-xs text-[#F6511E] font-medium">
                  Set up automation →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
                    onClick={() => navigate('/email/automation')}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.isEnabled ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <Zap className={`w-3.5 h-3.5 ${r.isEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{triggerLabels[r.trigger] || r.trigger.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${r.isEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subscriber snapshot */}
        {subscriberStats && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-sm text-gray-900">Audience Snapshot</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Customers', value: subscriberStats.totalCustomers, color: 'text-gray-900' },
                { label: 'New (30 days)', value: subscriberStats.newCustomers30d, color: 'text-blue-600' },
                { label: 'With Birthday', value: subscriberStats.customersWithBirthday, color: 'text-pink-600' },
                { label: 'Total Vendors', value: subscriberStats.totalVendors, color: 'text-purple-600' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        </>)}
      </div>
    </PageTransition>
  );
}

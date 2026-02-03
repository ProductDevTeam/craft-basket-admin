import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Zap, Users, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PageTransition } from '@/lib/motion';
import type { EmailTemplate, EmailCampaign, EmailAutomationRule, SubscriberStats } from '@/types';

export function EmailOverviewPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [rules, setRules] = useState<EmailAutomationRule[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

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

  const stats = [
    { label: 'Templates', value: templates.length, icon: <FileText className="w-5 h-5" />, color: '#F6511E', path: '/email/templates' },
    { label: 'Campaigns', value: campaigns.length, icon: <Send className="w-5 h-5" />, color: '#2563EB', path: '/email/campaigns' },
    { label: 'Active Rules', value: activeRules, icon: <Zap className="w-5 h-5" />, color: '#16A34A', path: '/email/automation' },
    { label: 'Subscribers', value: subscriberStats?.totalCustomers || 0, icon: <Users className="w-5 h-5" />, color: '#7C3AED', path: '/email/subscribers' },
  ];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email</h1>
            <p className="text-sm text-gray-500">Manage email templates, campaigns, and automation</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/email/templates/create')}>
              <FileText className="w-4 h-4 mr-2" />
              New Template
            </Button>
            <Button onClick={() => navigate('/email/campaigns/create')} style={{ backgroundColor: '#F6511E' }} className="text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(stat.path)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Campaigns</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/email/campaigns')}>
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No campaigns yet</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((c) => (
                    <div key={c._id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {getStatusBadge(c.status)}
                        {c.status === 'sent' && (
                          <span className="text-xs text-gray-500">{c.successCount} sent</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Rules */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Automation Rules</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/email/automation')}>
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No automation rules set up</p>
              ) : (
                <div className="space-y-3">
                  {rules.map((r) => (
                    <div key={r._id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: r.isEnabled ? '#DEF7EC' : '#F3F4F6' }}>
                          <Zap className="w-4 h-4" style={{ color: r.isEnabled ? '#16A34A' : '#9CA3AF' }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{r.trigger.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <Badge className={r.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {r.isEnabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

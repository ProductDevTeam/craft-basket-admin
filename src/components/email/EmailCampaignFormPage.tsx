import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Eye, Save, Send, Clock, Users, Layers } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { FormSkeleton } from '@/components/ui/skeletons';
import { EmailBuilder } from './EmailBuilder';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { EmailTemplate } from '@/types';

const AUDIENCE_OPTIONS = [
  { value: 'all_customers',         label: 'All Customers',         desc: 'Every active customer' },
  { value: 'all_vendors',           label: 'All Vendors',           desc: 'Every active vendor' },
  { value: 'birthday_this_month',   label: 'Birthday This Month',   desc: 'Customers with a birthday this month' },
  { value: 'new_customers_30d',     label: 'New Customers (30d)',   desc: 'Signed up in the last 30 days' },
  { value: 'inactive_customers_90d',label: 'Inactive (90d)',         desc: 'Not active in 90 days' },
  { value: 'custom',                label: 'Custom List',           desc: 'Manually enter addresses' },
];

export function EmailCampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [audienceSegment, setAudienceSegment] = useState('all_customers');
  const [customRecipients, setCustomRecipients] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [jsonContent, setJsonContent] = useState<Record<string, unknown> | undefined>();
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTemplates();
    if (isEdit) fetchCampaign();
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const r = await apiClient.getEmailTemplates({ limit: 100 });
      if (r.success && r.data) setTemplates(r.data.filter((t) => t.isActive));
    } catch { /* optional */ }
  };

  const fetchCampaign = async () => {
    try {
      setIsFetching(true);
      const r = await apiClient.getEmailCampaign(id!);
      if (r.success && r.data) {
        const c = r.data;
        setName(c.name); setSubject(c.subject); setAudienceSegment(c.audienceSegment);
        setHtmlContent(c.htmlContent);
        if (c.jsonContent) setJsonContent(c.jsonContent);
        if (c.customRecipients) setCustomRecipients(c.customRecipients.join(', '));
        if (c.scheduledAt) {
          setEnableSchedule(true);
          const d = new Date(c.scheduledAt);
          setScheduledDate(d.toISOString().split('T')[0]);
          setScheduledTime(d.toTimeString().slice(0, 5));
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load campaign');
      navigate('/email/campaigns');
    } finally {
      setIsFetching(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (templateId === 'none') { setSelectedTemplateId(''); return; }
    setSelectedTemplateId(templateId);
    try {
      const r = await apiClient.getEmailTemplate(templateId);
      if (r.success && r.data) {
        const t = r.data;
        if (!subject) setSubject(t.subject);
        setHtmlContent(t.htmlContent);
        if (t.jsonContent) setJsonContent(t.jsonContent);
        toast.success('Template loaded');
      }
    } catch { toast.error('Failed to load template'); }
  };

  const buildPayload = () => {
    let scheduledAt: string | undefined;
    if (enableSchedule && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }
    const recipients = audienceSegment === 'custom'
      ? customRecipients.split(',').map((e) => e.trim()).filter(Boolean) : undefined;
    return { name, subject, htmlContent, jsonContent, template: selectedTemplateId || undefined, audienceSegment, customRecipients: recipients, scheduledAt };
  };

  const handleSaveDraft = async () => {
    if (!name.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.error('Please fill in name, subject, and content'); return;
    }
    try {
      setIsSaving(true);
      const payload: any = buildPayload();
      if (isEdit) {
        await apiClient.updateEmailCampaign(id!, payload);
        toast.success('Campaign updated');
      } else {
        await apiClient.createEmailCampaign(payload);
        toast.success('Campaign saved as draft');
      }
      navigate('/email/campaigns');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!name.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.error('Please fill in name, subject, and content'); return;
    }
    try {
      setIsSending(true);
      const payload: any = buildPayload();
      let campaignId = id;
      if (isEdit) {
        await apiClient.updateEmailCampaign(id!, payload);
      } else {
        const r = await apiClient.createEmailCampaign(payload);
        if (r.success && r.data) campaignId = r.data._id;
      }
      if (campaignId) {
        await apiClient.sendEmailCampaign(campaignId);
        toast.success('Campaign is being sent!');
      }
      navigate('/email/campaigns');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setIsSending(false);
      setShowSendConfirm(false);
    }
  };

  if (isFetching) return <FormSkeleton />;

  const selectedAudience = AUDIENCE_OPTIONS.find((o) => o.value === audienceSegment);

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Campaign' : 'New Campaign'}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Design and target your email</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs" disabled={!htmlContent}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader><DialogTitle>Email Preview</DialogTitle></DialogHeader>
                <div className="border rounded-xl overflow-auto max-h-[70vh] bg-gray-100 p-4">
                  <div className="mx-auto bg-white shadow-lg overflow-hidden" style={{ width: '600px' }}>
                    <iframe srcDoc={htmlContent} title="Email Preview" className="w-full h-[600px] border-0" sandbox="" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs" onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save Draft
            </Button>
            <Button size="sm" className="rounded-xl h-8 text-xs text-white" style={{ backgroundColor: '#F6511E' }} onClick={() => setShowSendConfirm(true)} disabled={isSending}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send Now
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main */}
          <div className="lg:col-span-3 space-y-4">
            {/* Details card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Campaign Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Campaign Name *</Label>
                  <Input placeholder="e.g. January Newsletter" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-9 text-sm border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Subject Line *</Label>
                  <Input placeholder="e.g. New arrivals just for you!" value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl h-9 text-sm border-gray-200" />
                </div>
              </div>
            </div>

            {/* Email builder */}
            <div className="min-h-[800px]">
              <EmailBuilder initialContent={jsonContent} onChange={(html, json) => { setHtmlContent(html); setJsonContent(json); }} minHeight="800px" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Template */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-900">Load Template</p>
              </div>
              <Select value={selectedTemplateId || 'none'} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="rounded-xl h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-900">Audience</p>
              </div>
              <Select value={audienceSegment} onValueChange={setAudienceSegment}>
                <SelectTrigger className="rounded-xl h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAudience && (
                <p className="text-[11px] text-gray-400 mt-2">{selectedAudience.desc}</p>
              )}

              {audienceSegment === 'custom' && (
                <div className="mt-3 space-y-1.5">
                  <Label className="text-xs text-gray-500">Email Addresses</Label>
                  <Textarea
                    placeholder="email1@example.com, email2@example.com"
                    value={customRecipients}
                    onChange={(e) => setCustomRecipients(e.target.value)}
                    rows={4}
                    className="rounded-xl text-sm border-gray-200 resize-none"
                  />
                  <p className="text-[11px] text-gray-400">
                    {customRecipients.split(',').filter((e) => e.trim()).length} recipients
                  </p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-900">Schedule</p>
                </div>
                <Switch checked={enableSchedule} onCheckedChange={setEnableSchedule} />
              </div>
              {enableSchedule ? (
                <div className="space-y-2">
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="rounded-xl h-9 text-sm border-gray-200" />
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="rounded-xl h-9 text-sm border-gray-200" />
                </div>
              ) : (
                <p className="text-[11px] text-gray-400">Toggle to schedule for a later time</p>
              )}
            </div>

            {/* Tips */}
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Personalization</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Use <code className="bg-amber-100 px-1 rounded font-mono">{'{{firstName}}'}</code> in your content to address each recipient by name.
              </p>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={showSendConfirm}
          onOpenChange={setShowSendConfirm}
          title="Send Campaign Now"
          description="This will send the email to all recipients in the selected audience immediately. This cannot be undone."
          confirmText="Send Now"
          cancelText="Cancel"
          onConfirm={handleSendNow}
          isLoading={isSending}
        />
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Eye, Save, Send, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { TiptapEmailEditor } from './TiptapEmailEditor';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { EmailTemplate } from '@/types';

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
      const response = await apiClient.getEmailTemplates({ limit: 100 });
      if (response.success && response.data) {
        setTemplates(response.data.filter((t) => t.isActive));
      }
    } catch {
      // Templates are optional, don't block
    }
  };

  const fetchCampaign = async () => {
    try {
      setIsFetching(true);
      const response = await apiClient.getEmailCampaign(id!);
      if (response.success && response.data) {
        const c = response.data;
        setName(c.name);
        setSubject(c.subject);
        setAudienceSegment(c.audienceSegment);
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
    if (templateId === 'none') {
      setSelectedTemplateId('');
      return;
    }
    setSelectedTemplateId(templateId);
    try {
      const response = await apiClient.getEmailTemplate(templateId);
      if (response.success && response.data) {
        const t = response.data;
        if (!subject) setSubject(t.subject);
        setHtmlContent(t.htmlContent);
        if (t.jsonContent) setJsonContent(t.jsonContent);
        toast.success('Template loaded');
      }
    } catch {
      toast.error('Failed to load template');
    }
  };

  const buildPayload = () => {
    let scheduledAt: string | undefined;
    if (enableSchedule && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    const recipients = audienceSegment === 'custom'
      ? customRecipients.split(',').map((e) => e.trim()).filter(Boolean)
      : undefined;

    return {
      name,
      subject,
      htmlContent,
      jsonContent,
      template: selectedTemplateId || undefined,
      audienceSegment,
      customRecipients: recipients,
      scheduledAt,
    };
  };

  const handleSaveDraft = async () => {
    if (!name.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.error('Please fill in name, subject, and content');
      return;
    }
    try {
      setIsSaving(true);
      const payload = buildPayload();
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
      toast.error('Please fill in name, subject, and content');
      return;
    }
    try {
      setIsSending(true);
      const payload = buildPayload();
      let campaignId = id;

      if (isEdit) {
        await apiClient.updateEmailCampaign(id!, payload);
      } else {
        const response = await apiClient.createEmailCampaign(payload);
        if (response.success && response.data) {
          campaignId = response.data._id;
        }
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

  if (isFetching) {
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/email/campaigns')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Campaigns
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Campaign' : 'Create Campaign'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!htmlContent}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                </DialogHeader>
                <div className="border rounded-lg overflow-auto max-h-[60vh]">
                  <iframe srcDoc={htmlContent} title="Preview" className="w-full h-[500px] border-0" sandbox="" />
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button onClick={() => setShowSendConfirm(true)} disabled={isSending} style={{ backgroundColor: '#F6511E' }} className="text-white">
              <Send className="w-4 h-4 mr-2" />
              Send Now
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input placeholder="e.g. January Newsletter" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Subject Line *</Label>
                  <Input placeholder="e.g. New arrivals just for you!" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Email Content *</CardTitle>
              </CardHeader>
              <CardContent>
                <TiptapEmailEditor
                  content={htmlContent}
                  jsonContent={jsonContent}
                  onChange={(html, json) => { setHtmlContent(html); setJsonContent(json); }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Selection */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplateId || 'none'} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Load from template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Audience */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={audienceSegment} onValueChange={setAudienceSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_customers">All Customers</SelectItem>
                    <SelectItem value="all_vendors">All Vendors</SelectItem>
                    <SelectItem value="birthday_this_month">Birthday This Month</SelectItem>
                    <SelectItem value="new_customers_30d">New Customers (30 days)</SelectItem>
                    <SelectItem value="inactive_customers_90d">Inactive (90 days)</SelectItem>
                    <SelectItem value="custom">Custom List</SelectItem>
                  </SelectContent>
                </Select>

                {audienceSegment === 'custom' && (
                  <div className="space-y-2">
                    <Label>Email Addresses</Label>
                    <Textarea
                      placeholder="Enter emails separated by commas..."
                      value={customRecipients}
                      onChange={(e) => setCustomRecipients(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      {customRecipients.split(',').filter((e) => e.trim()).length} recipients
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Schedule for later</Label>
                  <Switch checked={enableSchedule} onCheckedChange={setEnableSchedule} />
                </div>

                {enableSchedule && (
                  <div className="space-y-2">
                    <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ConfirmDialog
          open={showSendConfirm}
          onOpenChange={setShowSendConfirm}
          title="Send Campaign Now"
          description="This will send the email to all recipients in the selected audience segment immediately. This action cannot be undone."
          confirmText="Send Now"
          cancelText="Cancel"
          onConfirm={handleSendNow}
          isLoading={isSending}
        />
      </div>
    </PageTransition>
  );
}

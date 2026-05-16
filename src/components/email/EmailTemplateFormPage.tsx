import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Eye, Save, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { FormSkeleton } from '@/components/ui/skeletons';
import { EmailBuilder } from './EmailBuilder';
import type { EmailTemplateCategory } from '@/types';

const CATEGORY_OPTIONS: { value: EmailTemplateCategory; label: string; desc: string }[] = [
  { value: 'welcome',       label: 'Welcome',       desc: 'Sent to new signups' },
  { value: 'birthday',      label: 'Birthday',      desc: 'Sent on a customer\'s birthday' },
  { value: 'promotional',   label: 'Promotional',   desc: 'Sales, offers and discounts' },
  { value: 'newsletter',    label: 'Newsletter',    desc: 'Regular updates & news' },
  { value: 'transactional', label: 'Transactional', desc: 'Order confirmations etc.' },
  { value: 'custom',        label: 'Custom',        desc: 'General purpose template' },
];

export function EmailTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<EmailTemplateCategory>('custom');
  const [isActive, setIsActive] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [jsonContent, setJsonContent] = useState<Record<string, unknown> | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => { if (isEdit) fetchTemplate(); }, [id]);

  const fetchTemplate = async () => {
    try {
      setIsFetching(true);
      const r = await apiClient.getEmailTemplate(id!);
      if (r.success && r.data) {
        const t = r.data;
        setName(t.name); setSubject(t.subject); setCategory(t.category);
        setIsActive(t.isActive); setHtmlContent(t.htmlContent || '');
        if (t.jsonContent) setJsonContent(t.jsonContent);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load template');
      navigate('/email/templates');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim()) {
      toast.error('Please fill in Name and Subject'); return;
    }
    try {
      setIsSaving(true);
      const data = { name, subject, htmlContent, jsonContent, category, isActive };
      if (isEdit) {
        await apiClient.updateEmailTemplate(id!, data);
        toast.success('Template updated');
      } else {
        await apiClient.createEmailTemplate(data);
        toast.success('Template created');
      }
      navigate('/email/templates');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) return <FormSkeleton />;

  const selectedCat = CATEGORY_OPTIONS.find((c) => c.value === category);

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Template' : 'New Template'}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Design a reusable email layout</p>
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
            <Button size="sm" className="rounded-xl h-8 text-xs text-white" style={{ backgroundColor: '#F6511E' }} onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Template Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Template Name *</Label>
                  <Input placeholder="e.g. Welcome Email" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-9 text-sm border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Default Subject *</Label>
                  <Input placeholder="e.g. Welcome to Ebunly!" value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl h-9 text-sm border-gray-200" />
                </div>
              </div>
            </div>

            <div className="min-h-[800px]">
              <EmailBuilder initialContent={jsonContent} onChange={(html, json) => { setHtmlContent(html); setJsonContent(json); }} minHeight="800px" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-900">Settings</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as EmailTemplateCategory)}>
                    <SelectTrigger className="rounded-xl h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCat && (
                    <p className="text-[11px] text-gray-400">{selectedCat.desc}</p>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Active</p>
                    <p className="text-[11px] text-gray-400">Available for use in campaigns</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Personalization</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Use <code className="bg-amber-100 px-1 rounded font-mono">{'{{firstName}}'}</code> anywhere in your template to insert the recipient's first name.
              </p>
            </div>

            {/* Status chip */}
            <div className={`rounded-2xl border p-4 ${isActive ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <p className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  {isActive ? 'This template is active and can be used' : 'This template is inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Eye, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { PageTransition } from '@/lib/motion';
import { FormSkeleton } from '@/components/ui/skeletons';
import { EmailBuilder } from './EmailBuilder';
import type { EmailTemplateCategory } from '@/types';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setIsFetching(true);
      const response = await apiClient.getEmailTemplate(id!);
      if (response.success && response.data) {
        const t = response.data;
        setName(t.name);
        setSubject(t.subject);
        setCategory(t.category);
        setIsActive(t.isActive);
        setHtmlContent(t.htmlContent || '');
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
      toast.error('Please fill in Name and Subject');
      return;
    }

    try {
      setIsSaving(true);
      const data = { name, subject, htmlContent, jsonContent, category, isActive };

      if (isEdit) {
        await apiClient.updateEmailTemplate(id!, data);
        toast.success('Template updated successfully');
      } else {
        await apiClient.createEmailTemplate(data);
        toast.success('Template created successfully');
      }
      navigate('/email/templates');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <FormSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? 'Edit Template' : 'Create Template'}
              </h1>
              <p className="text-sm text-gray-500">Design your email template</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!htmlContent}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                </DialogHeader>
                <div className="border rounded-lg overflow-auto max-h-[70vh] bg-gray-100 p-4">
                  <div
                    className="mx-auto bg-white shadow-lg overflow-hidden"
                    style={{ width: '600px' }}
                  >
                    <iframe
                      srcDoc={htmlContent}
                      title="Email Preview"
                      className="w-full h-[600px] border-0"
                      sandbox=""
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              style={{ backgroundColor: '#F6511E' }}
              className="text-white"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Welcome Email"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g. Welcome to Ebunly!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="min-h-[800px]">
              <EmailBuilder
                initialContent={jsonContent}
                onChange={(html, json) => {
                  setHtmlContent(html);
                  setJsonContent(json);
                }}
                minHeight="800px"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(val) => setCategory(val as EmailTemplateCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> Use{' '}
                  <code className="bg-amber-100 px-1 rounded">{'{{firstName}}'}</code> in your
                  template to personalize with the recipient's name.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Edit, Trash2, ArrowLeft, Zap, Gift, UserPlus, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTransition } from '@/lib/motion';
import { AutomationRuleSkeleton } from '@/components/ui/skeletons';
import type { EmailAutomationRule, EmailTemplate } from '@/types';

const TRIGGER_INFO: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  registration: { label: 'New Registration', description: 'Triggered when a new customer registers', icon: <UserPlus className="w-5 h-5" /> },
  birthday: { label: 'Birthday', description: 'Triggered on the customer\'s birthday', icon: <Gift className="w-5 h-5" /> },
  inactive_30d: { label: 'Inactive (30 days)', description: 'Triggered when a customer is inactive for 30 days', icon: <Clock className="w-5 h-5" /> },
  first_purchase: { label: 'First Purchase', description: 'Triggered after the first purchase', icon: <Zap className="w-5 h-5" /> },
};

export function AutomationRulesPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<EmailAutomationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<EmailAutomationRule | null>(null);
  const [formName, setFormName] = useState('');
  const [formTrigger, setFormTrigger] = useState('registration');
  const [formTemplate, setFormTemplate] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formEnabled, setFormEnabled] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rulesRes, templatesRes] = await Promise.all([
        apiClient.getAutomationRules(),
        apiClient.getEmailTemplates({ limit: 100 }),
      ]);
      if (rulesRes.success && rulesRes.data) setRules(rulesRes.data);
      if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data.filter((t) => t.isActive));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (rule: EmailAutomationRule, enabled: boolean) => {
    try {
      await apiClient.updateAutomationRule(rule._id, { isEnabled: enabled } as Partial<EmailAutomationRule>);
      setRules((prev) => prev.map((r) => r._id === rule._id ? { ...r, isEnabled: enabled } : r));
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const openCreateForm = () => {
    setEditingRule(null);
    setFormName('');
    setFormTrigger('registration');
    setFormTemplate('');
    setFormSubject('');
    setFormEnabled(false);
    setShowForm(true);
  };

  const openEditForm = (rule: EmailAutomationRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormTrigger(rule.trigger);
    setFormTemplate(typeof rule.template === 'object' && rule.template ? rule.template._id : '');
    setFormSubject(rule.subject);
    setFormEnabled(rule.isEnabled);
    setShowForm(true);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      toast.error('Rule name is required');
      return;
    }
    try {
      setIsSavingForm(true);
      if (editingRule) {
        await apiClient.updateAutomationRule(editingRule._id, {
          name: formName,
          isEnabled: formEnabled,
          template: formTemplate || undefined,
          subject: formSubject,
        } as Partial<EmailAutomationRule>);
        toast.success('Rule updated');
      } else {
        await apiClient.createAutomationRule({
          name: formName,
          trigger: formTrigger,
          isEnabled: formEnabled,
          template: formTemplate || undefined,
          subject: formSubject,
        });
        toast.success('Rule created');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteAutomationRule(deleteId);
      toast.success('Rule deleted');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // Figure out which triggers already have rules
  const usedTriggers = rules.map((r) => r.trigger);
  const availableTriggers = Object.keys(TRIGGER_INFO).filter((t) => !usedTriggers.includes(t as any));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/email')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Email
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
              <p className="text-sm text-gray-500">Configure automated email triggers</p>
            </div>
          </div>
          {availableTriggers.length > 0 && (
            <Button onClick={openCreateForm} style={{ backgroundColor: '#F6511E' }} className="text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          )}
        </div>

        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <AutomationRuleSkeleton key={i} />
            ))}
          </>
        ) : rules.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Zap className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No automation rules</p>
              <p className="text-sm mb-4">Set up automated emails for events like registration and birthdays</p>
              <Button onClick={openCreateForm} style={{ backgroundColor: '#F6511E' }} className="text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const info = TRIGGER_INFO[rule.trigger] || TRIGGER_INFO.registration;
              return (
                <Card key={rule._id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: rule.isEnabled ? '#FEF3E2' : '#F3F4F6', color: rule.isEnabled ? '#F6511E' : '#9CA3AF' }}>
                          {info.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{rule.name}</CardTitle>
                          <CardDescription className="text-xs">{info.description}</CardDescription>
                        </div>
                      </div>
                      <Switch checked={rule.isEnabled} onCheckedChange={(v) => handleToggle(rule, v)} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Trigger: <Badge variant="outline" className="ml-1">{info.label}</Badge></p>
                        {rule.template && typeof rule.template === 'object' && (
                          <p>Template: <span className="font-medium">{rule.template.name}</span></p>
                        )}
                        {rule.lastRunAt && (
                          <p className="text-xs text-gray-400">Last run: {new Date(rule.lastRunAt).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditForm(rule)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(rule._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Welcome Email" />
              </div>

              {!editingRule && (
                <div className="space-y-2">
                  <Label>Trigger *</Label>
                  <Select value={formTrigger} onValueChange={setFormTrigger}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableTriggers.map((t) => (
                        <SelectItem key={t} value={t}>{TRIGGER_INFO[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Email Template (optional)</Label>
                <Select value={formTemplate || 'none'} onValueChange={(v) => setFormTemplate(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template (use default)</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject Override</Label>
                <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Leave blank to use template subject" />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSaveForm} disabled={isSavingForm} style={{ backgroundColor: '#F6511E' }} className="text-white">
                {isSavingForm && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Rule" description="Are you sure you want to delete this automation rule?" confirmText="Delete" cancelText="Cancel" onConfirm={handleDelete} variant="destructive" isLoading={isDeleting} />
      </div>
    </PageTransition>
  );
}

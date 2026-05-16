import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Mail, FileText, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTransition } from '@/lib/motion';
import { EmailTemplateGridSkeleton } from '@/components/ui/skeletons';
import type { EmailTemplate } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  welcome:       { label: 'Welcome',       color: 'text-green-700',  bg: 'bg-green-50' },
  birthday:      { label: 'Birthday',      color: 'text-pink-700',   bg: 'bg-pink-50' },
  promotional:   { label: 'Promotional',   color: 'text-orange-700', bg: 'bg-orange-50' },
  newsletter:    { label: 'Newsletter',    color: 'text-blue-700',   bg: 'bg-blue-50' },
  transactional: { label: 'Transactional', color: 'text-purple-700', bg: 'bg-purple-50' },
  custom:        { label: 'Custom',        color: 'text-gray-600',   bg: 'bg-gray-100' },
};

export function EmailTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getEmailTemplates({
        page, limit: 12,
        search: search || undefined,
        category: category || undefined,
      });
      if (response.success && response.data) {
        setTemplates(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [page, search, category]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteEmailTemplate(deleteId);
      toast.success('Template deleted');
      setDeleteId(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
            <p className="text-sm text-gray-500 mt-0.5">Reusable email designs for campaigns & automation</p>
          </div>
          <Button className="rounded-xl text-sm text-white h-9" style={{ backgroundColor: '#F6511E' }} onClick={() => navigate('/email/templates/create')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
            />
          </div>
          <Select value={category || 'all'} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44 h-9 rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <EmailTemplateGridSkeleton />
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">No templates found</p>
            <p className="text-xs text-gray-400 mb-4">Create your first template to get started</p>
            <Button className="rounded-xl text-xs text-white h-8" style={{ backgroundColor: '#F6511E' }} onClick={() => navigate('/email/templates/create')}>
              <Plus className="w-3 h-3 mr-1" /> Create Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {templates.map((tpl, idx) => {
                const cat = CATEGORY_CONFIG[tpl.category] || CATEGORY_CONFIG.custom;
                return (
                  <motion.div
                    key={tpl._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Preview area */}
                    <div className="h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                      <FileText className="w-10 h-10 text-gray-200" />
                      {/* Category pill */}
                      <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                      {/* Status dot */}
                      <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${tpl.isActive ? 'bg-green-400' : 'bg-gray-300'}`} title={tpl.isActive ? 'Active' : 'Inactive'} />
                    </div>

                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tpl.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{tpl.subject}</p>
                      <p className="text-[10px] text-gray-300 mt-2">{new Date(tpl.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Actions — visible on hover */}
                    <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs rounded-lg"
                        onClick={() => navigate(`/email/templates/${tpl._id}/edit`)}
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg text-red-500 hover:bg-red-50 border-red-100"
                        onClick={() => setDeleteId(tpl._id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Template"
          description="Are you sure you want to delete this template? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </PageTransition>
  );
}

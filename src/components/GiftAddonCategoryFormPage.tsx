import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, X, Loader2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GiftAddonCategoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [filterLabel, setFilterLabel] = useState('Choose an option');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.getAddonCategories().then((res) => {
      const list = (res.data as any[]) || [];
      const cat = list.find((c: any) => c._id === id);
      if (!cat) { toast.error('Category not found'); navigate('/gift-addons'); return; }
      setName(cat.name || '');
      setLabel(cat.label || '');
      setFilterLabel(cat.filterLabel || 'Choose an option');
      setFilterTags(cat.filterTags || []);
      setSortOrder(cat.sortOrder ?? 0);
    }).catch(() => toast.error('Failed to load category'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !filterTags.includes(t)) setFilterTags((p) => [...p, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setFilterTags((p) => p.filter((x) => x !== t));

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setIsSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        label: label.trim() || `+ ${name.trim()}`,
        filterLabel: filterLabel.trim() || 'Choose an option',
        filterTags,
        sortOrder,
      };
      if (isEdit) {
        await apiClient.updateAddonCategory(id!, data);
        toast.success('Category updated');
      } else {
        await apiClient.createAddonCategory(data);
        toast.success(`"${data.name}" created`);
      }
      navigate('/gift-addons');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-9 rounded-xl" />
            <Skeleton className="h-9 rounded-xl" />
          </div>
          <Skeleton className="h-9 rounded-xl" />
          <Skeleton className="h-9 rounded-xl" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Category' : 'New Category'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isEdit ? 'Update this gift add-on category' : 'Add a new add-on category, e.g. Flowers, Card, Teddy'}
        </p>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6"
      >
        {/* Icon preview */}
        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#FEF3F0' }}>
            <Tag className="w-5 h-5" style={{ color: '#F6511E' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{name || 'Category name'}</p>
            <p className="text-xs text-gray-400">{label || `+ ${name || '…'}`}</p>
          </div>
        </div>

        {/* Name + Label */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Flowers"
              className="rounded-xl h-10"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">
              Pill Label
              <span className="ml-1 font-normal text-gray-400">shown on the add-on pill</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`+ ${name || 'Flowers'}`}
              className="rounded-xl h-10"
            />
          </div>
        </div>

        {/* Filter heading + Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">
              Filter Heading
              <span className="ml-1 font-normal text-gray-400">above the filter tabs</span>
            </Label>
            <Input
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              placeholder="Choose a design"
              className="rounded-xl h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Sort Order</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="rounded-xl h-10"
              min={0}
            />
          </div>
        </div>

        {/* Filter tags */}
        <div className="space-y-2.5">
          <Label className="text-xs text-gray-500">
            Filter Tabs
            <span className="ml-1 font-normal text-gray-400">predefined tab options shown on the product page</span>
          </Label>

          <AnimatePresence>
            {filterTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-2"
              >
                {filterTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{ background: '#FEF3F0', borderColor: '#F6511E33', color: '#F6511E' }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Type a tab name and press Enter…"
              className="rounded-xl h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              className="rounded-xl h-10 px-3 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[11px] text-gray-400">
            e.g. "Roses", "Tulips", "Sunflowers". Items in this category can be tagged with these.
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/gift-addons')}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="text-white rounded-xl px-6"
          style={{ backgroundColor: '#F6511E' }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </div>
  );
}

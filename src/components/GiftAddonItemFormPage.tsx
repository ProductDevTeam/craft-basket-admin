import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X, Package, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export function GiftAddonItemFormPage() {
  const navigate = useNavigate();
  const { categoryId, itemId } = useParams<{ categoryId?: string; itemId?: string }>();
  const isEdit = !!itemId;

  const [category, setCategory] = useState<{ name: string; filterTags: string[] } | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hasMessage, setHasMessage] = useState(false);
  const [messageOptional, setMessageOptional] = useState(true);
  const [messageMaxLength, setMessageMaxLength] = useState(200);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve the category ID whether creating or editing
  const resolvedCategoryId = categoryId || '';

  useEffect(() => {
    const load = async () => {
      try {
        // Load all categories to find the one we need
        const catRes = await apiClient.getAddonCategories();
        const cats = (catRes.data as any[]) || [];

        if (isEdit && itemId) {
          const cat = cats.find((c: any) => c.id === resolvedCategoryId);
          setCategory({ name: cat?.name || '', filterTags: cat?.filterTags || [] });

          const itemsRes = await apiClient.getAddonItems(resolvedCategoryId);
          const items = (itemsRes.data as any[]) || [];
          const item = items.find((i: any) => i.id === itemId);
          if (!item) { toast.error('Item not found'); navigate('/gift-addons'); return; }
          setName(item.name || '');
          setPrice(item.price?.toString() || '');
          setTags(item.tags || []);
          setHasMessage(item.hasMessage ?? false);
          setMessageOptional(item.messageOptional ?? true);
          setMessageMaxLength(item.messageMaxLength ?? 200);
          setIsActive(item.isActive ?? true);
          setSortOrder(item.sortOrder ?? 0);
          setImagePreview(item.image?.url || null);
        } else {
          const cat = cats.find((c: any) => c.id === resolvedCategoryId);
          setCategory({ name: cat?.name || '', filterTags: cat?.filterTags || [] });
        }
      } catch {
        toast.error('Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [itemId, resolvedCategoryId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleTag = (t: string) =>
    setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!price) { toast.error('Price is required'); return; }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('price', price);
      fd.append('tags', JSON.stringify(tags));
      fd.append('hasMessage', String(hasMessage));
      fd.append('messageOptional', String(messageOptional));
      fd.append('messageMaxLength', String(messageMaxLength));
      fd.append('isActive', String(isActive));
      fd.append('sortOrder', String(sortOrder));
      if (image) fd.append('image', image);

      if (isEdit && itemId) {
        await apiClient.updateAddonItem(itemId, fd);
        toast.success('Item updated');
      } else {
        await apiClient.createAddonItem(resolvedCategoryId, fd);
        toast.success(`"${name.trim()}" added`);
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
          <Skeleton className="h-32 w-32 rounded-xl" />
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
          {isEdit ? 'Edit Item' : 'Add Item'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {category?.name && (
            <span>
              Under <span className="font-medium text-gray-700">{category.name}</span>
              {' · '}
            </span>
          )}
          {isEdit ? 'Update this add-on item' : 'Add a new item to this category'}
        </p>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6"
      >
        {/* Name + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Red roses"
              className="rounded-xl h-10"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Price (₦) *</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
              className="rounded-xl h-10"
            />
          </div>
        </div>

        {/* Image */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Image</Label>
          {imagePreview ? (
            <div className="relative h-36 w-36 rounded-xl overflow-hidden border border-gray-200 group">
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-36 w-36 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-gray-50/50">
              <Package className="w-6 h-6 text-gray-300 mb-1.5" />
              <span className="text-xs text-gray-400 font-medium">Upload image</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Filter tags */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">
            Filter Tag
            <span className="ml-1 font-normal text-gray-400">which filter tabs this item appears under</span>
          </Label>
          {!category?.filterTags.length ? (
            <p className="text-xs text-gray-400 italic">
              No filter tabs defined for this category yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {category.filterTags.map((t) => {
                const selected = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? 'text-white border-transparent'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={selected ? { backgroundColor: '#F6511E', borderColor: '#F6511E' } : {}}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Your Message */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Switch checked={hasMessage} onCheckedChange={setHasMessage} />
            <div>
              <Label className="text-sm text-gray-700 cursor-pointer">Has "Your Message" field</Label>
              <p className="text-xs text-gray-400 mt-0.5">Shows a text area for customers to add a personal message</p>
            </div>
          </div>

          {hasMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="ml-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Switch checked={messageOptional} onCheckedChange={setMessageOptional} />
                <Label className="text-sm text-gray-600 cursor-pointer">Message is optional</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Character limit</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={messageMaxLength}
                    onChange={(e) => setMessageMaxLength(parseInt(e.target.value) || 200)}
                    className="rounded-xl h-10 w-32"
                    min={10}
                    max={1000}
                  />
                  <span className="text-xs text-gray-400">e.g. shown as "0 / {messageMaxLength}"</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sort + Active */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
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
          <div className="flex flex-col justify-end pb-0.5">
            <div className="flex items-center gap-2.5">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm text-gray-600">{isActive ? 'Active' : 'Hidden'}</span>
            </div>
          </div>
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
          disabled={!name.trim() || !price || isSubmitting}
          className="text-white rounded-xl px-6"
          style={{ backgroundColor: '#F6511E' }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </div>
  );
}

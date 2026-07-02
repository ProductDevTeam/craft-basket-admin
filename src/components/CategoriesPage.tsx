import React, { useState, useEffect, useMemo } from 'react';
import { CategoriesPageSkeleton } from '@/components/ui/skeletons';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  X,
  Upload,
  ChevronRight,
  Check,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  pageDescription?: string;
  image?: { url: string; publicId: string };
  icon?: { url: string; publicId: string };
  cardBg?: string;
  mobileBg?: string;
  featuredOnHomepage?: boolean;
  parent?: { _id: string; name: string; slug: string } | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Inline Form Component ──────────────────────────────────────────────────
interface InlineFormProps {
  parentId?: string;
  editingCategory?: Category | null;
  onSave: () => void;
  onCancel: () => void;
  showImage?: boolean;
}

function InlineForm({ parentId, editingCategory, onSave, onCancel, showImage }: InlineFormProps) {
  const isEdit = !!editingCategory;
  const [name, setName] = useState(editingCategory?.name || '');
  const [description, setDescription] = useState(editingCategory?.description || '');
  const [pageDescription, setPageDescription] = useState(editingCategory?.pageDescription || '');
  const [sortOrder, setSortOrder] = useState(editingCategory?.sortOrder || 0);
  const [isActive, setIsActive] = useState(editingCategory?.isActive ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editingCategory?.image?.url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (pageDescription.trim()) formData.append('pageDescription', pageDescription.trim());
      if (parentId) formData.append('parent', parentId);
      formData.append('isActive', String(isActive));
      formData.append('sortOrder', String(sortOrder));
      if (image) formData.append('image', image);

      if (isEdit && editingCategory) {
        await apiClient.updateCategory(editingCategory._id, formData);
        toast.success(`"${name}" updated`);
      } else {
        await apiClient.createCategory(formData);
        toast.success(`"${name}" created`);
      }
      onSave();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {isEdit ? `Edit "${editingCategory?.name}"` : parentId ? 'New Subcategory' : 'New Category'}
          </span>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={parentId ? 'e.g. Men Fashion' : 'e.g. Fashion & Accessories'}
              className="rounded-xl h-9 text-sm"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleSubmit(); }}
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1">Card Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short teaser shown on the category card — e.g. Handbags, Backpacks & more"
              className="rounded-xl text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Page description — subcategories only */}
          {(parentId || showImage) && (
            <div>
              <Label className="text-xs text-gray-500 mb-1">Page Description</Label>
              <Textarea
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                placeholder="Richer text shown at the top of the category landing page..."
                className="rounded-xl text-sm resize-none"
                rows={3}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Shown as the hero description when users click through to this subcategory page.
              </p>
            </div>
          )}

          {/* Image — only for subcategories */}
          {showImage && (
            <div>
              <Label className="text-xs text-gray-500 mb-1">Cover Image</Label>
              {imagePreview ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-gray-50/50">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          )}

          {!parentId && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-gray-500 mb-1">Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="rounded-xl h-9 text-sm"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Switch id="inline-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="inline-active" className="text-xs text-gray-500 cursor-pointer">Active</Label>
              </div>
            </div>
          )}

          {parentId && (
            <div className="flex items-center gap-2">
              <Switch id="inline-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="inline-active" className="text-xs text-gray-500 cursor-pointer">Active</Label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-xl text-xs h-8">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="text-white rounded-xl text-xs h-8"
            style={{ backgroundColor: '#F6511E' }}
          >
            {isSubmitting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [showAddParent, setShowAddParent] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingParent, setEditingParent] = useState<Category | null>(null);
  const [editingChild, setEditingChild] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getCategories({ limit: 200 });
      setCategories(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const parentCategories = useMemo(
    () => categories
      .filter((c) => !c.parent)
      .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((c) => statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, searchQuery, statusFilter]
  );

  const selectedParent = parentCategories.find((p) => p._id === selectedParentId);

  const childCategories = useMemo(
    () =>
      categories
        .filter((c) => {
          if (!c.parent || !selectedParentId) return false;
          const pid = typeof c.parent === 'object' ? c.parent._id : c.parent;
          return pid === selectedParentId;
        })
        .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((c) => statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [categories, selectedParentId, searchQuery, statusFilter]
  );

  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;

  // Auto-select first parent
  useEffect(() => {
    if (!selectedParentId && parentCategories.length > 0) {
      setSelectedParentId(parentCategories[0]._id);
    }
  }, [parentCategories, selectedParentId]);

  const handleFormSave = () => {
    setShowAddParent(false);
    setShowAddChild(false);
    setEditingParent(null);
    setEditingChild(null);
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingId(deleteTarget._id);
    try {
      await apiClient.deleteCategory(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" deleted`);
      if (deleteTarget._id === selectedParentId) {
        setSelectedParentId(null);
      }
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your storefront categories and subcategories
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="pl-9 h-10 rounded-xl border-gray-200 text-sm w-full"
            />
          </div>
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5 shrink-0">
            {[
              { value: 'all' as const, label: 'All', count: totalCount },
              { value: 'active' as const, label: 'Active', count: activeCount },
              { value: 'inactive' as const, label: 'Inactive', count: inactiveCount },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === f.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
                <span className="ml-1 text-[10px] text-gray-400">
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      {isLoading ? (
        <CategoriesPageSkeleton />
      ) : parentCategories.length === 0 && (searchQuery || statusFilter !== 'all') ? (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 font-medium">
            No {statusFilter !== 'all' ? statusFilter : ''} categories match your search
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* ─── Left: Parent Categories ──────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</span>
              <button
                onClick={() => { setShowAddParent(true); setEditingParent(null); }}
                className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#F6511E' }}
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            {/* Add Parent Form (inline) */}
            <AnimatePresence>
              {(showAddParent || editingParent) && (
                <InlineForm
                  editingCategory={editingParent}
                  onSave={handleFormSave}
                  onCancel={() => { setShowAddParent(false); setEditingParent(null); }}
                />
              )}
            </AnimatePresence>

            {/* Parent List */}
            {parentCategories.length === 0 && !showAddParent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderTree className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">No categories yet</p>
                <p className="text-xs text-gray-400 mb-4">Create your first storefront category</p>
                <Button
                  size="sm"
                  onClick={() => setShowAddParent(true)}
                  className="text-white rounded-xl text-xs"
                  style={{ backgroundColor: '#F6511E' }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Category
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {parentCategories.map((cat) => {
                  const isSelected = cat._id === selectedParentId;
                  const childCount = categories.filter((c) => {
                    if (!c.parent) return false;
                    const pid = typeof c.parent === 'object' ? c.parent._id : c.parent;
                    return pid === cat._id;
                  }).length;

                  return (
                    <motion.div
                      key={cat._id}
                      layout
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#F6511E]/5 border border-[#F6511E]/20'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedParentId(cat._id);
                        setShowAddChild(false);
                        setEditingChild(null);
                      }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-[#F6511E]/10 text-[#F6511E]' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                            {cat.name}
                          </p>
                          {cat.featuredOnHomepage && (
                            <Star className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {childCount} subcategor{childCount === 1 ? 'y' : 'ies'}
                          {!cat.isActive && ' · Inactive'}
                        </p>
                      </div>

                      {/* Actions on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingParent(cat); setShowAddParent(false); }}
                          className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Edit className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat); }}
                          className="p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
                        isSelected ? 'text-[#F6511E]' : 'text-gray-300'
                      }`} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Right: Subcategories ─────────────────────────────────── */}
          <div className="min-h-[400px]">
            {selectedParent ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedParent.name}</h2>
                    {selectedParent.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{selectedParent.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setShowAddChild(true); setEditingChild(null); }}
                    className="text-white rounded-xl text-xs h-8"
                    style={{ backgroundColor: '#F6511E' }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Subcategory
                  </Button>
                </div>

                {/* Add Child Form (inline) */}
                <AnimatePresence>
                  {(showAddChild || editingChild) && (
                    <InlineForm
                      parentId={selectedParentId!}
                      editingCategory={editingChild}
                      onSave={handleFormSave}
                      onCancel={() => { setShowAddChild(false); setEditingChild(null); }}
                      showImage
                    />
                  )}
                </AnimatePresence>

                {/* Subcategory Grid */}
                {childCategories.length === 0 && !showAddChild ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                      {searchQuery || statusFilter !== 'all' 
                        ? `No ${statusFilter !== 'all' ? statusFilter : ''} subcategories match`
                        : 'No subcategories yet'}
                    </p>
                    {!(searchQuery || statusFilter !== 'all') && (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => setShowAddChild(true)}
                        className="text-[#F6511E] text-xs h-8 mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Subcategory
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    <AnimatePresence>
                      {childCategories.map((child, idx) => (
                        <motion.div
                          key={child._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <Card className="group overflow-hidden border-gray-200 shadow-none hover:shadow-md transition-all cursor-default">
                            {/* Image */}
                            {child.image?.url ? (
                              <div className="h-32 overflow-hidden">
                                <img
                                  src={child.image.url}
                                  alt={child.name}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <div className="h-32 bg-gray-50 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-200" />
                              </div>
                            )}

                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {child.name}
                                  </p>
                                  {child.description && (
                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                      {child.description}
                                    </p>
                                  )}
                                  {(child as any).pageDescription ? (
                                    <p className="text-[10px] text-blue-400 mt-0.5 line-clamp-1">
                                      Page: {(child as any).pageDescription}
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-amber-400 mt-0.5">
                                      No page description
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      variant="secondary"
                                      className={`text-[10px] px-1.5 py-0 ${
                                        child.isActive
                                          ? 'bg-green-50 text-green-600 border-green-200'
                                          : 'bg-gray-100 text-gray-400'
                                      }`}
                                    >
                                    {child.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => { setEditingChild(child); setShowAddChild(false); }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit className="w-3 h-3 text-gray-400" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(child)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <FolderTree className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-base font-medium text-gray-400">
                  {parentCategories.length > 0 ? 'Select a category' : 'Create a category to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteTarget?.parent ? 'subcategory' : 'category and all its subcategories'}.
              Products assigned to it will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingId && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

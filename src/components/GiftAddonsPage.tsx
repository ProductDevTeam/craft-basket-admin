import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Edit2, Trash2, Loader2, Gift, ChevronDown, ChevronUp,
  MoreHorizontal, Package, Tag, Eye, EyeOff, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddonCategory {
  id: string;
  name: string;
  label: string;
  filterLabel: string;
  filterTags: string[];
  isActive: boolean;
  sortOrder: number;
}

interface AddonItem {
  id: string;
  category: string;
  name: string;
  price: number;
  image?: { url: string; publicId: string };
  tags: string[];
  hasMessage: boolean;
  isActive: boolean;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-3 w-48 rounded-full" />
          </div>
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, onEdit, onDelete }: {
  item: AddonItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`group relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-opacity ${!item.isActive ? 'opacity-50' : ''}`}>
      {item.image?.url ? (
        <img src={item.image.url} alt={item.name} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
          <Package className="w-7 h-7 text-gray-200" />
        </div>
      )}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {!item.isActive && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-800/80 text-white backdrop-blur-sm">
            Hidden
          </span>
        )}
        {item.hasMessage && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-600 border border-gray-200 backdrop-blur-sm">
            <MessageSquare className="w-2.5 h-2.5" /> Message
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">₦{item.price.toLocaleString()}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t}</span>
            ))}
          </div>
        )}
      </div>
      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white border border-gray-200 transition-colors"
        >
          <Edit2 className="w-3 h-3 text-gray-600" />
        </button>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-red-50 border border-gray-200 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ cat, index, onCategoryUpdated, onCategoryDeleted }: {
  cat: AddonCategory;
  index: number;
  onCategoryUpdated: (c: AddonCategory) => void;
  onCategoryDeleted: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<AddonItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AddonItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(false);
  const [togglingCat, setTogglingCat] = useState(false);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await apiClient.getAddonItems(cat.id);
      setItems((res.data as AddonItem[]) || []);
    } catch { toast.error('Failed to load items'); }
    finally { setLoadingItems(false); }
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && items.length === 0) fetchItems();
  };

  const handleToggle = async () => {
    setTogglingCat(true);
    onCategoryUpdated({ ...cat, isActive: !cat.isActive }); // optimistic
    try {
      const res = await apiClient.updateAddonCategory(cat.id, { isActive: !cat.isActive });
      onCategoryUpdated(res.data as AddonCategory);
    } catch {
      toast.error('Failed to toggle');
      onCategoryUpdated({ ...cat }); // revert
    } finally { setTogglingCat(false); }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    setDeletingItem(true);
    try {
      await apiClient.deleteAddonItem(deleteItem.id);
      setItems((p) => p.filter((i) => i.id !== deleteItem.id));
      toast.success('Item deleted');
      setDeleteItem(null);
    } catch { toast.error('Failed to delete item'); }
    finally { setDeletingItem(false); }
  };

  const handleDeleteCat = async () => {
    try {
      await apiClient.deleteAddonCategory(cat.id);
      onCategoryDeleted(cat.id);
      toast.success(`"${cat.name}" deleted`);
    } catch { toast.error('Failed to delete category'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-opacity ${!cat.isActive ? 'opacity-60' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEF3F0' }}>
          <Tag className="w-4 h-4" style={{ color: '#F6511E' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {cat.label}
            {cat.filterTags?.length > 0 && (
              <> · <span className="text-gray-500">{cat.filterTags.join(', ')}</span></>
            )}
          </p>
        </div>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => navigate(`/gift-addons/category/${cat.id}/edit`)}>
              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit category
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteCatConfirm(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Eye toggle */}
        <button
          onClick={handleToggle}
          disabled={togglingCat}
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
            cat.isActive ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-white hover:bg-gray-400'
          }`}
        >
          {togglingCat
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : cat.isActive
              ? <Eye className="w-3.5 h-3.5" />
              : <EyeOff className="w-3.5 h-3.5" />
          }
        </button>

        {/* Expand */}
        <button
          onClick={handleExpand}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
        >
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
      </div>

      {/* Items panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-5 space-y-4">
              {loadingItems ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
              ) : (
                <>
                  {items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onEdit={() => navigate(`/gift-addons/category/${cat.id}/item/${item.id}/edit`)}
                          onDelete={() => setDeleteItem(item)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#FEF3F0' }}>
                        <Package className="w-5 h-5" style={{ color: '#F6511E' }} />
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-1">No items yet</p>
                      <p className="text-xs text-gray-400">Add your first item to this category</p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/gift-addons/category/${cat.id}/item/new`)}
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#F6511E' }}
                  >
                    <Plus className="w-4 h-4" /> Add item
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete item dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This item will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} disabled={deletingItem} className="bg-red-600 hover:bg-red-700 text-white">
              {deletingItem && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete category dialog */}
      <AlertDialog open={deleteCatConfirm} onOpenChange={setDeleteCatConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
            <AlertDialogDescription>All items in this category will also be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCat} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function GiftAddonsPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AddonCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getAddonCategories();
      const list: AddonCategory[] = Array.isArray(res.data)
        ? (res.data as AddonCategory[]).filter(Boolean)
        : [];
      setCategories(list.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch { toast.error('Failed to load gift add-ons'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Add-ons</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide add-ons shown on every product page</p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/gift-addons/category/new')}
          className="text-white rounded-xl h-9 text-sm shrink-0"
          style={{ backgroundColor: '#F6511E' }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Category
        </Button>
      </div>

      {/* Body */}
      {isLoading ? (
        <PageSkeleton />
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#FEF3F0' }}>
            <Gift className="w-8 h-8" style={{ color: '#F6511E' }} />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No add-on categories yet</p>
          <p className="text-xs text-gray-400 mb-4">Create your first one, e.g. Flowers, Card, Teddy</p>
          <Button
            size="sm"
            onClick={() => navigate('/gift-addons/category/new')}
            className="text-white rounded-xl h-8 text-xs"
            style={{ backgroundColor: '#F6511E' }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <CategorySection
              key={cat.id}
              cat={cat}
              index={i}
              onCategoryUpdated={(updated) =>
                setCategories((p) => p.map((c) => c.id === updated.id ? updated : c))}
              onCategoryDeleted={(id) =>
                setCategories((p) => p.filter((c) => c.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

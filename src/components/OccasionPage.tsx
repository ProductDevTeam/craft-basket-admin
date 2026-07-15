import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Plus, Edit, Trash2, Loader2, Gift, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OccasionGridSkeleton } from '@/components/ui/skeletons';
import { revalidateOccasions } from '@/lib/revalidate';
import type { Category } from './CategoriesPage';


// ─── Occasion Card ────────────────────────────────────────────────────────────

interface OccasionCardProps {
  occasion: Category;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  isReordering: boolean;
  isToggling: boolean;
}

function OccasionCard({ occasion, isFirst, isLast, onEdit, onRemove, onMoveUp, onMoveDown, onToggle, isReordering, isToggling }: OccasionCardProps) {
  const iconEmoji = (occasion as any).iconEmoji as string | undefined;
  const isActive = occasion.isActive !== false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`group transition-opacity ${!isActive ? 'opacity-50' : ''}`}
    >
      <div
        className="rounded-2xl p-2 overflow-hidden"
        style={{ backgroundColor: occasion.cardBg || '#F3F4F6' }}
      >
        {/* Image — aspect-4/3 */}
        <div className="relative w-full" style={{ paddingBottom: '75%' }}>
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-200">
            {occasion.image?.url ? (
              <img src={occasion.image.url} alt={occasion.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-gray-300" />
              </div>
            )}

            {/* Live/Off badge — always visible */}
            <button
              onClick={onToggle}
              disabled={isToggling}
              className={`absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                isActive
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isActive ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </button>

            {/* Hover actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                <Edit className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button onClick={onRemove} className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
              </button>
            </div>
          </div>

          {/* Emoji icon badge — bottom-0 left-3 translate-y-1/2 */}
          <div className="absolute bottom-0 left-3 translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 z-10">
            {iconEmoji ? (
              <span className="text-2xl leading-none">{iconEmoji}</span>
            ) : (
              <Gift className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>

        {/* Text + reorder */}
        <div className="pt-9 px-3 pb-3 flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] text-[#0C0000] leading-snug truncate">{occasion.name}</p>
            {occasion.description && (
              <p className="text-[12px] text-black/60 mt-1 truncate">{occasion.description}</p>
            )}
          </div>

          {/* Sort arrows */}
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={onMoveUp}
              disabled={isFirst || isReordering}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/10 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast || isReordering}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/10 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OccasionPage() {
  const navigate = useNavigate();
  const [occasions, setOccasions] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<Category | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchOccasions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getCategories({ featuredOnHomepage: true, limit: 50 });
      const featured: Category[] = res.data || [];
      setOccasions(featured.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load occasions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOccasions(); }, []);

  const handleToggle = async (occ: Category) => {
    setTogglingId(occ._id);
    // Optimistic update
    setOccasions((prev) =>
      prev.map((o) => o._id === occ._id ? { ...o, isActive: !o.isActive } : o)
    );
    try {
      const formData = new FormData();
      formData.append('isActive', String(occ.isActive === false ? true : false));
      await apiClient.updateCategory(occ._id, formData);
      revalidateOccasions();
    } catch (err: any) {
      toast.error('Failed to update');
      fetchOccasions(); // restore on error
    } finally {
      setTogglingId(null);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= occasions.length) return;

    // Optimistic update
    const reordered = [...occasions];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    // Assign clean 0-based sortOrders
    reordered.forEach((occ, i) => { occ.sortOrder = i; });
    setOccasions(reordered);

    setIsReordering(true);
    try {
      const itemA = reordered[index];
      const itemB = reordered[swapIndex];
      const fA = new FormData(); fA.append('sortOrder', String(itemA.sortOrder));
      const fB = new FormData(); fB.append('sortOrder', String(itemB.sortOrder));
      await Promise.all([
        apiClient.updateCategory(itemA._id, fA),
        apiClient.updateCategory(itemB._id, fB),
      ]);
    } catch (err: any) {
      toast.error('Failed to reorder');
      fetchOccasions(); // restore
    } finally {
      setIsReordering(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      const formData = new FormData();
      formData.append('featuredOnHomepage', 'false');
      await apiClient.updateCategory(removeTarget._id, formData);
      toast.success(`"${removeTarget.name}" removed from homepage`);
      revalidateOccasions();
      setRemoveTarget(null);
      fetchOccasions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Occasions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage occasions
            {occasions.length > 0 && (
              <span className="ml-2 font-medium">
                · <span className="text-green-600">{Math.min(occasions.filter(o => o.isActive !== false).length, 5)} / 5</span> live
              </span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/occasion/new')}
          className="text-white rounded-xl text-sm h-9 shrink-0"
          style={{ backgroundColor: '#F6511E' }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Occasion
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <OccasionGridSkeleton count={5} />
      ) : occasions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <Gift className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">No occasions yet</p>
          <p className="text-xs text-gray-400">Create your first homepage occasion</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {occasions.map((occ, i) => (
                <OccasionCard
                  key={occ._id}
                  occasion={occ}
                  isFirst={i === 0}
                  isLast={i === occasions.length - 1}
                  onEdit={() => navigate(`/occasion/${occ._id}/edit`)}
                  onRemove={() => setRemoveTarget(occ)}
                  onMoveUp={() => handleReorder(i, 'up')}
                  onMoveDown={() => handleReorder(i, 'down')}
                  onToggle={() => handleToggle(occ)}
                  isReordering={isReordering}
                  isToggling={togglingId === occ._id}
                />
              ))}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{removeTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from the homepage. The category itself won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700 text-white">
              {isRemoving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

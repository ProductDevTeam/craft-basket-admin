import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import type { Category } from './CategoriesPage';

export interface CategoryFormData {
  name: string;
  description: string;
  parent: string;
  isActive: boolean;
  sortOrder: number;
  image: File | null;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  parentCategories: Category[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  parentCategories,
  onSubmit,
  isSubmitting,
}: CategoryDialogProps) {
  const isEdit = !!category;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Reset form when dialog opens / category changes
  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setDescription(category.description || '');
        setParent(
          category.parent
            ? typeof category.parent === 'object'
              ? category.parent._id
              : (category.parent as string)
            : ''
        );
        setIsActive(category.isActive);
        setSortOrder(category.sortOrder);
        setImage(null);
        setImagePreview(category.image?.url || null);
      } else {
        setName('');
        setDescription('');
        setParent('');
        setIsActive(true);
        setSortOrder(0);
        setImage(null);
        setImagePreview(null);
      }
    }
  }, [open, category]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), parent, isActive, sortOrder, image });
  };

  // Filter out the current category from parent options (can't be its own parent)
  const availableParents = parentCategories.filter((p) => p._id !== category?._id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the category details below.'
                : 'Fill in the details to create a new category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fashion & Accessories"
                className="rounded-xl"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for this category"
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select value={parent} onValueChange={setParent}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {availableParents.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                Leave as "None" for a top-level category, or pick a parent to nest underneath.
              </p>
            </div>

            {/* Image Upload — only for subcategories */}
            {parent && parent !== 'none' && (
              <div className="space-y-2">
                <Label>Subcategory Image</Label>
                {imagePreview ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 group">
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-gray-50/50">
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-400">
                  This image will be shown on the storefront category cards.
                </p>
              </div>
            )}

            {/* Sort Order + Active */}
            <div className="flex items-center gap-6">
              <div className="space-y-2 flex-1">
                <Label htmlFor="cat-sort">Sort Order</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="rounded-xl"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="cat-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="cat-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="text-white rounded-xl"
              style={{ backgroundColor: '#F6511E' }}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

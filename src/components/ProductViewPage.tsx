import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Trash2,
  Video as VideoIcon,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ProductViewPageSkeleton } from '@/components/ui/skeletons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  recipientTags?: string[];
  occasionTags?: string[];
  styleTags?: string[];
  subcategory?: string;
  budgetTier?: string;
  // Legacy
  occasion?: string[];
  giftType?: string[];
  vendor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    vendorInfo?: {
      businessName: string;
      phone?: string;
    };
  };
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
  videos?: Array<{
    url: string;
    thumbnail?: string;
    isMain: boolean;
  }>;
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isMadeInNigeria?: boolean;
  personalizationType?: 'none' | 'engraving' | 'sticker' | 'print-on';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  materials?: string[];
  weight?: string;
  color?: string;
  tags?: string[];
  estimatedDeliveryDays?: number;
  isPersonalizable: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [mediaType, setMediaType] = useState<'images' | 'videos'>('images');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProduct(id!);
      if (response.success && response.data) {
        const productData = response.data as Product;
        setProduct(productData);
        const mainImg = productData.images.find((img) => img.isMain);
        setSelectedImage(mainImg?.url || productData.images[0]?.url || '');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product';
      toast.error(errorMessage);
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    if (mediaType === 'videos' && product.videos && product.videos.length > 0) {
      const mainVideo = product.videos.find((vid) => vid.isMain);
      setSelectedImage(mainVideo?.url || product.videos[0].url);
    } else if (mediaType === 'images') {
      const mainImg = product.images.find((img) => img.isMain);
      setSelectedImage(mainImg?.url || product.images[0]?.url || '');
    }
  }, [mediaType, product]);

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return null;
    const variants: Record<string, { label: string; className: string }> = {
      PENDING:  { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 border-amber-100' },
      REJECTED: { label: 'Rejected',       className: 'bg-red-50 text-red-700 border-red-100' },
    };
    const variant = variants[status];
    if (!variant) return null;
    return (
      <Badge variant="outline" className={`${variant.className} rounded-full px-3 py-0.5 text-xs font-medium`}>
        {variant.label}
      </Badge>
    );
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteProduct(id!);
      toast.success('Product removed');
      navigate('/products');
    } catch (err) {
      toast.error('Failed to remove product');
      setIsDeleting(false);
    }
  };

  if (isLoading) return <ProductViewPageSkeleton />;
  if (!product) return null;

  const discountedPrice = product.discountPercentage && product.basePrice
    ? product.basePrice - (product.basePrice * product.discountPercentage) / 100
    : null;

  const badges = [
    product.isBestSeller && { label: 'Best Seller', cls: 'bg-amber-50 text-amber-700' },
    product.isFeatured && { label: 'Featured', cls: 'bg-[#FFF4F0] text-[#F6511E]' },
    product.isMadeInNigeria && { label: 'Made in Nigeria 🇳🇬', cls: 'bg-green-50 text-green-700' },
  ].filter(Boolean) as { label: string; cls: string }[];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 break-words">{product.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">SKU: {product.sku}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => navigate(`/edit-product/${id}`)}>
            <Edit className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 text-red-600 hover:bg-red-50 border-red-100"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left: Gallery + Description ─────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main image */}
          <div className="aspect-square md:aspect-[4/3] bg-gray-50 relative rounded-2xl overflow-hidden border border-gray-100">
            {mediaType === 'images' ? (
              <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <video src={selectedImage} controls className="w-full h-full object-contain bg-black" />
            )}
            {!product.isActive && (
              <span className="absolute top-3 left-3 text-xs bg-gray-900/80 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                Draft
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => { setMediaType('images'); setSelectedImage(img.url); }}
                className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  selectedImage === img.url && mediaType === 'images'
                    ? 'border-[#F6511E]'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <img src={img.url} className="w-full h-full object-cover" />
              </button>
            ))}
            {product.videos?.map((vid, idx) => (
              <button
                key={`v-${idx}`}
                onClick={() => { setMediaType('videos'); setSelectedImage(vid.url); }}
                className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  selectedImage === vid.url && mediaType === 'videos'
                    ? 'border-[#F6511E]'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <video src={vid.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <VideoIcon className="w-5 h-5 text-white" />
                </div>
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>

            {(product.materials?.length || product.weight || product.color || product.estimatedDeliveryDays) && (
              <>
                <Separator className="bg-gray-100" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {product.subcategory && (
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-medium mb-1">Category</p>
                      <p className="text-sm font-medium text-gray-800">{product.subcategory}</p>
                    </div>
                  )}
                  {product.materials?.length ? (
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-medium mb-1">Materials</p>
                      <p className="text-sm font-medium text-gray-800">{product.materials.join(', ')}</p>
                    </div>
                  ) : null}
                  {product.weight && (
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-medium mb-1">Weight</p>
                      <p className="text-sm font-medium text-gray-800">{product.weight}</p>
                    </div>
                  )}
                  {product.color && (
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-medium mb-1">Color</p>
                      <p className="text-sm font-medium text-gray-800">{product.color}</p>
                    </div>
                  )}
                  {product.estimatedDeliveryDays && (
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-medium mb-1">Delivery</p>
                      <p className="text-sm font-medium text-gray-800">{product.estimatedDeliveryDays} days</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Info Panel ────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">

          {/* Price + Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₦{discountedPrice ? discountedPrice.toLocaleString('en-NG', { minimumFractionDigits: 0 }) : product.basePrice.toLocaleString()}
                  </span>
                  {discountedPrice && (
                    <span className="text-base text-gray-400 line-through">
                      ₦{product.basePrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {product.discountPercentage ? (
                  <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                    {product.discountPercentage}% OFF
                  </span>
                ) : null}
              </div>
              {getStatusBadge(product.approvalStatus)}
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span key={b.label} className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {[
              { label: 'Stock', value: `${product.stock} units` },
              { label: 'SKU', value: product.sku },
              { label: 'Personalization', value: product.personalizationType === 'none' || !product.personalizationType ? 'None' : product.personalizationType },
              { label: 'Origin', value: product.isMadeInNigeria ? 'Made in Nigeria' : 'International' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{value}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {(product.recipientTags?.length || product.occasionTags?.length || product.styleTags?.length) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              {product.recipientTags?.length ? (
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-medium mb-2">For</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.recipientTags.map((t) => (
                      <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {product.occasionTags?.length ? (
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-medium mb-2">Occasions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.occasionTags.map((t) => (
                      <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {product.styleTags?.length ? (
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-medium mb-2">Style</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.styleTags.map((t) => (
                      <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Vendor */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: '#F6511E' }}
            >
              {product.vendor?.firstName?.[0]?.toUpperCase() || 'V'}
              {product.vendor?.lastName?.[0]?.toUpperCase() || ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {product.vendor?.vendorInfo?.businessName || `${product.vendor?.firstName} ${product.vendor?.lastName}`}
              </p>
              <p className="text-xs text-gray-400 truncate">{product.vendor?.email}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created {new Date(product.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span>Updated {new Date(product.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Remove Product"
        description="Are you sure you want to remove this product? This action cannot be undone."
        confirmText="Remove"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}

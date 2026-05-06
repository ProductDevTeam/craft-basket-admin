import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Tag,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  TrendingUp,
  Box,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ProductViewPageSkeleton } from '@/components/ui/skeletons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { motion } from 'framer-motion';

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  category?: {
    _id: string;
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
    _id: string;
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
  approvalStatus: 'pending' | 'approved' | 'rejected';
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
    const variants: Record<string, { label: string; className: string }> = {
      approved: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-100' },
      pending: { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 border-amber-100' },
      rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-100' },
    };
    const variant = variants[status] || variants.pending;
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/products')}
            className="text-gray-500 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-gray-400 truncate max-w-[200px]">{product.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/edit-product/${id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 border-red-100"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Gallery Section - Left (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-0 shadow-none bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square md:aspect-[4/3] bg-gray-50 relative rounded-2xl overflow-hidden border border-gray-100">
                {mediaType === 'images' ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video src={selectedImage} controls className="w-full h-full object-contain bg-black" />
                )}
                
                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {!product.isActive && (
                    <Badge className="bg-gray-900/80 backdrop-blur-md text-white border-0">Draft</Badge>
                  )}
                  {product.isFeatured && (
                    <Badge className="bg-[#F6511E] text-white border-0">Featured</Badge>
                  )}
                </div>
              </div>

              {/* Minimal Gallery Grid */}
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMediaType('images');
                      setSelectedImage(img.url);
                    }}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
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
                    onClick={() => {
                      setMediaType('videos');
                      setSelectedImage(vid.url);
                    }}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === vid.url && mediaType === 'videos'
                        ? 'border-[#F6511E]'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <video src={vid.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <VideoIcon className="w-6 h-6 text-white opacity-80" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description & Details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Description</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                {product.description}
              </div>
            </div>

            <Separator className="bg-gray-100" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium uppercase">Category</p>
                <p className="text-sm font-medium text-gray-900">{product.category?.name || 'General'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium uppercase">Materials</p>
                <p className="text-sm font-medium text-gray-900">{product.materials?.join(', ') || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium uppercase">Lead Time</p>
                <p className="text-sm font-medium text-gray-900">{product.estimatedDeliveryDays ? `${product.estimatedDeliveryDays} days` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section - Right (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-8 space-y-8">
            {/* Title & Price */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                {getStatusBadge(product.approvalStatus)}
              </div>
              
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">₦{product.basePrice.toLocaleString()}</span>
                {product.compareAtPrice && (
                  <span className="text-gray-400 line-through">₦{product.compareAtPrice.toLocaleString()}</span>
                )}
                {product.discountPercentage && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-0">
                    {product.discountPercentage}% OFF
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="bg-gray-200/60" />

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Box className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Stock</p>
                  <p className="text-sm font-semibold text-gray-900">{product.stock} units</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Tag className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">SKU</p>
                  <p className="text-sm font-semibold text-gray-900">{product.sku}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Edit className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Customizable</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{product.personalizationType || 'None'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Origin</p>
                  <p className="text-sm font-semibold text-gray-900">{product.isMadeInNigeria ? 'Nigeria' : 'International'}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200/60" />

            {/* Taxonomy Tags */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Classification Tags</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(product.recipientTags || []),
                  ...(product.occasionTags || []),
                  ...(product.styleTags || []),
                ].map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white border-gray-100 text-gray-600 rounded-lg py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Vendor Minimal Profile */}
            <div className="pt-4">
              <div className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold">
                  {product.vendor?.firstName?.[0] || 'V'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {product.vendor?.vendorInfo?.businessName || 'Vendor Profile'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{product.vendor?.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full text-gray-300">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline / Dates */}
          <div className="px-4 py-2 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Created {new Date(product.createdAt).toLocaleDateString()}
            </span>
            <span>Last updated {new Date(product.updatedAt).toLocaleDateString()}</span>
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

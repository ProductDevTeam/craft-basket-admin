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
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
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

  // Update selected media when mediaType changes
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
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Package className="w-3 h-3" />,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#F6511E' }} />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Type Selector */}
          {product.videos && product.videos.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={mediaType === 'images' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType('images')}
                className={mediaType === 'images' ? 'text-white' : ''}
                style={mediaType === 'images' ? { backgroundColor: '#F6511E' } : {}}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Images ({product.images.length})
              </Button>
              <Button
                variant={mediaType === 'videos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType('videos')}
                className={mediaType === 'videos' ? 'text-white' : ''}
                style={mediaType === 'videos' ? { backgroundColor: '#F6511E' } : {}}
              >
                <VideoIcon className="w-4 h-4 mr-2" />
                Videos ({product.videos.length})
              </Button>
            </div>
          )}

          {/* Main Media Display */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 relative">
                {mediaType === 'images' ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  product.videos && product.videos.length > 0 && (
                    <video
                      src={selectedImage}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )
                )}
                {!product.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Badge className="bg-red-500 text-white text-lg px-4 py-2">Inactive</Badge>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {mediaType === 'images' && product.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === img.url
                          ? 'border-[#F6511E] ring-2 ring-[#F6511E]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img.url} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Thumbnails */}
              {mediaType === 'videos' && product.videos && product.videos.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {product.videos.map((video, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(video.url)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === video.url
                          ? 'border-[#F6511E] ring-2 ring-[#F6511E]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <video src={video.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <VideoIcon className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Description */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Product Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.shortDescription && (
                <p className="text-gray-700 font-medium">{product.shortDescription}</p>
              )}
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>

              {product.materials && product.materials.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Materials</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.materials.map((material, idx) => (
                        <Badge key={idx} variant="outline">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {product.tags && product.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                  <CardDescription>{product.category.name}</CardDescription>
                </div>
                {getStatusBadge(product.approvalStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div>
                <p className="text-3xl font-bold text-gray-900">₦{product.basePrice.toLocaleString()}</p>
                {product.compareAtPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-lg text-gray-400 line-through">
                      ₦{product.compareAtPrice.toLocaleString()}
                    </p>
                    {product.discountPercentage && (
                      <Badge className="bg-red-100 text-red-800">-{product.discountPercentage}%</Badge>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    Stock
                  </span>
                  <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock} units
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    SKU
                  </span>
                  <span className="font-medium text-gray-900">{product.sku}</span>
                </div>

                {product.weight && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Weight</span>
                    <span className="font-medium text-gray-900">{product.weight}</span>
                  </div>
                )}

                {product.color && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Color</span>
                    <span className="font-medium text-gray-900">{product.color}</span>
                  </div>
                )}

                {product.estimatedDeliveryDays && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium text-gray-900">{product.estimatedDeliveryDays} days</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-2">
                {product.isFeatured && (
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">Featured Product</span>
                  </div>
                )}
                {product.isBestSeller && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Best Seller</span>
                  </div>
                )}
                {product.isPersonalizable && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Edit className="w-4 h-4" />
                    <span className="font-medium">Personalizable</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: '#F6511E' }}
                >
                  {product.vendor.firstName[0]}
                  {product.vendor.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {product.vendor.vendorInfo?.businessName ||
                      `${product.vendor.firstName} ${product.vendor.lastName}`}
                  </p>
                  <p className="text-sm text-gray-600">{product.vendor.email}</p>
                </div>
              </div>
              {product.vendor.vendorInfo?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Phone:</span>
                  <span className="font-medium text-gray-900">{product.vendor.vendorInfo.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(product.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(product.updatedAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

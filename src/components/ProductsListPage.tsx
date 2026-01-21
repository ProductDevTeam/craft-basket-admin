import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, Eye, Edit, Trash2, Filter, Package, Users, X, ChevronDown, ArrowLeft, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { OCCASION_OPTIONS, GIFT_TYPE_OPTIONS } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence, PageTransition, StaggerGrid, StaggerItem, staggerItem } from '@/lib/motion';
import { ProductGridSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Product {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  discountPercentage?: number;
  compareAtPrice?: number;
  occasion?: string[];
  giftType?: string[];
  vendor: {
    _id: string;
    firstName: string;
    lastName: string;
    vendorInfo?: {
      businessName: string;
    };
  };
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isMadeInNigeria?: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  estimatedDeliveryDays?: number;
  createdAt: string;
}

const PRICE_RANGES = [
  { label: 'Under ₦5,000', min: 0, max: 5000 },
  { label: '₦5,000 - ₦10,000', min: 5000, max: 10000 },
  { label: '₦10,000 - ₦25,000', min: 10000, max: 25000 },
  { label: '₦25,000 - ₦50,000', min: 25000, max: 50000 },
  { label: 'Over ₦50,000', min: 50000, max: Infinity },
];

const DISCOUNT_OPTIONS = [
  { label: '10% or more', value: 10 },
  { label: '20% or more', value: 20 },
  { label: '30% or more', value: 30 },
  { label: '50% or more', value: 50 },
];

const DELIVERY_OPTIONS = [
  { label: 'Within 3 days', days: 3 },
  { label: 'Within 5 days', days: 5 },
  { label: 'Within 7 days', days: 7 },
  { label: 'Within 14 days', days: 14 },
];

export function ProductsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>('');

  // Filter state
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedGiftTypes, setSelectedGiftTypes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [madeInNigeria, setMadeInNigeria] = useState<boolean | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    selectedOccasions.length > 0,
    selectedGiftTypes.length > 0,
    selectedPriceRange !== null,
    selectedDiscount !== null,
    madeInNigeria !== null,
    deliveryDays !== null,
    vendorFilter !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedOccasions([]);
    setSelectedGiftTypes([]);
    setSelectedPriceRange(null);
    setSelectedDiscount(null);
    setMadeInNigeria(null);
    setDeliveryDays(null);
    clearVendorFilter();
  };

  const clearVendorFilter = () => {
    setVendorFilter(null);
    setVendorName('');
    // Remove vendor parameter from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('vendor');
    setSearchParams(newParams);
  };

  // Handle vendor filter from URL parameter
  useEffect(() => {
    const vendorParam = searchParams.get('vendor');
    setVendorFilter(vendorParam);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, selectedOccasions, selectedGiftTypes, selectedPriceRange, selectedDiscount, madeInNigeria, deliveryDays, vendorFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProducts({
        page: currentPage,
        limit: 100, // Fetch more to allow client-side filtering
        search: searchQuery,
      });
      if (response.success && response.data) {
        let filteredProducts = Array.isArray(response.data) ? response.data : [];

        // Apply client-side filters
        // Filter by vendor if vendorFilter is set
        if (vendorFilter) {
          filteredProducts = filteredProducts.filter((p: Product) => p.vendor._id === vendorFilter);
          // Set vendor name from the first product for display
          if (filteredProducts.length > 0) {
            const vendor = filteredProducts[0].vendor;
            setVendorName(vendor.vendorInfo?.businessName || `${vendor.firstName} ${vendor.lastName}`);
          }
        }

        if (selectedOccasions.length > 0) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            p.occasion?.some((o: string) => selectedOccasions.includes(o))
          );
        }
        if (selectedGiftTypes.length > 0) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            p.giftType?.some((g: string) => selectedGiftTypes.includes(g))
          );
        }
        if (selectedPriceRange) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            p.basePrice >= selectedPriceRange.min && p.basePrice <= selectedPriceRange.max
          );
        }
        if (selectedDiscount !== null) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            (p.discountPercentage || 0) >= selectedDiscount
          );
        }
        if (madeInNigeria !== null) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            p.isMadeInNigeria === madeInNigeria
          );
        }
        if (deliveryDays !== null) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            (p.estimatedDeliveryDays || 7) <= deliveryDays
          );
        }

        setProducts(filteredProducts);
        setTotalPages(Math.ceil(filteredProducts.length / 10) || 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const mainImage = (product: Product) => {
    const main = product.images.find((img) => img.isMain);
    return main?.url || product.images[0]?.url || '/placeholder-product.png';
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setDeletingProductId(productToDelete.id);
      await apiClient.deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      // Remove the product from the list
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete.id));
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      toast.error(errorMessage);
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            {vendorFilter && vendorName && (
              <Badge variant="outline" className="text-sm px-3 py-1 flex items-center gap-2">
                <User className="w-3 h-3" />
                {vendorName}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={clearVendorFilter}
                />
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {vendorFilter
              ? `Viewing products from ${vendorName}`
              : 'Manage and view all products in your marketplace'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {vendorFilter && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={clearVendorFilter}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Products
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => navigate('/create-product')}
              className="text-white gap-2"
              style={{ backgroundColor: '#F6511E' }}
            >
              <Plus className="w-4 h-4" />
              Create Product
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              className={`gap-2 ${showFilters ? 'text-white' : ''}`}
              style={showFilters ? { backgroundColor: '#F6511E' } : {}}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 bg-white text-[#F6511E] text-xs px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500">
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t">
              {/* Occasion Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    <span className="truncate">
                      {selectedOccasions.length > 0 ? `${selectedOccasions.length} selected` : 'Occasion'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <div className="space-y-2">
                    {OCCASION_OPTIONS.map((occasion) => (
                      <div key={occasion} className="flex items-center space-x-2">
                        <Checkbox
                          id={`occ-${occasion}`}
                          checked={selectedOccasions.includes(occasion)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOccasions([...selectedOccasions, occasion]);
                            } else {
                              setSelectedOccasions(selectedOccasions.filter((o) => o !== occasion));
                            }
                          }}
                        />
                        <label htmlFor={`occ-${occasion}`} className="text-sm cursor-pointer">
                          {occasion}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Gift Type Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    <span className="truncate">
                      {selectedGiftTypes.length > 0 ? `${selectedGiftTypes.length} selected` : 'Gift Type'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <div className="space-y-2">
                    {GIFT_TYPE_OPTIONS.map((giftType) => (
                      <div key={giftType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gift-${giftType}`}
                          checked={selectedGiftTypes.includes(giftType)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGiftTypes([...selectedGiftTypes, giftType]);
                            } else {
                              setSelectedGiftTypes(selectedGiftTypes.filter((g) => g !== giftType));
                            }
                          }}
                        />
                        <label htmlFor={`gift-${giftType}`} className="text-sm cursor-pointer">
                          {giftType}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Price Filter */}
              <Select
                value={selectedPriceRange ? `${selectedPriceRange.min}-${selectedPriceRange.max}` : 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedPriceRange(null);
                  } else {
                    const range = PRICE_RANGES.find((r) => `${r.min}-${r.max}` === value);
                    if (range) setSelectedPriceRange({ min: range.min, max: range.max });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Discounts Filter */}
              <Select
                value={selectedDiscount?.toString() || 'all'}
                onValueChange={(value) => {
                  setSelectedDiscount(value === 'all' ? null : parseInt(value));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Discounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DISCOUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Made in Naija Filter */}
              <Select
                value={madeInNigeria === null ? 'all' : madeInNigeria.toString()}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setMadeInNigeria(null);
                  } else {
                    setMadeInNigeria(value === 'true');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Made In Naija" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="true">Made in Nigeria 🇳🇬</SelectItem>
                  <SelectItem value="false">International</SelectItem>
                </SelectContent>
              </Select>

              {/* Delivery Date Filter */}
              <Select
                value={deliveryDays?.toString() || 'all'}
                onValueChange={(value) => {
                  setDeliveryDays(value === 'all' ? null : parseInt(value));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Delivery Time</SelectItem>
                  {DELIVERY_OPTIONS.map((option) => (
                    <SelectItem key={option.days} value={option.days.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          )}

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedOccasions.map((occ) => (
                <Badge key={occ} variant="secondary" className="gap-1">
                  {occ}
                  <button onClick={() => setSelectedOccasions(selectedOccasions.filter((o) => o !== occ))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {selectedGiftTypes.map((gt) => (
                <Badge key={gt} variant="secondary" className="gap-1">
                  {gt}
                  <button onClick={() => setSelectedGiftTypes(selectedGiftTypes.filter((g) => g !== gt))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {selectedPriceRange && (
                <Badge variant="secondary" className="gap-1">
                  {PRICE_RANGES.find((r) => r.min === selectedPriceRange.min)?.label}
                  <button onClick={() => setSelectedPriceRange(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedDiscount !== null && (
                <Badge variant="secondary" className="gap-1">
                  {selectedDiscount}%+ off
                  <button onClick={() => setSelectedDiscount(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {madeInNigeria !== null && (
                <Badge variant="secondary" className="gap-1">
                  {madeInNigeria ? 'Made in Nigeria 🇳🇬' : 'International'}
                  <button onClick={() => setMadeInNigeria(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {deliveryDays !== null && (
                <Badge variant="secondary" className="gap-1">
                  Within {deliveryDays} days
                  <button onClick={() => setDeliveryDays(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProductGridSkeleton count={6} />
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                  <p className="text-sm text-gray-500 mb-6">
                    {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first product'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => navigate('/create-product')}
                      className="text-white"
                      style={{ backgroundColor: '#F6511E' }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Product
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="products">
            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <StaggerItem key={product._id}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={mainImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {getStatusBadge(product.approvalStatus)}
                    {product.isFeatured && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        Featured
                      </Badge>
                    )}
                    {product.isBestSeller && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        Best Seller
                      </Badge>
                    )}
                    {product.isMadeInNigeria && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        🇳🇬 Made in Nigeria
                      </Badge>
                    )}
                  </div>
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge className="bg-red-500 text-white">Inactive</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Product Info */}
                  <h3 className="font-semibold text-gray-900 truncate mb-2" title={product.name}>
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Users className="w-4 h-4" />
                    <span className="truncate">
                      {product.vendor.vendorInfo?.businessName ||
                        `${product.vendor.firstName} ${product.vendor.lastName}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        ₦{product.basePrice.toLocaleString()}
                      </p>
                      {product.discountPercentage && product.discountPercentage > 0 && (
                        <p className="text-sm font-medium" style={{ color: '#F6511E' }}>
                          {product.discountPercentage}% off
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                      {[...(product.occasion || []), ...(product.giftType || [])].slice(0, 2).map((tag, idx) => (
                        <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {[...(product.occasion || []), ...(product.giftType || [])].length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{[...(product.occasion || []), ...(product.giftType || [])].length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                      Stock: {product.stock}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-gray-100"
                      onClick={() => navigate(`/edit-product/${product._id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(product._id, product.name);
                      }}
                      disabled={deletingProductId === product._id}
                    >
                      {deletingProductId === product._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerGrid>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-sm mt-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 px-4">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Product"
        description={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone and will permanently remove the product from your store.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={deletingProductId !== null}
      />
    </PageTransition>
  );
}

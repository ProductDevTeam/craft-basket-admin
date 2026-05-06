import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Filter,
  Package,
  Users,
  X,
  ChevronDown,
  ArrowLeft,
  User,
  SearchX,
  PackageSearch,
  History,
  LayoutGrid,
  List,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OCCASION_OPTIONS, RECIPIENT_OPTIONS, STYLE_TAG_OPTIONS } from '@/types';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  motion,
  AnimatePresence,
  PageTransition,
  StaggerGrid,
  StaggerItem,
  staggerItem,
} from '@/lib/motion';
import { ProductGridSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Product {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  discountPercentage?: number;
  compareAtPrice?: number;
  // V2 IA Taxonomy
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
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [stagedOccasions, setStagedOccasions] = useState<string[]>([]);
  const [stagedRecipients, setStagedRecipients] = useState<string[]>([]);
  const [occasionSearch, setOccasionSearch] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(
    null
  );
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [madeInNigeria, setMadeInNigeria] = useState<boolean | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    selectedOccasions.length > 0,
    selectedRecipients.length > 0,
    selectedPriceRange !== null,
    selectedDiscount !== null,
    madeInNigeria !== null,
    deliveryDays !== null,
    vendorFilter !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedOccasions([]);
    setSelectedRecipients([]);
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
  }, [
    currentPage,
    searchQuery,
    selectedOccasions,
    selectedRecipients,
    selectedPriceRange,
    selectedDiscount,
    madeInNigeria,
    deliveryDays,
    vendorFilter,
  ]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProducts({
        page: currentPage,
        limit: 12,
        search: searchQuery,
        vendor: vendorFilter || undefined,
        occasionTags: selectedOccasions.length > 0 ? selectedOccasions : undefined,
        recipients: selectedRecipients.length > 0 ? selectedRecipients : undefined,
        minPrice: selectedPriceRange?.min,
        maxPrice: selectedPriceRange?.max === Infinity ? undefined : selectedPriceRange?.max,
        minDiscount: selectedDiscount !== null ? selectedDiscount : undefined,
        madeInNigeria: madeInNigeria !== null ? madeInNigeria : undefined,
        maxDeliveryDays: deliveryDays !== null ? deliveryDays : undefined,
      });
      if (response.success && response.data) {
        const fetchedProducts = Array.isArray(response.data) ? response.data : [];
        setProducts(fetchedProducts);
        setTotalPages(response.meta?.totalPages || 1);

        // Set vendor name from the first product for display
        if (vendorFilter && fetchedProducts.length > 0) {
          const vendor = fetchedProducts[0].vendor;
          if (vendor) {
            setVendorName(
              vendor.vendorInfo?.businessName || `${vendor.firstName} ${vendor.lastName}`
            );
          }
        }
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
      approved: { label: 'Approved', className: 'bg-green-500/90 text-white border-0' },
      pending: { label: 'Pending', className: 'bg-yellow-500/90 text-white border-0' },
      rejected: { label: 'Rejected', className: 'bg-red-500/90 text-white border-0' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={`text-xs ${variant.className}`}>{variant.label}</Badge>;
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
              <Popover onOpenChange={(open) => {
                if (open) setStagedOccasions([...selectedOccasions]);
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    <span className="truncate">
                      {selectedOccasions.length > 0
                        ? `${selectedOccasions.length} selected`
                        : 'Occasion'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-gray-100" align="start" sideOffset={8}>
                  <div className="p-2 border-b bg-gray-50/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Search occasions..."
                        value={occasionSearch}
                        onChange={(e) => setOccasionSearch(e.target.value)}
                        className="pl-8 h-9 text-sm border-gray-200 focus-visible:ring-[#F6511E]/20 focus-visible:border-[#F6511E]"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[280px]">
                    <div className="p-2 space-y-0.5">
                      {OCCASION_OPTIONS.filter((o) =>
                        o.toLowerCase().includes(occasionSearch.toLowerCase())
                      ).map((occasion) => (
                        <div
                          key={occasion}
                          className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded-md transition-colors cursor-pointer group"
                          onClick={() => {
                            if (stagedOccasions.includes(occasion)) {
                              setStagedOccasions(stagedOccasions.filter((o) => o !== occasion));
                            } else {
                              setStagedOccasions([...stagedOccasions, occasion]);
                            }
                          }}
                        >
                          <Checkbox
                            id={`occ-${occasion}`}
                            checked={stagedOccasions.includes(occasion)}
                            className="border-gray-300 pointer-events-none data-[state=checked]:bg-[#F6511E] data-[state=checked]:border-[#F6511E]"
                            onCheckedChange={() => {}}
                          />
                          <label
                            htmlFor={`occ-${occasion}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1 py-0.5 pointer-events-none"
                          >
                            {occasion}
                          </label>
                        </div>
                      ))}
                      {OCCASION_OPTIONS.filter((o) =>
                        o.toLowerCase().includes(occasionSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No occasions found</p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t flex items-center justify-between gap-2 bg-gray-50/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-gray-500 hover:text-gray-700"
                      onClick={() => setStagedOccasions([])}
                      disabled={stagedOccasions.length === 0}
                    >
                      Clear All
                    </Button>
                    <PopoverClose asChild>
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-[#F6511E] hover:bg-[#D64519] text-white px-4"
                        onClick={() => setSelectedOccasions([...stagedOccasions])}
                      >
                        Apply
                      </Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Recipient Filter */}
              <Popover onOpenChange={(open) => {
                if (open) setStagedRecipients([...selectedRecipients]);
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    <span className="truncate">
                      {selectedRecipients.length > 0
                        ? `${selectedRecipients.length} selected`
                        : 'Recipient'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-gray-100" align="start" sideOffset={8}>
                  <div className="p-2 border-b bg-gray-50/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Search recipients..."
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="pl-8 h-9 text-sm border-gray-200 focus-visible:ring-[#F6511E]/20 focus-visible:border-[#F6511E]"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[240px]">
                    <div className="p-2 space-y-0.5">
                      {RECIPIENT_OPTIONS.filter((r) =>
                        r.toLowerCase().includes(recipientSearch.toLowerCase())
                      ).map((recipient) => (
                        <div
                          key={recipient}
                          className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded-md transition-colors cursor-pointer group"
                          onClick={() => {
                            if (stagedRecipients.includes(recipient)) {
                              setStagedRecipients(stagedRecipients.filter((r) => r !== recipient));
                            } else {
                              setStagedRecipients([...stagedRecipients, recipient]);
                            }
                          }}
                        >
                          <Checkbox
                            id={`rec-${recipient}`}
                            checked={stagedRecipients.includes(recipient)}
                            className="border-gray-300 pointer-events-none data-[state=checked]:bg-[#F6511E] data-[state=checked]:border-[#F6511E]"
                            onCheckedChange={() => {}}
                          />
                          <label
                            htmlFor={`rec-${recipient}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1 py-0.5 pointer-events-none"
                          >
                            {recipient}
                          </label>
                        </div>
                      ))}
                      {RECIPIENT_OPTIONS.filter((r) =>
                        r.toLowerCase().includes(recipientSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No recipients found</p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t flex items-center justify-between gap-2 bg-gray-50/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-gray-500 hover:text-gray-700"
                      onClick={() => setStagedRecipients([])}
                      disabled={stagedRecipients.length === 0}
                    >
                      Clear All
                    </Button>
                    <PopoverClose asChild>
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-[#F6511E] hover:bg-[#D64519] text-white px-4"
                        onClick={() => setSelectedRecipients([...stagedRecipients])}
                      >
                        Apply
                      </Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Price Filter */}
              <Select
                value={
                  selectedPriceRange ? `${selectedPriceRange.min}-${selectedPriceRange.max}` : 'all'
                }
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
                  <button
                    onClick={() => setSelectedOccasions(selectedOccasions.filter((o) => o !== occ))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {selectedRecipients.map((r) => (
                <Badge key={r} variant="secondary" className="gap-1">
                  {r}
                  <button
                    onClick={() => setSelectedRecipients(selectedRecipients.filter((x) => x !== r))}
                  >
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
                  <PackageSearch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                  <p className="text-sm text-gray-500 mb-6">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Get started by creating your first product'}
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
              {products.map((product) => {
                const tags = [
                  ...(product.recipientTags || []),
                  ...(product.occasionTags || []),
                ];
                return (
                <StaggerItem key={product._id}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-sm hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={mainImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* Status badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                          {getStatusBadge(product.approvalStatus)}
                          {product.isFeatured && (
                            <Badge className="bg-purple-500/90 text-white text-xs border-0">
                              Featured
                            </Badge>
                          )}
                          {product.isBestSeller && (
                            <Badge className="bg-blue-500/90 text-white text-xs border-0">Best Seller</Badge>
                          )}
                        </div>
                        {/* Budget tier badge */}
                        {product.budgetTier && (
                          <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs border-0 backdrop-blur-sm">
                            {product.budgetTier}
                          </Badge>
                        )}
                        {/* Price on image */}
                        <div className="absolute bottom-3 left-3 flex items-baseline gap-2">
                          <span className="text-white font-bold text-lg drop-shadow-md">
                            ₦{product.basePrice.toLocaleString()}
                          </span>
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F6511E] text-white">
                              -{product.discountPercentage}%
                            </span>
                          )}
                        </div>
                        {/* Inactive overlay */}
                        {!product.isActive && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge className="bg-red-500 text-white border-0">Inactive</Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        {/* Product name */}
                        <h3
                          className="font-semibold text-gray-900 truncate mb-1 text-[15px]"
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        {/* Vendor */}
                        <p className="text-sm text-gray-500 truncate mb-3">
                          {product.vendor?.vendorInfo?.businessName ||
                            (product.vendor
                              ? `${product.vendor.firstName} ${product.vendor.lastName}`
                              : 'Unknown Vendor')}
                        </p>

                        {/* Taxonomy tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={`${tag}-${idx}`}
                                className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-[#F6511E] font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                                +{tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stock + Date */}
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-gray-600">
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(product.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-sm"
                            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-sm"
                            onClick={(e) => { e.stopPropagation(); navigate(`/edit-product/${product._id}`); }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(product._id, product.name);
                            }}
                            disabled={deletingProductId === product._id}
                          >
                            {deletingProductId === product._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
                );
              })}
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

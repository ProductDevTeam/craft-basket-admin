import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2, Eye, Edit, Trash2, Filter, Package, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  category: {
    _id: string;
    name: string;
  };
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
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function ProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProducts({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      });
      if (response.success && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.meta?.totalPages || 1);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all products in your marketplace
          </p>
        </div>
        <Button
          onClick={() => navigate('/create-product')}
          className="text-white gap-2"
          style={{ backgroundColor: '#4a3032' }}
        >
          <Plus className="w-4 h-4" />
          Create Product
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
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
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4a3032' }} />
        </div>
      ) : products.length === 0 ? (
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
                  style={{ backgroundColor: '#4a3032' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Product
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
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
                  </div>
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge className="bg-red-500 text-white">Inactive</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Product Info */}
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[48px]">
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
                        ${product.basePrice.toLocaleString()}
                      </p>
                      {product.compareAtPrice && (
                        <p className="text-sm text-gray-400 line-through">
                          ${product.compareAtPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.category.name}
                    </Badge>
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
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </>
      )}
    </div>
  );
}

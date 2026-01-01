import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingCart, Plus } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the Craft Basket admin portal. Manage products on behalf of vendors.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/create-product')}
              className="h-auto py-6 flex flex-col items-center gap-2 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="w-8 h-8" />
              <span className="font-semibold">Create Product</span>
              <span className="text-xs opacity-80">Add a product for a vendor</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MVP Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">MVP Mode Active</h3>
              <p className="text-sm text-amber-800 mt-1">
                During this early stage, admins can create products on behalf of vendors to streamline the onboarding process.
                The full vendor self-service flow is still available when needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

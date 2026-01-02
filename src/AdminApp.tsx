import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './components/DashboardPage';
import { CreateProductPage } from './components/CreateProductPage';
import { ProductsListPage } from './components/ProductsListPage';
import { ProductViewPage } from './components/ProductViewPage';
import { Toaster } from '@/components/ui/sonner';

function AdminContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4a3032', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/:id" element={<ProductViewPage />} />
        <Route path="/create-product" element={<CreateProductPage />} />
      </Routes>
    </AdminLayout>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

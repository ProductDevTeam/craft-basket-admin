import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, RoleGuard } from './contexts/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoginPage } from './components/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './components/DashboardPage';
import { CreateProductPage } from './components/CreateProductPage';
import { ProductsListPage } from './components/ProductsListPage';
import { CategoriesPage } from './components/CategoriesPage';
import { ProductViewPage } from './components/ProductViewPage';
import { VendorsPage } from './components/VendorsPage';
import { ScrollToTop } from './components/ScrollToTop';
import { EmailOverviewPage } from './components/email/EmailOverviewPage';
import { EmailTemplatesPage } from './components/email/EmailTemplatesPage';
import { EmailTemplateFormPage } from './components/email/EmailTemplateFormPage';
import { EmailCampaignsPage } from './components/email/EmailCampaignsPage';
import { EmailCampaignFormPage } from './components/email/EmailCampaignFormPage';
import { EmailCampaignDetailsPage } from './components/email/EmailCampaignDetailsPage';
import { AutomationRulesPage } from './components/email/AutomationRulesPage';
import { SubscribersPage } from './components/email/SubscribersPage';
import { DeliverySandboxPage } from './components/DeliverySandboxPage';
import { OccasionPage } from './components/OccasionPage';
import { OccasionFormPage } from './components/OccasionFormPage';
import { GiftAddonsPage } from './components/GiftAddonsPage';
import { GiftAddonCategoryFormPage } from './components/GiftAddonCategoryFormPage';
import { GiftAddonItemFormPage } from './components/GiftAddonItemFormPage';


function AdminContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F6511E', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AdminLayout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/:id" element={<ProductViewPage />} />
        <Route path="/create-product" element={<RoleGuard roles={['super_admin', 'admin']}><CreateProductPage /></RoleGuard>} />
        <Route path="/edit-product/:id" element={<RoleGuard roles={['super_admin', 'admin']}><CreateProductPage /></RoleGuard>} />
        <Route path="/categories" element={<RoleGuard roles={['super_admin', 'admin']}><CategoriesPage /></RoleGuard>} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/email" element={<EmailOverviewPage />} />
        <Route path="/email/templates" element={<EmailTemplatesPage />} />
        <Route path="/email/templates/create" element={<EmailTemplateFormPage />} />
        <Route path="/email/templates/:id/edit" element={<EmailTemplateFormPage />} />
        <Route path="/email/campaigns" element={<EmailCampaignsPage />} />
        <Route path="/email/campaigns/create" element={<EmailCampaignFormPage />} />
        <Route path="/email/campaigns/:id/edit" element={<EmailCampaignFormPage />} />
        <Route path="/email/campaigns/:id" element={<EmailCampaignDetailsPage />} />
        <Route path="/email/automation" element={<AutomationRulesPage />} />
        <Route path="/email/subscribers" element={<SubscribersPage />} />
        <Route path="/occasion" element={<RoleGuard roles={['super_admin', 'admin']}><OccasionPage /></RoleGuard>} />
        <Route path="/occasion/new" element={<RoleGuard roles={['super_admin', 'admin']}><OccasionFormPage /></RoleGuard>} />
        <Route path="/occasion/:id/edit" element={<RoleGuard roles={['super_admin', 'admin']}><OccasionFormPage /></RoleGuard>} />
        <Route path="/gift-addons" element={<RoleGuard roles={['super_admin', 'admin']}><GiftAddonsPage /></RoleGuard>} />
        <Route path="/gift-addons/category/new" element={<RoleGuard roles={['super_admin', 'admin']}><GiftAddonCategoryFormPage /></RoleGuard>} />
        <Route path="/gift-addons/category/:id/edit" element={<RoleGuard roles={['super_admin', 'admin']}><GiftAddonCategoryFormPage /></RoleGuard>} />
        <Route path="/gift-addons/category/:categoryId/item/new" element={<RoleGuard roles={['super_admin', 'admin']}><GiftAddonItemFormPage /></RoleGuard>} />
        <Route path="/gift-addons/category/:categoryId/item/:itemId/edit" element={<RoleGuard roles={['super_admin', 'admin']}><GiftAddonItemFormPage /></RoleGuard>} />
        <Route path="/delivery-sandbox" element={<RoleGuard roles={['super_admin', 'admin']}><DeliverySandboxPage /></RoleGuard>} />
      </Routes>
    </AdminLayout>
  );
}

export default function AdminApp() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <TooltipProvider delayDuration={100}>
          <AdminContent />
        </TooltipProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Plus,
  LayoutDashboard,
  Menu,
  X,
  Package,
  Users,
  ShoppingCart,
  ShoppingBag,
  FolderTree,
  Settings,
  BarChart3,
  Mail,
  MoreVertical,
  Moon,
  Sun,
  HelpCircle,
  ChevronsUpDown,
  LifeBuoy,
  FileText,
  Truck,
  Gift,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ebunlyLogo from '@/assets/ebunly-logo.png';
import { Breadcrumbs } from './ui/Breadcrumbs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    // Exact match for dashboard
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    // For products, match /products, /products/:id, /create-product, and /edit-product/:id
    if (path === '/products') {
      return (
        location.pathname.startsWith('/products') ||
        location.pathname === '/create-product' ||
        location.pathname.startsWith('/edit-product')
      );
    }
    // For categories
    if (path === '/categories') {
      return location.pathname.startsWith('/categories');
    }
    // For occasions
    if (path === '/occasion') {
      return location.pathname.startsWith('/occasion');
    }
    // For gift add-ons
    if (path === '/gift-addons') {
      return location.pathname.startsWith('/gift-addons');
    }
    // For email section, match all /email/* routes
    if (path === '/email') {
      return location.pathname.startsWith('/email');
    }
    // Default exact match for other routes
    return location.pathname === path;
  };

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    SUPPORT: 'Support',
  };

  const allNavItems: { name: string; path: string; icon: React.ElementType; disabled?: boolean; badge?: string; roles: string[] }[] = [
    { name: 'Dashboard',      path: '/dashboard',       icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
    { name: 'Products',       path: '/products',        icon: ShoppingBag,     roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
    { name: 'Categories',     path: '/categories',      icon: FolderTree,      roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Occasions',      path: '/occasion',        icon: Gift,            roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Gift Add-ons',   path: '/gift-addons',     icon: Tag,             roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Vendors',        path: '/vendors',         icon: Users,           roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
    { name: 'Email',          path: '/email',           icon: Mail,            roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
    { name: 'Orders',         path: '/orders',          icon: ShoppingCart,    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], disabled: true },
    { name: 'Analytics',      path: '/analytics',       icon: BarChart3,       roles: ['SUPER_ADMIN', 'ADMIN'], disabled: true },
    { name: 'Delivery Test',  path: '/delivery-sandbox',icon: Truck,           roles: ['SUPER_ADMIN', 'ADMIN'], badge: 'Test' },
  ];

  const navigationItems = allNavItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
          <img src={ebunlyLogo} alt="Ebunly Logo" className="h-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Ebunly</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => !item.disabled && navigate(item.path)}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  active
                    ? "bg-ebunly-orange text-white shadow-md"
                    : item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {item.disabled && (
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                )}
                {item.badge && !item.disabled && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all text-left group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-ebunly-orange shadow-sm shadow-ebunly-orange/20 flex-shrink-0">
                  <span className="text-sm font-bold text-white uppercase">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">{ROLE_LABELS[user?.role || ''] ?? 'Staff'}</p>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1.5 rounded-xl mb-2 shadow-md border-gray-100" side="top" align="center">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Sun className="w-4 h-4 text-gray-400" />
                Light Mode
              </button>

              <div className="h-px bg-gray-50 my-1.5" />

              <button 
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={ebunlyLogo} alt="Ebunly Logo" className="h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Ebunly</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (!item.disabled) {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                  active
                    ? "bg-ebunly-orange text-white shadow-md"
                    : item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {item.disabled && (
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                )}
                {item.badge && !item.disabled && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all text-left group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-ebunly-orange shadow-sm shadow-ebunly-orange/20 flex-shrink-0">
                  <span className="text-sm font-bold text-white uppercase">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">{ROLE_LABELS[user?.role || ''] ?? 'Staff'}</p>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-3rem)] max-w-56 p-1.5 rounded-xl mb-4 ml-0 shadow-md border-gray-100" side="top" align="center">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Sun className="w-4 h-4 text-gray-400" />
                Light Mode
              </button>

              <div className="h-px bg-gray-50 my-1.5" />

              <button 
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src={ebunlyLogo} alt="Ebunly Logo" className="h-6 object-contain" />
            </div>
            <div className="w-6" /> {/* Spacer for balance */}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}

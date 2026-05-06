import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  'create-product': 'Create Product',
  'edit-product': 'Edit Product',
  vendors: 'Vendors',
  email: 'Email',
  templates: 'Templates',
  campaigns: 'Campaigns',
  automation: 'Automation',
  subscribers: 'Subscribers',
  create: 'Create',
  edit: 'Edit',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length <= 1 || pathnames[0] === 'dashboard') {
    return null;
  }

  return (
    <nav className="flex mb-6 text-sm font-medium text-gray-500" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = ROUTE_MAP[value] || value.charAt(0).toUpperCase() + value.slice(1);

          // Handle IDs (very simple check: if it's long and has hex-like pattern or dashes)
          const isId = value.length > 20 || (value.includes('-') && value.length > 10);
          const displayLabel = isId ? 'Details' : label;

          return (
            <li key={to} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
              {last ? (
                <span className="text-gray-900 font-semibold">{displayLabel}</span>
              ) : (
                <Link to={to} className="hover:text-ebunly-orange transition-colors">
                  {displayLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

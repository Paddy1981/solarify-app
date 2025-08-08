import {
  HomeIcon,
  Megaphone,
  Award,
  ShoppingBag,
  Users,
  Briefcase,
  StoreIcon,
  Calculator,
  FileText,
  BarChartBig,
  PackagePlus,
  TrendingUp,
  Wrench,
  ListOrdered,
  Receipt,
  Settings
} from 'lucide-react';
import type { NavLinkItem } from './types';

export const navLinksBase: NavLinkItem[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/installer/portfolio', label: 'Showcase', icon: Award },
  { href: '/supplier/store', label: 'Shop', icon: ShoppingBag },
];

export const navLinksAuthenticated: NavLinkItem[] = [
  {
    label: 'For Homeowners',
    icon: Users,
    role: 'homeowner',
    subLinks: [
      { href: '/homeowner/dashboard', label: 'Dashboard', icon: HomeIcon },
      { href: '/homeowner/system-setup', label: 'System Setup', icon: Settings },
      { href: '/savings-calculator', label: 'Savings Calculator', icon: Calculator },
      { href: '/homeowner/rfqs', label: 'My Requests', icon: FileText },
      { href: '/homeowner/quotes', label: 'My Quotes', icon: Receipt },
      { href: '/homeowner/analytics', label: 'Analytics', icon: BarChartBig },
    ],
  },
  {
    label: 'For Installers',
    icon: Briefcase,
    role: 'installer',
    subLinks: [
      { href: '/installer/dashboard', label: 'Dashboard', icon: HomeIcon },
      { href: '/installer/rfqs', label: 'Browse RFQs', icon: FileText },
      { href: '/installer/portfolio', label: 'Portfolio', icon: Award },
      { href: '/installer/analytics', label: 'Analytics', icon: BarChartBig },
    ],
  },
  {
    label: 'For Suppliers',
    icon: StoreIcon,
    role: 'supplier',
    subLinks: [
      { href: '/supplier/dashboard', label: 'Dashboard', icon: HomeIcon },
      { href: '/supplier/store', label: 'Product Store', icon: ShoppingBag },
      { href: '/supplier/products', label: 'Manage Products', icon: PackagePlus },
      { href: '/supplier/orders', label: 'Orders', icon: ListOrdered },
      { href: '/supplier/analytics', label: 'Analytics', icon: TrendingUp },
    ],
  },
];

export function getFilteredNavLinks(userRole: string | null): NavLinkItem[] {
  if (!userRole) {
    return navLinksBase;
  }

  const authenticatedLinks = navLinksAuthenticated.filter(link => 
    !link.role || link.role === userRole
  );

  return [...navLinksBase, ...authenticatedLinks];
}
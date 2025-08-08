import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/lib/mock-data/users';

export interface NavLinkItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  role?: UserRole;
  subLinks?: Array<{ 
    href: string; 
    label: string; 
    icon: LucideIcon;
  }>;
}
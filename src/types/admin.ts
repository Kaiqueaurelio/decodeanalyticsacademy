import { type LucideIcon } from 'lucide-react';
import { type AdminTabId } from '@/config/adminNav';

export interface AdminNavItem {
  id: AdminTabId;
  label: string;
  icon: LucideIcon;
  desc?: string;
  countKey?: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

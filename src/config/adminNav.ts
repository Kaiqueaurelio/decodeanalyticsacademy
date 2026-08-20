import { type AdminNavGroup } from '@/types/admin';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  Terminal, 
  FileText,
  AlertTriangle,
  History,
  Briefcase,
  Rss,
  Play,
  Share2,
  Database,
  BarChart3,
  ListCheck
} from 'lucide-react';

export type AdminTabId = 
  | 'dashboard'
  | 'apostilas'
  | 'cc-apostilas'
  | 'users'
  | 'ella-audit'
  | 'academic-audit'
  | 'security-alerts'
  | 'leads'
  | 'sponsors'
  | 'ads'
  | 'ads-chat'
  | 'rss'
  | 'changelog'
  | 'jobs'
  | 'mcp-settings'
  | 'tasks';

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'cc-apostilas', label: 'Centro de Criação', icon: BookOpen },
      { id: 'users', label: 'Usuários', icon: Users },
      { id: 'jobs', label: 'Vagas e Estágios', icon: Briefcase },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { id: 'ella-audit', label: 'Auditoria Ella', icon: MessageSquare },
      { id: 'academic-audit', label: 'Auditoria Acadêmica', icon: ListCheck },
      { id: 'security-alerts', label: 'Alertas de Segurança', icon: AlertTriangle },
      { id: 'mcp-settings', label: 'Terminal / MCP', icon: Terminal },
      { id: 'changelog', label: 'Histórico', icon: History },
    ]
  },
  {
    title: 'Marketing & Conteúdo',
    items: [
      { id: 'leads', label: 'Leads de Patrocínio', icon: Share2 },
      { id: 'sponsors', label: 'Patrocinadores', icon: ShieldCheck },
      { id: 'ads', label: 'Gestor de Anúncios', icon: Play },
      { id: 'rss', label: 'Fontes RSS', icon: Rss },
    ]
  }
];

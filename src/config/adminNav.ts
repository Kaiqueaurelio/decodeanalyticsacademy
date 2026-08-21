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
  | 'overview'
  | 'apostilas'
  | 'exercises'
  | 'materials'
  | 'users'
  | 'announcements'
  | 'calendar'
  | 'testimonials'
  | 'ai'
  | 'ella-settings'
  | 'performance'
  | 'smoke'
  | 'diagnostics'
  | 'ads'
  | 'ads-chat'
  | 'social'
  | 'rss'
  | 'courses'
  | 'changelog'
  | 'leads'
  | 'ella-audit'
  | 'security-alerts'
  | 'sponsors'
  | 'tasks'
  | 'photoroom'
  | 'edit'
  | 'review'
  | 'enem-apostilas'
  | 'cc-apostilas'
  | 'health-dashboard'
  | 'cloning-dashboard'
  | 'mcp-settings'
  | 'jobs'
  | 'academic-audit'
  | 'apostila-validation'
  | 'apostila-history';


export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão geral do sistema' },
      { id: 'cc-apostilas', label: 'Centro de Criação', icon: BookOpen, desc: 'Gerenciar apostilas e conteúdos' },
      { id: 'users', label: 'Usuários', icon: Users, desc: 'Gestão de alunos e acessos', countKey: 'users' },
      { id: 'jobs', label: 'Vagas e Estágios', icon: Briefcase, desc: 'Gestão de oportunidades' },
    ]
  },
  {
    id: 'system',
    label: 'Sistema',
    items: [
      { id: 'ella-audit', label: 'Auditoria Ella', icon: MessageSquare, desc: 'Logs de interações da IA' },
      { id: 'academic-audit', label: 'Auditoria Acadêmica', icon: ListCheck, desc: 'Logs de estudos e gabaritos' },
      { id: 'security-alerts', label: 'Segurança', icon: AlertTriangle, desc: 'Alertas e bloqueios', countKey: 'securityAlerts' },
      { id: 'apostila-validation', label: 'Diagnóstico Acadêmico', icon: ShieldCheck, desc: 'Validação de integridade' },

      { id: 'mcp-settings', label: 'Terminal / MCP', icon: Terminal, desc: 'Configurações avançadas' },
      { id: 'changelog', label: 'Histórico', icon: History, desc: 'Versões do aplicativo' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing & Conteúdo',
    items: [
      { id: 'leads', label: 'Leads', icon: Share2, desc: 'Interessados e parcerias' },
      { id: 'sponsors', label: 'Patrocinadores', icon: ShieldCheck, desc: 'Gestão de marcas' },
      { id: 'ads', label: 'Anúncios', icon: Play, desc: 'Publicidade interna' },
      { id: 'rss', label: 'Fontes RSS', icon: Rss, desc: 'Agregador de notícias' },
    ]
  }
];

export const ADMIN_NAV_BY_ID = Object.fromEntries(
  ADMIN_NAV_GROUPS.flatMap(g => g.items.map(i => [i.id, i]))
);

export function filterAdminNav(query: string): AdminNavGroup[] {
  if (!query) return ADMIN_NAV_GROUPS;
  const q = query.toLowerCase();
  return ADMIN_NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.id.toLowerCase().includes(q) ||
      (item.desc && item.desc.toLowerCase().includes(q))
    )
  })).filter(group => group.items.length > 0);
}

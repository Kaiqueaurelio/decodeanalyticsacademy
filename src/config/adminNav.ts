import { type AdminNavGroup } from '@/types/admin';
import { SECURITY_COPY } from '@/lib/security-copy';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  History,
  Briefcase,
  Play,
  ListCheck,
  Paperclip,
  Megaphone,
  CalendarDays,
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
    label: 'Começar',
    items: [
      { id: 'overview', label: 'Central de Comando', icon: LayoutDashboard, desc: 'Tudo importante em um só lugar' },
    ]
  },
  {
    id: 'daily',
    label: 'Trabalho diário',
    items: [
      { id: 'cc-apostilas', label: 'Conteúdos e Apostilas', icon: BookOpen, desc: 'Criar, editar e publicar', countKey: 'apostilas' },
      { id: 'materials', label: 'Arquivos e Materiais', icon: Paperclip, desc: 'PDFs, vídeos, áudios e anexos', countKey: 'materials' },
      { id: 'users', label: 'Alunos e Acessos', icon: Users, desc: 'Cadastrar e ajustar contas', countKey: 'users' },
      { id: 'announcements', label: 'Avisos aos Alunos', icon: Megaphone, desc: 'Publicar comunicados' },
      { id: 'calendar', label: 'Calendário', icon: CalendarDays, desc: 'Provas, trabalhos e eventos' },
      { id: 'ads', label: 'Anúncios', icon: Play, desc: 'Publicidade exibida no aplicativo' },
      { id: 'jobs', label: 'Vagas e Estágios', icon: Briefcase, desc: 'Oportunidades para os alunos' },
    ]
  },
  {
    id: 'control',
    label: 'Controle e qualidade',
    items: [
      { id: 'academic-audit', label: 'Qualidade Acadêmica', icon: ListCheck, desc: SECURITY_COPY.academicAuditDescription },
      { id: 'apostila-validation', label: 'Verificar Apostilas', icon: ShieldCheck, desc: 'Encontrar conteúdo vazio ou inconsistente' },
      { id: 'security-alerts', label: 'Segurança e Alertas', icon: AlertTriangle, desc: SECURITY_COPY.navigationDescription, countKey: 'securityAlerts' },
      { id: 'changelog', label: 'Histórico de Alterações', icon: History, desc: 'Versões e mudanças do aplicativo' },
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

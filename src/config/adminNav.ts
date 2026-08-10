import {
  BarChart3, BookOpen, PenLine, FolderOpen, GraduationCap, Users, Megaphone,
  Calendar as CalIcon, MessageSquareQuote, MessageSquare, Activity, CheckCircle,
  AlertCircle, History, ShieldCheck, ShieldAlert, Rss, Store, HandCoins, Heart,
  Sparkles, CheckSquare, type LucideIcon,
} from 'lucide-react';

export type AdminTabId =
  | 'overview' | 'apostilas' | 'exercises' | 'materials' | 'users' | 'announcements'
  | 'calendar' | 'testimonials' | 'ai' | 'performance' | 'smoke' | 'diagnostics'
  | 'ads' | 'ads-chat' | 'social' | 'rss' | 'courses' | 'changelog' | 'leads'
  | 'ella-audit' | 'security-alerts' | 'sponsors' | 'tasks' | 'photoroom' | 'edit' | 'review'
  | 'enem-apostilas' | 'cc-apostilas' | 'health-dashboard';

export type AdminNavItem = {
  id: AdminTabId;
  label: string;
  short: string;
  icon: LucideIcon;
  desc: string;
  /** Palavras extras para a busca do menu. */
  keywords?: string;
  /** Chave do contador exibido no menu. */
  countKey?: 'apostilas' | 'exercises' | 'materials' | 'users' | 'securityAlerts';
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'inicio',
    label: 'Início',
    items: [
      { id: 'overview', label: 'Painel Operacional', short: 'Geral', icon: BarChart3, desc: 'Resumo completo da plataforma', keywords: 'dashboard home painel resumo' },
      { id: 'health-dashboard', label: 'Saúde das Apostilas', short: 'Saúde', icon: Activity, desc: 'Status operacional e histórico', keywords: 'saude dashboard status manutencao historico' },
      { id: 'apostilas', label: 'Apostilas', short: 'Acervo', icon: BookOpen, desc: 'Gerenciar e publicar apostilas', countKey: 'apostilas', keywords: 'materia disciplina texto importar acervo' },
      { id: 'tasks', label: 'Gerenciador de Tarefas', short: 'Tarefas', icon: CheckSquare, desc: 'Organize suas atividades administrativas', keywords: 'tarefas checklist todo afazeres' },
      { id: 'photoroom', label: 'Estúdio Visual', short: 'Estúdio', icon: Sparkles, desc: 'Remova fundos e otimize imagens', keywords: 'imagem foto fundo remover studio photoroom' },
    ],
  },
  {
    id: 'conteudo',
    label: 'Conteúdo',
    items: [
      { id: 'enem-apostilas', label: 'Apostilas ENEM', short: 'ENEM', icon: GraduationCap, desc: 'Apenas materiais do ENEM', keywords: 'enem vestibular simulado' },
      { id: 'cc-apostilas', label: 'Ciência da Computação', short: 'CC', icon: BookOpen, desc: 'Materiais da grade acadêmica CC', keywords: 'faculdade unip cc ciencia computacao' },
      { id: 'exercises', label: 'Exercícios', short: 'Exercícios', icon: PenLine, desc: 'Questões, gabaritos e importação em lote', countKey: 'exercises', keywords: 'questoes prova gabarito' },
      { id: 'materials', label: 'Materiais', short: 'Materiais', icon: FolderOpen, desc: 'PDFs, vídeos, slides e planilhas', countKey: 'materials', keywords: 'arquivo upload pdf video' },
      { id: 'courses', label: 'Cursos Gratuitos', short: 'Cursos', icon: GraduationCap, desc: 'Cursos externos exibidos aos alunos', keywords: 'curso externo horas complementares' },
      { id: 'calendar', label: 'Calendário', short: 'Agenda', icon: CalIcon, desc: 'Provas, trabalhos e cronogramas', keywords: 'prova data agenda cronograma' },
    ],
  },
  {
    id: 'comunidade',
    label: 'Alunos e Comunidade',
    items: [
      { id: 'users', label: 'Usuários', short: 'Alunos', icon: Users, desc: 'Contas, permissões e bloqueios', countKey: 'users', keywords: 'aluno conta senha bloquear admin' },
      { id: 'announcements', label: 'Avisos', short: 'Avisos', icon: Megaphone, desc: 'Mural de avisos para os alunos', keywords: 'mural comunicado notificacao' },
      { id: 'testimonials', label: 'Depoimentos', short: 'Depoim.', icon: MessageSquareQuote, desc: 'Aprove ou rejeite depoimentos', keywords: 'feedback avaliacao' },
      { id: 'social', label: 'Social', short: 'Social', icon: Heart, desc: 'Curtidas, comentários e engajamento', keywords: 'curtida comentario engajamento' },
      { id: 'rss', label: 'Feeds RSS', short: 'RSS', icon: Rss, desc: 'Fontes de notícias exibidas no app', keywords: 'noticias feed fonte' },
    ],
  },
  {
    id: 'monetizacao',
    label: 'Monetização',
    items: [
      { id: 'ads', label: 'Anúncios', short: 'Anúncios', icon: Megaphone, desc: 'Banners, popups e agendamento', keywords: 'banner popup campanha propaganda' },
      { id: 'sponsors', label: 'Parceiros', short: 'Marcas', icon: Store, desc: 'Marcas e logos do Media Kit', keywords: 'parceria marca logo media kit' },
      { id: 'leads', label: 'Leads de Parceria', short: 'Leads', icon: HandCoins, desc: 'Briefings recebidos e contatos', keywords: 'interessado contato briefing venda' },
      { id: 'ads-chat', label: 'Criativos de Anúncio', short: 'Criativos', icon: Sparkles, desc: 'Gere criativos e textos de campanha', keywords: 'copy criativo gerar anuncio' },
    ],
  },
  {
    id: 'assistente',
    label: 'Assistente',
    items: [
      { id: 'ai', label: 'Configurar Assistente', short: 'Assistente', icon: MessageSquare, desc: 'Provedor padrão ou chave própria', keywords: 'ella provedor chave modelo' },
      { id: 'ella-audit', label: 'Auditoria da Ella', short: 'Auditoria', icon: ShieldCheck, desc: 'Ações pedidas, permissões e resultados', keywords: 'ella log auditoria permissao' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      { id: 'security-alerts', label: 'Alertas de Segurança', short: 'Segurança', icon: ShieldAlert, desc: 'Tentativas recusadas pelo servidor', countKey: 'securityAlerts', keywords: 'seguranca alerta bloqueio' },
      { id: 'performance', label: 'Performance', short: 'Perf.', icon: Activity, desc: 'Carregamento e erros de rede', keywords: 'velocidade metrica lentidao' },
      { id: 'diagnostics', label: 'Diagnóstico', short: 'Diag.', icon: AlertCircle, desc: 'Logs de runtime e falhas por rota', keywords: 'erro log debug' },
      { id: 'smoke', label: 'Testes', short: 'Testes', icon: CheckCircle, desc: 'Checklist automático de estabilidade', keywords: 'teste smoke checklist' },
      { id: 'changelog', label: 'Histórico de Versões', short: 'Histórico', icon: History, desc: 'Tudo que mudou na plataforma', keywords: 'changelog versao novidades' },
      { id: 'diagnostics', label: 'Saúde & Estabilidade', short: 'Estabilidade', icon: Activity, desc: 'Monitoramento de rede e performance', keywords: 'status saude performance rede deploy estabilidade' },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(g => g.items);

export const ADMIN_NAV_BY_ID = Object.fromEntries(
  ADMIN_NAV_ITEMS.map(i => [i.id, i]),
) as Record<AdminTabId, AdminNavItem>;

/** Atalhos exibidos na barra inferior do celular. */
export const ADMIN_MOBILE_QUICK: AdminTabId[] = ['overview', 'apostilas', 'exercises', 'materials'];

export function filterAdminNav(query: string): AdminNavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return ADMIN_NAV_GROUPS;
  return ADMIN_NAV_GROUPS
    .map(g => ({
      ...g,
      items: g.items.filter(i =>
        `${i.label} ${i.short} ${i.desc} ${i.keywords ?? ''}`.toLowerCase().includes(q),
      ),
    }))
    .filter(g => g.items.length > 0);
}

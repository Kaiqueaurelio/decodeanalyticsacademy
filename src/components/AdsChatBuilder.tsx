import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Mic,
  MoreVertical,
  Navigation,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  PenTool,
  Square,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdImageUploadButton } from './AdImageUploadButton';

const supabase = supabaseTyped as any;

import { getEllaAvatarUrl } from '@/lib/ellaAvatar';
const ELLA_AVATAR = getEllaAvatarUrl();

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer' | 'sponsor';
type MediaKind = 'image' | 'video' | 'audio';
type ActionType =
  | 'create_ad'
  | 'create_reminder'
  | 'delete_reminder'
  | 'create_announcement'
  | 'create_apostila'
  | 'send_push'
  | 'open_page';

interface Msg {
  id: string;
  role: 'bot' | 'user' | 'system';
  text: string;
  ts: number;
  mediaUrl?: string;
  mediaKind?: MediaKind;
}

interface AppAction {
  type: ActionType;
  title: string;
  summary: string;
  payload: Record<string, any>;
}

interface AIPlan {
  reply?: string;
  action?: AppAction | null;
  needs_more_info?: boolean;
}

const AD_TYPE_LABELS: Record<AdType, string> = {
  banner: 'Banner',
  popup: 'Pop-up',
  inline: 'Inline',
  sidebar: 'Lateral',
  footer: 'Rodape',
  sponsor: 'Parceiro',
};

const ACTION_LABELS: Record<ActionType, string> = {
  create_ad: 'Anuncio persistente ou Parceria',
  create_reminder: 'Lembrete na agenda',
  delete_reminder: 'Remover lembrete',
  create_announcement: 'Aviso no app',
  create_apostila: 'Apostila',
  send_push: 'Push para usuarios',
  open_page: 'Abrir area do app',
};

const PAGE_TARGETS: { keys: string[]; label: string; path: string }[] = [
  { keys: ['dashboard', 'painel', 'inicio', 'home'], label: 'Dashboard', path: '/dashboard' },
  { keys: ['apostila', 'apostilas'], label: 'Apostilas', path: '/dashboard#apostilas' },
  { keys: ['exercicio', 'exercicios', 'questoes'], label: 'Exercicios', path: '/exercicios' },
  { keys: ['curso', 'cursos'], label: 'Cursos', path: '/cursos' },
  { keys: ['biblioteca'], label: 'Biblioteca', path: '/biblioteca' },
  { keys: ['livro', 'livros', 'playbook'], label: 'Livros', path: '/livros' },
  { keys: ['flashcard', 'flashcards'], label: 'Flashcards', path: '/flashcards' },
  { keys: ['revisao', 'revisar'], label: 'Revisao', path: '/review' },
  { keys: ['simulado', 'prova'], label: 'Simulado', path: '/simulado' },
  { keys: ['calculadora'], label: 'Calculadora', path: '/calculadora' },
  { keys: ['desempenho', 'performance'], label: 'Desempenho', path: '/desempenho' },
  { keys: ['perfil', 'profile'], label: 'Perfil', path: '/profile' },
  { keys: ['materiais', 'material'], label: 'Materiais', path: '/materials' },
  { keys: ['admin', 'usuarios'], label: 'Painel Admin', path: '/admin' },
  { keys: ['anuncios', 'anuncio'], label: 'Anuncios', path: '/admin' },
  { keys: ['ella', 'ia', 'copilot'], label: 'Ella Ribeiro', path: '/admin' },
];

const SUGGESTIONS = [
  'Ella, crie um aviso serio para os alunos sobre a aula ao vivo de hoje as 20h',
  'Crie um anuncio persistente lateral para a mentoria com link https://decodeanalyticsacademy.com',
  'Monte uma apostila sobre normalizacao de banco de dados com resumo, exemplos e exercicios',
  'Adicione um lembrete de prova de Estatistica para amanha as 19h',
  'Envie um push: aula ao vivo comeca em 10 minutos',
  'Abra a pagina de desempenho',
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getMediaKind(url: string): MediaKind {
  const value = url.toLowerCase();
  if (/\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/.test(value)) return 'video';
  if (/\.(mp3|wav|m4a|ogg|aac|webm)(\?|#|$)/.test(value)) return 'audio';
  return 'image';
}

function parseAdType(value: string): AdType {
  const normalized = normalizeText(value);
  if (normalized.includes('pop')) return 'popup';
  if (normalized.includes('rodape') || normalized.includes('footer') || normalized.includes('baixo')) return 'footer';
  if (normalized.includes('side') || normalized.includes('lateral')) return 'sidebar';
  if (normalized.includes('inline') || normalized.includes('feed') || normalized.includes('conteudo')) return 'inline';
  return 'banner';
}

function cleanUrl(value: string) {
  return value.match(/https?:\/\/[^\s)]+/i)?.[0]?.replace(/[.,;!?]+$/, '') || '';
}

function extractAfter(value: string, words: string[]) {
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = value.match(new RegExp(`(?:${escaped})\\s*(?:e|eh|:|-)?\\s*[\"']?([^\"'\n]{4,220})`, 'i'));
  return match?.[1]?.trim().replace(/[.!?]+$/, '') || '';
}

function parseDateText(value: string) {
  const normalized = normalizeText(value);
  const today = new Date();
  const date = new Date(today);
  if (normalized.includes('depois de amanha')) date.setDate(today.getDate() + 2);
  else if (normalized.includes('amanha')) date.setDate(today.getDate() + 1);
  else {
    const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = value.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (br) {
      const day = br[1].padStart(2, '0');
      const month = br[2].padStart(2, '0');
      const year = br[3] ? (br[3].length === 2 ? `20${br[3]}` : br[3]) : String(today.getFullYear());
      return `${year}-${month}-${day}`;
    }
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function parseTimeText(value: string) {
  const match = normalizeText(value).match(/\b(\d{1,2})(?::|h)(\d{2})?\b/);
  if (!match) return null;
  const hour = Math.min(23, Number(match[1])).toString().padStart(2, '0');
  const minute = (match[2] || '00').padStart(2, '0');
  return `${hour}:${minute}:00`;
}

function extractJson(text: string): AIPlan | null {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function actionIcon(type: ActionType) {
  if (type === 'create_ad') return Megaphone;
  if (type === 'create_reminder') return CalendarPlus;
  if (type === 'delete_reminder') return Trash2;
  if (type === 'create_announcement') return ClipboardList;
  if (type === 'create_apostila') return FileText;
  if (type === 'open_page') return Navigation;
  return BellRing;
}

function renderMedia(url: string, kind: MediaKind, title = 'Midia') {
  if (kind === 'video') return <video src={url} controls playsInline className="mt-3 max-h-64 w-full rounded-xl bg-black object-contain" />;
  if (kind === 'audio') {
    return (
      <div className="mt-3 rounded-xl border border-border/60 bg-background/60 p-2">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }
  return <img src={url} alt={title} className="mt-3 max-h-64 w-full rounded-xl object-cover" />;
}

function makeApostilaContent(topic: string, requested: string) {
  return [
    `# ${topic}`,
    '',
    '## Objetivo',
    `Estudar ${topic} com explicacao clara, exemplos e revisao ativa.`,
    '',
    '## Resumo estruturado',
    requested || `Apresente os conceitos essenciais de ${topic}, preservando o conteudo principal e organizando em blocos curtos.`,
    '',
    '## Pontos importantes',
    '- Conceitos principais e definicoes.',
    '- Exemplos práticos conectados ao curso.',
    '- Erros comuns que o aluno deve evitar.',
    '',
    '## Exemplo guiado',
    `Crie um exemplo simples de ${topic} e resolva passo a passo.`,
    '',
    '## Exercicios sugeridos',
    `1. Explique ${topic} com suas palavras.`,
    '2. Crie um exemplo real usando dados ou rotina de estudos.',
    '3. Liste tres erros comuns e como evita-los.',
    '',
    '## Revisao final',
    'Transforme cada subtitulo em uma pergunta e tente responder sem consultar o texto.',
  ].join('\n');
}

function findPageTarget(message: string) {
  const normalized = normalizeText(message);
  return PAGE_TARGETS.find((target) => target.keys.some((key) => normalized.includes(key)));
}

function localPlan(message: string, mediaUrl?: string): AIPlan {
  const normalized = normalizeText(message);
  const url = cleanUrl(message);
  const isDelete = /\b(remover|remove|apagar|excluir|deletar)\b/.test(normalized);
  const isOpen = /\b(abrir|abra|ir para|mostrar|mostre|acessar|navegar)\b/.test(normalized);

  if (isOpen) {
    const target = findPageTarget(message);
    if (target) {
      return {
        reply: `Posso abrir ${target.label} agora.`,
        action: { type: 'open_page', title: `Abrir ${target.label}`, summary: target.path, payload: { path: target.path } },
      };
    }
  }

  if ((normalized.includes('push') || normalized.includes('notificacao') || normalized.includes('notificar')) && !isDelete) {
    const title = extractAfter(message, ['titulo', 'titulo da notificacao']) || 'Aviso Decode Analytics';
    const body = extractAfter(message, ['mensagem', 'texto', 'notificacao', 'push']) || message.replace(/envie|manda|mandar|notificacao|push/gi, '').trim();
    return {
      reply: 'Preparei a notificacao para os usuarios cadastrados. Confirme para enviar.',
      action: {
        type: 'send_push',
        title: 'Enviar notificacao push',
        summary: `${title} - ${body}`,
        payload: { title, body, link: url || '/', allUsers: true },
      },
    };
  }

  if ((normalized.includes('lembrete') || normalized.includes('agenda') || normalized.includes('calendario') || normalized.includes('prova')) && isDelete) {
    const query = message.replace(/remover|remove|apagar|excluir|deletar|lembrete|evento|agenda|calendario/gi, '').trim();
    return {
      reply: 'Vou procurar esse lembrete na agenda e remover o item correspondente depois da sua confirmacao.',
      action: {
        type: 'delete_reminder',
        title: 'Remover lembrete',
        summary: query || message,
        payload: { query: query || message },
      },
    };
  }

  if (normalized.includes('lembrete') || normalized.includes('agenda') || normalized.includes('calendario') || normalized.includes('prova')) {
    const eventDate = parseDateText(message);
    const title = extractAfter(message, ['lembrete', 'evento', 'titulo']) || message.replace(/crie|criar|adicione|adicionar|um|uma|lembrete|evento|agenda/gi, '').trim().slice(0, 90) || 'Novo lembrete';
    if (!eventDate) return { reply: 'Consigo criar esse lembrete. Qual data devo usar? Pode mandar como 30/05 ou amanha.', needs_more_info: true };
    return {
      reply: 'Montei o lembrete para a agenda. Confirme para salvar.',
      action: {
        type: 'create_reminder',
        title: 'Criar lembrete',
        summary: `${title} em ${eventDate}`,
        payload: { title, description: message, event_date: eventDate, event_time: parseTimeText(message), event_type: 'deadline', subject: extractAfter(message, ['materia', 'disciplina', 'assunto']) || null },
      },
    };
  }

  if (normalized.includes('apostila')) {
    const title = extractAfter(message, ['apostila sobre', 'apostila de', 'titulo']) || message.replace(/crie|criar|gere|gerar|uma|apostila|sobre|de/gi, '').trim().slice(0, 90) || 'Nova apostila';
    return {
      reply: 'Preparei uma apostila inicial. Ela entra como rascunho para revisao antes de publicar.',
      action: {
        type: 'create_apostila',
        title: 'Criar apostila',
        summary: title,
        payload: { title, category: 'ia', content: makeApostilaContent(title, message), published: false },
      },
    };
  }

  if (normalized.includes('aviso') || normalized.includes('comunicado')) {
    const title = extractAfter(message, ['titulo', 'aviso', 'comunicado']) || 'Novo aviso';
    const content = extractAfter(message, ['texto', 'mensagem', 'conteudo']) || message;
    return {
      reply: 'Preparei um aviso para o app. Confirme para publicar.',
      action: {
        type: 'create_announcement',
        title: 'Criar aviso',
        summary: title,
        payload: { title, content, category: 'geral', link_url: url || null, image_url: mediaUrl || null, published: true },
      },
    };
  }

  if (normalized.includes('anuncio') || normalized.includes('banner') || normalized.includes('popup')) {
    const title = extractAfter(message, ['titulo', 'chama', 'nome']) || message.replace(/crie|criar|faca|fazer|um|uma|anuncio|banner|popup/gi, '').trim().slice(0, 90) || 'Novo anuncio';
    if (!url) return { reply: 'Consigo criar o anuncio persistente. Envie tambem o link de destino com https:// para salvar corretamente.', needs_more_info: true };
    return {
      reply: 'Preparei um anuncio persistente para o app. Confirme para publicar.',
      action: {
        type: 'create_ad',
        title: 'Criar anuncio',
        summary: `${title} (${AD_TYPE_LABELS[parseAdType(message)]})`,
        payload: { title, description: extractAfter(message, ['texto', 'copy', 'descricao']) || null, link_url: url || null, image_url: mediaUrl || null, ad_type: parseAdType(message), display_duration: 5, is_active: true },
      },
    };
  }

  return { reply: 'Posso criar avisos, anuncios, lembretes, apostilas, push e abrir areas do app. Para mudancas maiores de layout ou codigo, descreva a alteracao que eu organizo a tarefa de forma objetiva para aplicarmos com seguranca.' };
}

export function AdsChatBuilder() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [latestMedia, setLatestMedia] = useState<{ url: string; kind: MediaKind } | null>(null);
  const [pendingAction, setPendingAction] = useState<AppAction | null>(null);
  const [pushTitle, setPushTitle] = useState('Aviso Decode Analytics');
  const [pushBody, setPushBody] = useState('');
  const [pushLink, setPushLink] = useState('/dashboard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<Msg[]>([]);

  useEffect(() => {
    setMessages([{ id: uid(), role: 'bot', text: 'Oi, eu sou a Ella Ribeiro. Posso criar avisos, anuncios persistentes, lembretes, apostilas, notificacoes push e abrir areas do app. Escreva como voce falaria com uma assistente de verdade.', ts: Date.now() }]);
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, thinking, attachmentsOpen, pendingAction]);

  const pendingIcon = useMemo(() => (pendingAction ? actionIcon(pendingAction.type) : ShieldCheck), [pendingAction]);
  const PendingIcon = pendingIcon;

  function pushBot(text: string) {
    setMessages((m) => [...m, { id: uid(), role: 'bot', text, ts: Date.now() }]);
  }

  function pushUser(text: string, mediaUrl?: string, mediaKind?: MediaKind) {
    setMessages((m) => [...m, { id: uid(), role: 'user', text, ts: Date.now(), mediaUrl, mediaKind }]);
  }

  async function callAI(userMessage: string, mediaUrl?: string): Promise<AIPlan | null> {
    try {
      const { getCurrentAccessToken } = await import('@/lib/auth-session');
      const accessToken = getCurrentAccessToken();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-direct`;
      const recent = messagesRef.current.slice(-10).map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          systemPrompt: [
            'Voce e Ella Ribeiro, assistente administrativa da Decode Analytics Academy.',
            'O usuario fala em portugues e quer executar tarefas do app.',
            'Classifique em uma action quando for possivel executar algo com seguranca.',
            'Actions validas: create_ad, create_reminder, delete_reminder, create_announcement, create_apostila, send_push, open_page.',
            'Para open_page use payload.path com rota interna como /dashboard, /desempenho, /cursos, /admin.',
            'Para lembretes use event_date YYYY-MM-DD e event_time HH:MM:SS quando houver horario.',
            'Para anuncios use ad_type banner|popup|inline|sidebar|footer, title, link_url (opcional), description, image_url.',
            'Para apostila gere content em markdown e published false por padrao.',
            'Se faltar informacao obrigatoria, retorne action null e faca uma unica pergunta objetiva.',
            'Responda SOMENTE JSON valido: {"reply":"texto curto","needs_more_info":false,"action":{"type":"create_ad","title":"...","summary":"...","payload":{}}}',
          ].join('\n'),
          messages: [
            ...recent,
            { role: 'user', content: `Mensagem atual: ${userMessage}\nMidia anexada: ${mediaUrl || 'nenhuma'}\nData de hoje: ${new Date().toISOString().slice(0, 10)}` },
          ],
        }),
      });
      if (!resp.ok || !resp.body) return null;

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let collected = '';
      let done = false;

      while (!done) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) collected += delta;
          } catch {
            collected += json;
          }
        }
      }
      return extractJson(collected);
    } catch (error) {
      console.warn('Ella Ribeiro fallback:', error);
      return null;
    }
  }

  function normalizeAction(action: AppAction | null | undefined): AppAction | null {
    if (!action?.type || !ACTION_LABELS[action.type]) return null;
    const title = action.title || ACTION_LABELS[action.type];
    return { ...action, title, summary: action.summary || title, payload: action.payload || {} };
  }

  async function processMessage(value: string) {
    const media = latestMedia;
    const confirmWords = ['sim', 'confirmar', 'confirma', 'executar', 'pode fazer', 'faca', 'faça'];
    const cancelWords = ['cancelar', 'cancela', 'nao', 'não', 'deixa pra la'];
    const normalized = normalizeText(value.trim());

    if (pendingAction && confirmWords.some((word) => normalized === normalizeText(word) || normalized.includes(normalizeText(word)))) {
      await runAction(pendingAction);
      return;
    }

    if (pendingAction && cancelWords.some((word) => normalized === normalizeText(word) || normalized.includes(normalizeText(word)))) {
      setPendingAction(null);
      pushBot('Tudo bem, cancelei essa acao. Pode mandar a proxima tarefa.');
      return;
    }

    setThinking(true);
    try {
      const ai = await callAI(value, media?.url);
      const fallback = localPlan(value, media?.url);
      const plan = normalizeAction(ai?.action) ? ai : fallback;
      const action = normalizeAction(plan.action);

      if (action) {
        setPendingAction(action);
        pushBot(`${plan.reply || 'Preparei a acao.'}\n\nRevise e clique em Executar, ou digite "sim" para confirmar.`);
      } else {
        pushBot(plan.reply || fallback.reply || 'Entendi. Me diga exatamente o que voce quer que eu faca no app.');
      }
    } finally {
      setThinking(false);
    }
  }

  function submitMessage(value: string) {
    const text = value.trim();
    if (!text || thinking || saving) return;
    setInput('');
    setAttachmentsOpen(false);
    pushUser(text);
    void processMessage(text);
  }

  function handleMediaUploaded(url: string, kind: MediaKind) {
    if (!url) return;
    setAttachmentsOpen(false);
    setLatestMedia({ url, kind });
    pushUser(kind === 'image' ? 'Enviei uma imagem.' : kind === 'video' ? 'Enviei um video.' : 'Enviei um audio.', url, kind);
    pushBot('Recebi a midia. Agora me diga o que quer fazer com ela: criar anuncio, aviso, apostila ou usar como apoio em uma tarefa.');
  }

  function startVoiceInput() {
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Seu navegador nao liberou ditado por voz aqui. Use o campo de mensagem ou anexe um audio pelo clipe.');
      setAttachmentsOpen(true);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) submitMessage(transcript);
    };
    recognition.onerror = () => toast.error('Nao consegui ouvir agora. Tente novamente ou digite a mensagem.');
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function reset() {
    setInput('');
    setThinking(false);
    setSaving(false);
    setListening(false);
    setAttachmentsOpen(false);
    setLatestMedia(null);
    setPendingAction(null);
    setMessages([{ id: uid(), role: 'bot', text: 'Novo atendimento iniciado. Sou a Ella Ribeiro. Pode mandar qualquer tarefa do app em linguagem normal.', ts: Date.now() }]);
  }

  async function runAction(action: AppAction) {
    if (action.type === 'open_page') {
      const path = String(action.payload?.path || '/dashboard');
      setPendingAction(null);
      pushBot(`Abrindo ${path}.`);
      navigate(path);
      return;
    }

    if (!isAdmin) {
      toast.error('Apenas admins podem executar acoes administrativas');
      return;
    }
    setSaving(true);
    try {
      const payload = action.payload || {};

      if (action.type === 'create_ad') {
        if (!payload.title) throw new Error('O anuncio precisa de um titulo.');
        const { error } = await supabase.from('ads').insert({
          title: payload.title,
          description: payload.description || null,
          image_url: payload.image_url || latestMedia?.url || null,
          link_url: payload.link_url || null,
          ad_type: payload.ad_type || 'banner',
          display_duration: payload.display_duration || 5,
          is_active: payload.is_active ?? true,
          created_by: user?.id,
        });
        if (error) throw error;
      }

      if (action.type === 'create_reminder') {
        if (!payload.title || !payload.event_date) throw new Error('O lembrete precisa de titulo e data.');
        const { error } = await supabase.from('calendar_events').insert({
          title: payload.title,
          description: payload.description || null,
          event_date: payload.event_date,
          event_time: payload.event_time || null,
          event_type: payload.event_type || 'deadline',
          subject: payload.subject || null,
          created_by: user?.id,
        });
        if (error) throw error;
      }

      if (action.type === 'delete_reminder') {
        const query = String(payload.query || action.summary || '').trim();
        if (!query) throw new Error('Diga qual lembrete devo remover.');
        const { data, error } = await supabase
          .from('calendar_events')
          .select('id,title,event_date')
          .or(`title.ilike.%${query}%,subject.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);
        if (error) throw error;
        if (!data?.length) throw new Error('Nao encontrei um lembrete com esse termo.');
        if (data.length > 1) {
          const list = data.map((item: any) => `- ${item.title} (${item.event_date})`).join('\n');
          setPendingAction(null);
          pushBot(`Encontrei mais de um lembrete. Me diga o titulo exato para eu remover:\n${list}`);
          return;
        }
        const { error: deleteError } = await supabase.from('calendar_events').delete().eq('id', data[0].id);
        if (deleteError) throw deleteError;
      }

      if (action.type === 'create_announcement') {
        if (!payload.title || !payload.content) throw new Error('O aviso precisa de titulo e conteudo.');
        const { error } = await supabase.from('announcements').insert({
          title: payload.title,
          content: payload.content,
          category: payload.category || 'geral',
          image_url: payload.image_url || latestMedia?.url || null,
          link_url: payload.link_url || null,
          published: payload.published ?? true,
          created_by: user?.id,
        });
        if (error) throw error;
      }

      if (action.type === 'create_apostila') {
        if (!payload.title) throw new Error('A apostila precisa de titulo.');
        const { error } = await supabase.from('apostilas').insert({
          title: payload.title,
          category: payload.category || 'ia',
          content: payload.content || makeApostilaContent(payload.title, ''),
          published: payload.published ?? false,
          source_type: 'ai_copilot',
          created_by: user?.id,
        });
        if (error) throw error;
      }

      if (action.type === 'send_push') {
        if (!payload.title || !payload.body) throw new Error('A notificacao precisa de titulo e mensagem.');
        const { data, error } = await supabase.functions.invoke('send-push', {
          body: {
            allUsers: true,
            title: payload.title,
            body: payload.body,
            link: payload.link || '/',
            type: 'admin_broadcast',
          },
        });
        if (error) throw error;
        if (data?.ok === false) throw new Error(data?.error || 'Falha ao enviar push.');
      }

      toast.success('Acao executada com sucesso');
      setPendingAction(null);
      pushBot(`Feito: ${ACTION_LABELS[action.type]}. A alteracao ja foi salva no app.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao executar acao');
      pushBot(`Nao consegui executar agora: ${error?.message || 'erro desconhecido'}.`);
    } finally {
      setSaving(false);
    }
  }

  function sendPushFromPanel() {
    if (!pushBody.trim()) {
      toast.error('Escreva a mensagem da notificacao');
      return;
    }
    void runAction({
      type: 'send_push',
      title: 'Enviar notificacao push',
      summary: `${pushTitle} - ${pushBody}`,
      payload: { title: pushTitle, body: pushBody, link: pushLink || '/', allUsers: true },
    });
  }

  const placeholder = listening ? 'Ouvindo...' : thinking ? 'Ella esta pensando...' : 'Peca para Ella criar, abrir, publicar ou organizar algo no app';

  return (
    <div className="app-command-shell grid h-[calc(100vh-132px)] min-h-[680px] overflow-hidden rounded-2xl border border-border bg-background shadow-sm lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="flex min-h-0 flex-col bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.09),transparent_34%),hsl(var(--background))]">
        <div className="flex min-h-20 shrink-0 items-center gap-3 border-b border-border/70 bg-card/85 px-4 py-3 backdrop-blur-xl">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-primary/35 bg-muted shadow-[0_10px_28px_hsl(var(--primary)/0.18)]">
            <img src={ELLA_AVATAR} alt="Ella Ribeiro" className="h-full w-full object-cover" />
            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-card bg-success" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold">Ella Ribeiro</h2>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">assistente do app</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {listening ? 'ouvindo sua voz...' : thinking ? 'lendo o pedido e preparando a acao...' : pendingAction ? 'aguardando confirmacao' : 'peca tarefas completas em linguagem normal'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={reset} className="h-9 w-9 rounded-xl" aria-label="Recomecar conversa">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" aria-label="Mais opcoes">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                data-ad-chat-message
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[76%] ${m.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border border-border/70 bg-card text-card-foreground'}`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.mediaUrl && m.mediaKind && renderMedia(m.mediaUrl, m.mediaKind)}
                  <div className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${m.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {m.role === 'user' && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.filter((message) => message.role === 'user').length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <PenTool className="h-3.5 w-3.5 text-primary" /> Exemplos prontos para testar a Ella
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => submitMessage(suggestion)}
                    className="rounded-xl border border-border/70 bg-card/80 p-3 text-left text-xs leading-relaxed text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {pendingAction && (
            <div className="max-w-2xl rounded-2xl border border-primary/35 bg-primary/5 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PendingIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="outline" className="mb-2">{ACTION_LABELS[pendingAction.type]}</Badge>
                  <h3 className="text-sm font-semibold">{pendingAction.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{pendingAction.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => runAction(pendingAction)} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Executar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setPendingAction(null); pushBot('Acao cancelada.'); }} disabled={saving}>Cancelar</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  <span>Ella preparando a resposta</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative shrink-0 border-t border-border/70 bg-card/90 px-3 py-3 backdrop-blur-xl">
          <AnimatePresence>
            {attachmentsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                className="absolute bottom-[76px] left-3 z-10 grid w-64 grid-cols-3 gap-2 rounded-2xl border border-border bg-popover p-3 shadow-xl"
              >
                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <AdImageUploadButton mediaType="image" label="Foto" showPreview={false} size="icon" className="h-12 w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onImageUploaded={(url) => handleMediaUploaded(url, 'image')} />
                  Foto
                </div>
                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <AdImageUploadButton mediaType="video" label="Video" showPreview={false} size="icon" className="h-12 w-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onImageUploaded={(url) => handleMediaUploaded(url, 'video')} />
                  Video
                </div>
                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <AdImageUploadButton mediaType="audio" label="Audio" showPreview={false} size="icon" className="h-12 w-12 rounded-xl bg-success text-success-foreground hover:opacity-90" onImageUploaded={(url) => handleMediaUploaded(url, 'audio')} />
                  Audio
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachmentsOpen((open) => !open)} className="mb-1 h-10 w-10 shrink-0 rounded-xl" aria-label="Anexar midia">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachmentsOpen(true)} className="mb-1 hidden h-10 w-10 shrink-0 rounded-xl sm:inline-flex" aria-label="Abrir anexos">
              <Camera className="h-5 w-5" />
            </Button>
            <div className="flex min-h-[46px] flex-1 items-end rounded-2xl border border-border bg-background px-3 py-1 focus-within:border-primary/50">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitMessage(input);
                  }
                }}
                placeholder={placeholder}
                disabled={thinking || saving || listening}
                className="min-h-[38px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] shadow-none focus-visible:ring-0"
                autoFocus
              />
            </div>
            {input.trim() ? (
              <Button onClick={() => submitMessage(input)} disabled={thinking || saving} size="icon" className="mb-1 h-11 w-11 shrink-0 rounded-2xl">
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button type="button" onClick={startVoiceInput} disabled={thinking || saving} size="icon" className={`mb-1 h-11 w-11 shrink-0 rounded-2xl ${listening ? 'bg-destructive hover:bg-destructive/90' : ''}`} aria-label={listening ? 'Parar voz' : 'Falar com Ella'}>
                {listening ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
      </section>

      <aside className="ops-panel hidden min-h-0 border-l border-border bg-card/60 p-4 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="mb-4 flex items-center gap-3">
          <img src={ELLA_AVATAR} alt="Ella Ribeiro" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-primary/35" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assistente operacional</p>
            <h3 className="text-base font-bold">O que Ella pode fazer</h3>
          </div>
        </div>

        <div className="grid gap-2">
          {[
            { icon: Megaphone, title: 'Anuncios persistentes', text: 'Cria banners, pop-ups, laterais, rodape e itens inline.' },
            { icon: ClipboardList, title: 'Avisos do app', text: 'Publica comunicados com texto, link e imagem.' },
            { icon: CalendarPlus, title: 'Agenda e lembretes', text: 'Adiciona ou remove eventos e provas.' },
            { icon: FileText, title: 'Apostilas', text: 'Gera rascunhos em markdown para revisao.' },
            { icon: BellRing, title: 'Push rapido', text: 'Envia notificacoes para usuarios cadastrados.' },
            { icon: Navigation, title: 'Navegacao', text: 'Abre telas do app quando voce pedir.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-background/75 p-4">
          <div className="mb-3 flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Push rapido</h4>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="push-title" className="text-xs">Titulo</Label>
              <Input id="push-title" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="push-body" className="text-xs">Mensagem</Label>
              <Textarea id="push-body" value={pushBody} onChange={(e) => setPushBody(e.target.value)} className="min-h-[82px] resize-none" placeholder="Ex: Aula ao vivo comeca em 10 minutos" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="push-link" className="text-xs">Link ao abrir</Label>
              <Input id="push-link" value={pushLink} onChange={(e) => setPushLink(e.target.value)} className="h-9" placeholder="/dashboard" />
            </div>
            <Button onClick={sendPushFromPanel} disabled={saving || !pushBody.trim()} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              Enviar para usuarios
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">Usuarios precisam ter ativado notificacoes no app para receber push no navegador.</p>
          </div>
        </div>

        {latestMedia && (
          <div className="mt-4 rounded-2xl border border-border bg-background/75 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4 text-primary" /> Midia recente</div>
            {renderMedia(latestMedia.url, latestMedia.kind)}
          </div>
        )}

        <Button variant="outline" className="mt-4 gap-2" onClick={() => window.open('https://decodeanalyticsacademydev.vercel.app', '_blank')}>
          <ExternalLink className="h-4 w-4" /> Abrir app publicado
        </Button>
      </aside>
    </div>
  );
}

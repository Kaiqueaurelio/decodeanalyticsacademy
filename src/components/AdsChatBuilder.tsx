import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Camera,
  Check,
  CheckCircle2,
  FileAudio,
  Image,
  Loader2,
  Mic,
  MoreVertical,
  Paperclip,
  RotateCcw,
  Send,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdImageUploadButton } from './AdImageUploadButton';

const supabase = supabaseTyped as any;

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';
type MediaKind = 'image' | 'video' | 'audio';

type Step =
  | 'type'
  | 'title'
  | 'description'
  | 'link'
  | 'image'
  | 'duration'
  | 'review'
  | 'done';

interface Msg {
  id: string;
  role: 'bot' | 'user';
  text: string;
  ts: number;
  mediaUrl?: string;
  mediaKind?: MediaKind;
}

interface Draft {
  ad_type: AdType;
  title: string;
  description: string;
  link_url: string;
  image_url: string;
  display_duration: number;
}

const EMPTY_DRAFT: Draft = {
  ad_type: 'banner',
  title: '',
  description: '',
  link_url: '',
  image_url: '',
  display_duration: 5,
};

const AD_TYPES: { value: AdType; label: string; desc: string }[] = [
  { value: 'banner', label: 'Banner', desc: 'Topo das paginas' },
  { value: 'popup', label: 'Popup', desc: 'Modal de destaque' },
  { value: 'inline', label: 'Inline', desc: 'No feed de conteudo' },
  { value: 'sidebar', label: 'Sidebar', desc: 'Lateral desktop' },
  { value: 'footer', label: 'Rodape', desc: 'Barra mobile' },
];

const STEP_ORDER: Step[] = ['type', 'title', 'description', 'link', 'image', 'duration', 'review'];

const PROMPTS: Record<Exclude<Step, 'done'>, string> = {
  type: 'Oi! Me diga qual formato voce quer para o anuncio.',
  title: 'Perfeito. Agora me manda o titulo do anuncio.',
  description: 'Agora manda uma descricao curta. Se nao quiser, toque em Pular.',
  link: 'Cola aqui o link de destino completo, com https://.',
  image: 'Agora anexe a midia do anuncio. Pode ser foto, video ou audio.',
  duration: 'Quantos segundos o popup deve ficar visivel? Escolha uma opcao ou digite um numero de 1 a 30.',
  review: 'Pronto. Confere abaixo e publica quando estiver tudo certo.',
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getMediaKind(url: string): MediaKind {
  const value = url.toLowerCase();
  if (/\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/.test(value)) return 'video';
  if (/\.(mp3|wav|m4a|ogg|aac|webm)(\?|#|$)/.test(value)) return 'audio';
  return 'image';
}

function renderMedia(url: string, kind: MediaKind, title = 'Midia do anuncio') {
  if (kind === 'video') {
    return <video src={url} controls playsInline className="mt-2 max-h-60 w-full rounded-lg bg-black object-contain" />;
  }

  if (kind === 'audio') {
    return (
      <div className="mt-2 rounded-lg bg-black/5 p-2 dark:bg-white/10">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }

  return <img src={url} alt={title} className="mt-2 max-h-60 w-full rounded-lg object-cover" />;
}

export function AdsChatBuilder() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>('type');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pushBot(PROMPTS.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, step, attachmentsOpen]);

  const currentIdx = step === 'done' ? STEP_ORDER.length : Math.max(STEP_ORDER.indexOf(step), 0) + 1;
  const mediaKind = useMemo(() => (draft.image_url ? getMediaKind(draft.image_url) : null), [draft.image_url]);

  function pushBot(text: string) {
    setMessages((m) => [...m, { id: uid(), role: 'bot', text, ts: Date.now() }]);
  }

  function pushUser(text: string, mediaUrl?: string, mediaKind?: MediaKind) {
    setMessages((m) => [...m, { id: uid(), role: 'user', text, ts: Date.now(), mediaUrl, mediaKind }]);
  }

  function advance(next: Step) {
    setStep(next);
    if (next !== 'done') pushBot(PROMPTS[next]);
  }

  function handleType(t: AdType) {
    const label = AD_TYPES.find((a) => a.value === t)?.label || t;
    setDraft((d) => ({ ...d, ad_type: t }));
    pushUser(label);
    advance('title');
  }

  function parseType(value: string): AdType | null {
    const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return AD_TYPES.find((t) => normalized.includes(t.value) || normalized.includes(t.label.toLowerCase()))?.value || null;
  }

  function submitDuration(value: string) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1 || n > 30) {
      toast.error('Informe um numero entre 1 e 30');
      return;
    }
    setDraft((d) => ({ ...d, display_duration: n }));
    pushUser(`${n}s`);
    advance('review');
  }

  function handleSendText() {
    const value = input.trim();
    if (!value || step === 'review' || step === 'done') return;
    setInput('');

    if (step === 'type') {
      const selected = parseType(value);
      if (!selected) {
        toast.error('Escolha: banner, popup, inline, sidebar ou rodape');
        return;
      }
      handleType(selected);
      return;
    }

    if (step === 'title') {
      if (value.length > 80) {
        toast.error('Titulo muito longo (max 80 caracteres)');
        return;
      }
      setDraft((d) => ({ ...d, title: value }));
      pushUser(value);
      advance('description');
      return;
    }

    if (step === 'description') {
      setDraft((d) => ({ ...d, description: value }));
      pushUser(value);
      advance('link');
      return;
    }

    if (step === 'link') {
      try {
        new URL(value);
      } catch {
        toast.error('URL invalida. Inclua https://');
        return;
      }
      setDraft((d) => ({ ...d, link_url: value }));
      pushUser(value);
      advance('image');
      return;
    }

    if (step === 'image') {
      pushUser(value);
      pushBot('Toque no clipe para anexar foto, video ou audio ao anuncio.');
      return;
    }

    if (step === 'duration') {
      submitDuration(value);
    }
  }

  function handleSkip() {
    if (step === 'description') {
      pushUser('Pular descricao');
      setDraft((d) => ({ ...d, description: '' }));
      advance('link');
    } else if (step === 'image') {
      pushUser('Sem midia');
      setDraft((d) => ({ ...d, image_url: '' }));
      advance('duration');
    }
  }

  function handleMediaUploaded(url: string, kind: MediaKind) {
    if (!url) return;
    setAttachmentsOpen(false);
    setDraft((d) => ({ ...d, image_url: url }));
    pushUser(kind === 'image' ? 'Foto anexada' : kind === 'video' ? 'Video anexado' : 'Audio anexado', url, kind);
    if (step === 'image') {
      advance('duration');
    } else if (step !== 'review' && step !== 'done') {
      pushBot('Recebi a midia. Vou usar esse arquivo como criativo principal do anuncio.');
    }
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setMessages([]);
    setInput('');
    setAttachmentsOpen(false);
    setStep('type');
    setTimeout(() => pushBot(PROMPTS.type), 50);
  }

  async function publish() {
    if (!isAdmin) {
      toast.error('Apenas admins podem publicar anuncios');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('ads').insert({
        title: draft.title,
        description: draft.description || null,
        image_url: draft.image_url || null,
        link_url: draft.link_url,
        ad_type: draft.ad_type,
        display_duration: draft.display_duration,
        is_active: true,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('Anuncio publicado!');
      pushBot('Publicado. O anuncio ja esta ativo no app.');
      setStep('done');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao publicar: ' + (e?.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  }

  const canType = step !== 'review' && step !== 'done';
  const placeholder =
    step === 'type'
      ? 'Mensagem'
      : step === 'title'
        ? 'Digite o titulo'
        : step === 'description'
          ? 'Digite a descricao'
          : step === 'link'
            ? 'Cole o link https://'
            : step === 'duration'
              ? 'Digite os segundos'
              : 'Mensagem';

  return (
    <div className="flex h-[calc(100vh-132px)] min-h-[640px] flex-col overflow-hidden rounded-lg border border-border bg-[#efeae2] shadow-sm dark:bg-[#0b141a]">
      <div className="flex h-16 shrink-0 items-center gap-3 bg-[#075e54] px-4 text-white dark:bg-[#202c33]">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <Bot className="h-5 w-5" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#075e54] bg-[#25d366] dark:border-[#202c33]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">Assistente de Anuncios</div>
          <div className="truncate text-xs text-white/75">online · etapa {Math.min(currentIdx, STEP_ORDER.length)} de {STEP_ORDER.length}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={reset} className="h-9 w-9 rounded-full text-white hover:bg-white/10 hover:text-white" aria-label="Recomecar">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-white hover:bg-white/10 hover:text-white" aria-label="Mais opcoes">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-6"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20px 20px, rgba(255,255,255,.18) 2px, transparent 0), radial-gradient(circle at 70px 70px, rgba(0,0,0,.04) 2px, transparent 0)',
          backgroundSize: '96px 96px',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`relative max-w-[86%] rounded-lg px-3 py-2 text-[13px] leading-relaxed shadow-sm sm:max-w-[68%] ${
                  m.role === 'user'
                    ? 'rounded-tr-none bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-white'
                    : 'rounded-tl-none bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.mediaUrl && m.mediaKind && renderMedia(m.mediaUrl, m.mediaKind)}
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.role === 'user' ? 'text-[#667781] dark:text-white/60' : 'text-[#667781]'}`}>
                  {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {m.role === 'user' && <Check className="h-3 w-3 text-[#53bdeb]" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {step === 'type' && (
          <div className="flex flex-wrap gap-2 pl-1 pt-2 sm:max-w-[70%]">
            {AD_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleType(t.value)}
                className="rounded-full bg-white px-3 py-2 text-left text-xs font-medium text-[#075e54] shadow-sm transition hover:bg-[#e7ffdb] dark:bg-[#202c33] dark:text-[#25d366] dark:hover:bg-[#263942]"
              >
                {t.label}
                <span className="ml-1 text-[10px] font-normal text-[#667781]">{t.desc}</span>
              </button>
            ))}
          </div>
        )}

        {(step === 'description' || step === 'image') && (
          <div className="flex gap-2 pl-1 pt-2">
            <button
              onClick={handleSkip}
              className="rounded-full bg-white px-3 py-2 text-xs font-medium text-[#075e54] shadow-sm hover:bg-[#e7ffdb] dark:bg-[#202c33] dark:text-[#25d366]"
            >
              Pular
            </button>
          </div>
        )}

        {step === 'duration' && (
          <div className="flex flex-wrap gap-2 pl-1 pt-2">
            {[5, 8, 10, 15].map((seconds) => (
              <button
                key={seconds}
                onClick={() => submitDuration(String(seconds))}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#075e54] shadow-sm hover:bg-[#e7ffdb] dark:bg-[#202c33] dark:text-[#25d366]"
              >
                {seconds}s
              </button>
            ))}
          </div>
        )}

        {step === 'review' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%] sm:max-w-md">
            <div className="rounded-lg rounded-tl-none bg-white p-3 text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-[#25d366]/15 text-[#075e54] hover:bg-[#25d366]/15 dark:text-[#25d366]">
                  {AD_TYPES.find((a) => a.value === draft.ad_type)?.label}
                </Badge>
                <Badge variant="outline">{draft.display_duration}s</Badge>
                {mediaKind && <Badge variant="outline">{mediaKind === 'image' ? 'foto' : mediaKind === 'video' ? 'video' : 'audio'}</Badge>}
              </div>
              {draft.image_url && mediaKind && renderMedia(draft.image_url, mediaKind, draft.title)}
              <div className="mt-3 font-semibold">{draft.title}</div>
              {draft.description && <div className="mt-1 text-sm text-[#667781] dark:text-[#aebac1]">{draft.description}</div>}
              <div className="mt-2 break-all text-xs text-[#667781] dark:text-[#aebac1]">{draft.link_url}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button onClick={publish} disabled={saving} className="gap-2 bg-[#128c7e] hover:bg-[#075e54]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Publicar
                </Button>
                <Button variant="outline" onClick={reset} disabled={saving}>
                  Recomecar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <div className="pt-2">
            <button onClick={reset} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#075e54] shadow-sm hover:bg-[#e7ffdb] dark:bg-[#202c33] dark:text-[#25d366]">
              Criar outro anuncio
            </button>
          </div>
        )}
      </div>

      <div className="relative shrink-0 bg-[#f0f2f5] px-3 py-2 dark:bg-[#202c33]">
        <AnimatePresence>
          {attachmentsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="absolute bottom-[72px] left-3 z-10 grid w-64 grid-cols-3 gap-2 rounded-2xl bg-white p-3 shadow-xl dark:bg-[#111b21]"
            >
              <div className="flex flex-col items-center gap-1 text-[11px] text-[#54656f] dark:text-[#aebac1]">
                <AdImageUploadButton
                  mediaType="image"
                  label="Foto"
                  showPreview={false}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-[#8f66ff] text-white hover:bg-[#7a55df]"
                  onImageUploaded={(url) => handleMediaUploaded(url, 'image')}
                />
                Foto
              </div>
              <div className="flex flex-col items-center gap-1 text-[11px] text-[#54656f] dark:text-[#aebac1]">
                <AdImageUploadButton
                  mediaType="video"
                  label="Video"
                  showPreview={false}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-[#ff2e74] text-white hover:bg-[#db285f]"
                  onImageUploaded={(url) => handleMediaUploaded(url, 'video')}
                />
                Video
              </div>
              <div className="flex flex-col items-center gap-1 text-[11px] text-[#54656f] dark:text-[#aebac1]">
                <AdImageUploadButton
                  mediaType="audio"
                  label="Audio"
                  showPreview={false}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-[#00a884] text-white hover:bg-[#008f72]"
                  onImageUploaded={(url) => handleMediaUploaded(url, 'audio')}
                />
                Audio
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setAttachmentsOpen((open) => !open)}
            className="mb-1 h-10 w-10 shrink-0 rounded-full text-[#54656f] hover:bg-black/5 dark:text-[#aebac1] dark:hover:bg-white/10"
            aria-label="Anexar midia"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setAttachmentsOpen(true)}
            className="mb-1 hidden h-10 w-10 shrink-0 rounded-full text-[#54656f] hover:bg-black/5 dark:text-[#aebac1] dark:hover:bg-white/10 sm:inline-flex"
            aria-label="Abrir camera"
          >
            <Camera className="h-5 w-5" />
          </Button>
          <div className="flex min-h-[44px] flex-1 items-end rounded-3xl bg-white px-3 py-1 dark:bg-[#2a3942]">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder={canType ? placeholder : 'Conversa finalizada'}
              disabled={!canType}
              className="min-h-[36px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] shadow-none focus-visible:ring-0 dark:text-[#e9edef]"
              autoFocus
            />
          </div>
          {input.trim() ? (
            <Button onClick={handleSendText} disabled={!canType} size="icon" className="mb-1 h-11 w-11 shrink-0 rounded-full bg-[#00a884] hover:bg-[#008f72]">
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setAttachmentsOpen(true)}
              disabled={!canType}
              size="icon"
              className="mb-1 h-11 w-11 shrink-0 rounded-full bg-[#00a884] hover:bg-[#008f72]"
              aria-label="Enviar audio"
            >
              {step === 'image' ? <Image className="h-5 w-5" /> : step === 'duration' ? <FileAudio className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

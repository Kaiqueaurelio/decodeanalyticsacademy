import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Image,
  Video,
  Mic,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  { value: 'banner', label: 'Banner', desc: 'Faixa fixa no topo das paginas' },
  { value: 'popup', label: 'Popup', desc: 'Modal centralizado de destaque' },
  { value: 'inline', label: 'Inline', desc: 'Card dentro do feed de conteudo' },
  { value: 'sidebar', label: 'Sidebar', desc: 'Card lateral em telas amplas' },
  { value: 'footer', label: 'Rodape', desc: 'Faixa fixa no rodape mobile' },
];

const STEP_ORDER: Step[] = ['type', 'title', 'description', 'link', 'image', 'duration', 'review'];

const PROMPTS: Record<Exclude<Step, 'done'>, string> = {
  type: 'Oi! Vamos criar um anuncio como numa conversa. Escolha o formato abaixo ou digite banner, popup, inline, sidebar ou rodape.',
  title: 'Agora me mande o titulo do anuncio. Curto e direto funciona melhor.',
  description: 'Mande uma descricao curta ou toque em Pular.',
  link: 'Cole o link de destino completo, com https://.',
  image: 'Agora anexe a midia principal do anuncio: foto, video ou audio. Se preferir, pode pular.',
  duration: 'Por quantos segundos o popup deve ficar visivel? Use um numero de 1 a 30.',
  review: 'Conferi tudo. Revise o anuncio abaixo e publique quando estiver pronto.',
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
    return <video src={url} controls className="mt-2 max-h-56 w-full rounded-xl bg-black object-contain" />;
  }
  if (kind === 'audio') {
    return (
      <div className="mt-2 rounded-xl border border-white/10 bg-background/80 p-2">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }
  return <img src={url} alt={title} className="mt-2 max-h-56 w-full rounded-xl object-cover" />;
}

export function AdsChatBuilder() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>('type');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pushBot(PROMPTS.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, step]);

  const currentIdx = step === 'done' ? STEP_ORDER.length : Math.max(STEP_ORDER.indexOf(step), 0);
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
    pushUser(`Formato: ${label}`);
    advance('title');
  }

  function parseType(value: string): AdType | null {
    const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return AD_TYPES.find((t) => normalized.includes(t.value) || normalized.includes(t.label.toLowerCase()))?.value || null;
  }

  function handleSendText() {
    const value = input.trim();
    if (!value) return;
    setInput('');

    if (step === 'type') {
      const selected = parseType(value);
      if (!selected) {
        toast.error('Escolha um formato valido: banner, popup, inline, sidebar ou rodape');
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
      pushBot('Para usar arquivo no anuncio, toque em foto, video ou audio aqui embaixo.');
      return;
    }

    if (step === 'duration') {
      const n = parseInt(value, 10);
      if (!Number.isFinite(n) || n < 1 || n > 30) {
        toast.error('Informe um numero entre 1 e 30');
        return;
      }
      setDraft((d) => ({ ...d, display_duration: n }));
      pushUser(`${n}s`);
      advance('review');
    }
  }

  function handleSkip() {
    if (step === 'description') {
      pushUser('Sem descricao');
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
    setDraft((d) => ({ ...d, image_url: url }));
    pushUser(`${kind === 'image' ? 'Foto' : kind === 'video' ? 'Video' : 'Audio'} anexado`, url, kind);
    if (step === 'image') {
      advance('duration');
    } else if (step !== 'review' && step !== 'done') {
      pushBot('Midia recebida. Vou usar esse arquivo como criativo principal do anuncio.');
    }
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setMessages([]);
    setInput('');
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
      pushBot('Anuncio publicado com sucesso. Ele ja esta ativo no app.');
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
      ? 'Digite o formato ou escolha acima...'
      : step === 'title'
        ? 'Titulo do anuncio...'
        : step === 'description'
          ? 'Descricao curta...'
          : step === 'link'
            ? 'https://...'
            : step === 'duration'
              ? 'Ex: 5'
              : 'Escreva uma mensagem...';

  return (
    <div className="flex h-[calc(100vh-150px)] min-h-[620px] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Assistente de Anuncios</span>
            <Badge variant="secondary" className="h-5 text-[10px]">chat</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">Envie texto, foto, video ou audio para montar o anuncio</p>
        </div>
        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < currentIdx ? 'bg-primary' : i === currentIdx ? 'bg-primary/60' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Recomecar">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/20 px-4 py-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'bot' && (
                <div className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-background text-foreground border border-border/70'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.mediaUrl && m.mediaKind && renderMedia(m.mediaUrl, m.mediaKind)}
                <p className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {m.role === 'user' && (
                <div className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {step === 'type' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {AD_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleType(t.value)}
                className="rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </motion.div>
        )}

        {(step === 'description' || step === 'image') && (
          <div className="ml-10 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleSkip}>
              Pular
            </Button>
          </div>
        )}

        {step === 'duration' && (
          <div className="ml-10 flex flex-wrap gap-2">
            {[5, 8, 10, 15].map((seconds) => (
              <Button key={seconds} variant="secondary" size="sm" onClick={() => { setInput(String(seconds)); setTimeout(handleSendText, 0); }}>
                {seconds}s
              </Button>
            ))}
          </div>
        )}

        {step === 'review' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-10 max-w-xl">
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{AD_TYPES.find((a) => a.value === draft.ad_type)?.label}</Badge>
                <Badge variant="outline">{draft.display_duration}s</Badge>
                {mediaKind && <Badge variant="outline">{mediaKind === 'image' ? 'foto' : mediaKind === 'video' ? 'video' : 'audio'}</Badge>}
              </div>
              {draft.image_url && mediaKind && renderMedia(draft.image_url, mediaKind, draft.title)}
              <div>
                <div className="font-semibold">{draft.title}</div>
                {draft.description && <div className="mt-1 text-sm text-muted-foreground">{draft.description}</div>}
              </div>
              <div className="break-all text-xs text-muted-foreground">Destino: {draft.link_url}</div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button onClick={publish} disabled={saving} className="flex-1 gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Publicar anuncio
                </Button>
                <Button variant="outline" onClick={reset} disabled={saving}>
                  Recomecar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10">
            <Button onClick={reset} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" /> Criar outro anuncio
            </Button>
          </motion.div>
        )}
      </div>

      <div className="border-t border-border/60 bg-background p-3">
        <div className="mb-2 flex items-center gap-2">
          <AdImageUploadButton
            mediaType="image"
            label="Foto"
            showPreview={false}
            size="sm"
            className="gap-1.5 rounded-full"
            onImageUploaded={(url) => handleMediaUploaded(url, 'image')}
          />
          <AdImageUploadButton
            mediaType="video"
            label="Video"
            showPreview={false}
            size="sm"
            className="gap-1.5 rounded-full"
            onImageUploaded={(url) => handleMediaUploaded(url, 'video')}
          />
          <AdImageUploadButton
            mediaType="audio"
            label="Audio"
            showPreview={false}
            size="sm"
            className="gap-1.5 rounded-full"
            onImageUploaded={(url) => handleMediaUploaded(url, 'audio')}
          />
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted sm:flex">
            {step === 'image' ? <Image className="h-4 w-4" /> : step === 'duration' ? <Mic className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </div>
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
            className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
            autoFocus
          />
          <Button onClick={handleSendText} disabled={!canType || !input.trim()} size="icon" className="h-10 w-10 shrink-0 rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  Sparkles,
  Square,
  Wand2,
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
type Step = 'type' | 'title' | 'link' | 'review' | 'done';

interface Msg {
  id: string;
  role: 'bot' | 'user';
  text: string;
  ts: number;
  mediaUrl?: string;
  mediaKind?: MediaKind;
}

interface Draft {
  ad_type: AdType | '';
  title: string;
  description: string;
  link_url: string;
  image_url: string;
  display_duration: number;
}

interface AIResult {
  reply?: string;
  updates?: Partial<Draft>;
  ready_to_review?: boolean;
}

const EMPTY_DRAFT: Draft = {
  ad_type: '',
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

const AD_TYPE_LABELS: Record<AdType, string> = {
  banner: 'Banner',
  popup: 'Popup',
  inline: 'Inline',
  sidebar: 'Sidebar',
  footer: 'Rodape',
};

const SUGGESTIONS = [
  'Crie um popup para divulgar minha mentoria com titulo Semana da Aprovacao',
  'Quero um banner no topo chamando para uma aula gratuita',
  'Troque o texto para ficar mais direto e persuasivo',
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

function getMissingField(draft: Draft): Step | null {
  if (!draft.ad_type) return 'type';
  if (!draft.title.trim()) return 'title';
  if (!draft.link_url.trim()) return 'link';
  return null;
}

function getStepFromDraft(draft: Draft): Step {
  return getMissingField(draft) || 'review';
}

function isReady(draft: Draft) {
  return Boolean(draft.ad_type && draft.title.trim() && draft.link_url.trim());
}

function extractJson(text: string): AIResult | null {
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

function renderMedia(url: string, kind: MediaKind, title = 'Midia do anuncio') {
  if (kind === 'video') {
    return <video src={url} controls playsInline className="mt-3 max-h-64 w-full rounded-xl bg-black object-contain" />;
  }

  if (kind === 'audio') {
    return (
      <div className="mt-3 rounded-xl border border-border/60 bg-background/60 p-2">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }

  return <img src={url} alt={title} className="mt-3 max-h-64 w-full rounded-xl object-cover" />;
}

function parseType(value: string): AdType | null {
  const normalized = normalizeText(value);
  if (normalized.includes('pop')) return 'popup';
  if (normalized.includes('rodape') || normalized.includes('footer') || normalized.includes('baixo')) return 'footer';
  if (normalized.includes('side') || normalized.includes('lateral')) return 'sidebar';
  if (normalized.includes('inline') || normalized.includes('feed') || normalized.includes('conteudo')) return 'inline';
  if (normalized.includes('banner') || normalized.includes('topo')) return 'banner';
  return null;
}

function cleanCapturedText(value: string) {
  return value.replace(/https?:\/\/[^\s)]+/gi, '').replace(/\s+/g, ' ').trim();
}

function localExtract(message: string, draft: Draft): Partial<Draft> {
  const updates: Partial<Draft> = {};
  const normalized = normalizeText(message);
  const type = parseType(message);
  if (type) updates.ad_type = type;

  const urlMatch = message.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) updates.link_url = urlMatch[0].replace(/[.,;!?]+$/, '');

  const secondsMatch = normalized.match(/(?:por|durante|fica|ficar|dura|durar)?\s*(\d{1,2})\s*(?:s|seg|segundos?)/);
  if (secondsMatch) updates.display_duration = Math.max(1, Math.min(30, Number(secondsMatch[1])));

  const titleMatch = message.match(/(?:titulo|título|chama|chamar|nome)\s*(?:é|e|:|-)?\s*["“']?([^"”'\n.]{3,90})/i);
  if (titleMatch) updates.title = titleMatch[1].trim();

  const descriptionMatch = message.match(/(?:descri[cç][aã]o|texto|subtitulo|subtítulo|copy|legenda)\s*(?:é|e|:|-)?\s*["“']?([^"”'\n]{3,220})/i);
  if (descriptionMatch) updates.description = descriptionMatch[1].trim();

  if (/\b(sem descricao|sem descrição|remove a descricao|remove a descrição)\b/.test(normalized)) {
    updates.description = '';
  }

  if (!updates.title && !draft.title.trim()) {
    const short = cleanCapturedText(message);
    const commandOnly = /^(quero|crie|criar|fazer|faca|faça|preciso|pode|anuncio|anúncio|banner|popup|inline|sidebar|rodape|footer)\b/i.test(short);
    if (short.length >= 8 && short.length <= 80 && !commandOnly) {
      updates.title = short.replace(/[.!?]+$/, '').trim();
    }
  }

  return updates;
}

function localReply(draft: Draft, hadUpdates: boolean) {
  const missing = getMissingField(draft);
  if (missing === 'type') return 'Consigo montar isso. Qual formato voce prefere: banner, popup, inline, sidebar ou rodape?';
  if (missing === 'title') return 'Perfeito. Me diga o titulo principal do anuncio. Pode escrever do seu jeito.';
  if (missing === 'link') return 'Boa, ja entendi a ideia. Agora me mande o link de destino com https:// para eu fechar a previa.';
  if (hadUpdates) return 'Atualizei o rascunho. Pode continuar pedindo ajustes como se estivesse conversando comigo.';
  return 'Estou acompanhando. Me diga o que voce quer mudar no anuncio ou publique quando estiver pronto.';
}

function mergeDraft(base: Draft, updates?: Partial<Draft>) {
  const next = { ...base };
  if (!updates) return next;
  if (updates.ad_type && AD_TYPES.some((type) => type.value === updates.ad_type)) next.ad_type = updates.ad_type;
  if (typeof updates.title === 'string') next.title = updates.title.trim().slice(0, 90);
  if (typeof updates.description === 'string') next.description = updates.description.trim().slice(0, 240);
  if (typeof updates.link_url === 'string' && updates.link_url.trim()) next.link_url = updates.link_url.trim();
  if (typeof updates.image_url === 'string') next.image_url = updates.image_url.trim();
  if (typeof updates.display_duration === 'number' && Number.isFinite(updates.display_duration)) {
    next.display_duration = Math.max(1, Math.min(30, Math.round(updates.display_duration)));
  }
  return next;
}

export function AdsChatBuilder() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>('type');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const draftRef = useRef<Draft>(EMPTY_DRAFT);
  const messagesRef = useRef<Msg[]>([]);

  useEffect(() => {
    const intro = 'Oi, eu sou seu assistente de anuncios. Pode falar livremente: me diga o objetivo, o formato, o titulo, a copy, o link e mande midia pelo clipe quando quiser. Eu vou montando o rascunho com voce.';
    setMessages([{ id: uid(), role: 'bot', text: intro, ts: Date.now() }]);
  }, []);

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, attachmentsOpen, thinking]);

  const mediaKind = useMemo(() => (draft.image_url ? getMediaKind(draft.image_url) : null), [draft.image_url]);
  const missing = getMissingField(draft);
  const showSuggestions = messages.filter((message) => message.role === 'user').length === 0;

  function pushBot(text: string) {
    setMessages((m) => [...m, { id: uid(), role: 'bot', text, ts: Date.now() }]);
  }

  function pushUser(text: string, mediaUrl?: string, mediaKind?: MediaKind) {
    setMessages((m) => [...m, { id: uid(), role: 'user', text, ts: Date.now(), mediaUrl, mediaKind }]);
  }

  async function callAI(userMessage: string, baseDraft: Draft): Promise<AIResult | null> {
    try {
      const { getCurrentAccessToken } = await import('@/lib/auth-session');
      const accessToken = getCurrentAccessToken();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-direct`;
      const recent = messagesRef.current.slice(-8).map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          systemPrompt: [
            'Voce e um copilot brasileiro para criar anuncios dentro de um painel administrativo.',
            'Converse de forma natural, curta e util, como um GPT de produto. Nao prenda o usuario em botoes.',
            'Extraia e atualize o rascunho quando o usuario falar formato, titulo, texto, link, tempo ou midia.',
            'Campos validos: ad_type banner|popup|inline|sidebar|footer, title, description, link_url, image_url, display_duration de 1 a 30.',
            'Obrigatorios para publicar: ad_type, title, link_url. Se faltar algo, faca so uma pergunta objetiva.',
            'Se o usuario pedir ideias, sugira copy e CTA. Se pedir alteracao, atualize somente o necessario.',
            'Responda SOMENTE JSON valido neste formato:',
            '{"reply":"mensagem curta em portugues","updates":{},"ready_to_review":false}',
          ].join('\n'),
          messages: [
            ...recent,
            { role: 'user', content: `Rascunho atual: ${JSON.stringify(baseDraft)}\nMensagem atual: ${userMessage}` },
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
          if (json === '[DONE]') {
            done = true;
            break;
          }
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
      console.warn('AI ad chat fallback:', error);
      return null;
    }
  }

  async function processFreeMessage(value: string) {
    const base = draftRef.current;
    setThinking(true);
    try {
      const localUpdates = localExtract(value, base);
      const localDraft = mergeDraft(base, localUpdates);
      setDraft(localDraft);
      setStep(getStepFromDraft(localDraft));

      const ai = await callAI(value, localDraft);
      const nextDraft = mergeDraft(localDraft, ai?.updates);
      setDraft(nextDraft);
      setStep(ai?.ready_to_review || isReady(nextDraft) ? 'review' : getStepFromDraft(nextDraft));
      pushBot(ai?.reply?.trim() || localReply(nextDraft, Object.keys(localUpdates).length > 0));
    } finally {
      setThinking(false);
    }
  }

  function submitMessage(value: string) {
    const text = value.trim();
    if (!text || thinking || step === 'done') return;
    setInput('');
    setAttachmentsOpen(false);
    pushUser(text);
    void processFreeMessage(text);
  }

  function handleType(t: AdType) {
    const label = AD_TYPE_LABELS[t];
    submitMessage(`Use o formato ${label}.`);
  }

  function handleMediaUploaded(url: string, kind: MediaKind) {
    if (!url) return;
    setAttachmentsOpen(false);
    const next = mergeDraft(draftRef.current, { image_url: url });
    setDraft(next);
    setStep(isReady(next) ? 'review' : getStepFromDraft(next));
    pushUser(kind === 'image' ? 'Enviei uma foto para o anuncio' : kind === 'video' ? 'Enviei um video para o anuncio' : 'Enviei um audio para o anuncio', url, kind);
    pushBot(isReady(next) ? 'Midia recebida. Atualizei a previa; se quiser, posso ajustar a copy para combinar com ela.' : localReply(next, true));
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
    recognition.onerror = () => {
      toast.error('Nao consegui ouvir agora. Tente novamente ou digite a mensagem.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    draftRef.current = EMPTY_DRAFT;
    setInput('');
    setThinking(false);
    setListening(false);
    setAttachmentsOpen(false);
    setStep('type');
    setMessages([{ id: uid(), role: 'bot', text: 'Novo anuncio iniciado. Me conte livremente o que voce quer divulgar.', ts: Date.now() }]);
  }

  async function publish() {
    if (!isAdmin) {
      toast.error('Apenas admins podem publicar anuncios');
      return;
    }
    if (!draft.ad_type || !draft.title.trim() || !draft.link_url.trim()) {
      toast.error('Ainda falta formato, titulo ou link do anuncio');
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

  const canType = step !== 'done' && !thinking;
  const placeholder = listening ? 'Ouvindo...' : thinking ? 'A IA esta respondendo...' : 'Converse com a IA sobre o anuncio';

  return (
    <div className="grid h-[calc(100vh-132px)] min-h-[660px] overflow-hidden rounded-2xl border border-border bg-background shadow-sm lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-h-0 flex-col bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_35%),hsl(var(--background))]">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-card/80 px-4 backdrop-blur-xl">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_28px_hsl(var(--primary)/0.25)]">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-bold">Assistente de Anuncios</h2>
              <Badge variant="outline" className="hidden h-5 px-1.5 text-[10px] sm:inline-flex">chat livre</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {listening ? 'ouvindo sua voz...' : thinking ? 'pensando na melhor resposta...' : isReady(draft) ? 'rascunho pronto para revisar' : 'fale, digite ou envie midia'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={reset} className="h-9 w-9 rounded-xl" aria-label="Recomecar">
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
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[72%] ${m.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border border-border/70 bg-card text-card-foreground'}`}>
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

          {showSuggestions && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Comece com uma mensagem pronta ou escreva do seu jeito
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => submitMessage(suggestion)}
                    className="rounded-2xl border border-border/70 bg-card/70 p-3 text-left text-xs leading-relaxed text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {!draft.ad_type && !showSuggestions && (
            <div className="flex flex-wrap gap-2">
              {AD_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleType(t.value)}
                  className="rounded-full border border-border/70 bg-card px-3 py-2 text-left text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/10"
                >
                  {t.label}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          )}

          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
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

        <div className="relative shrink-0 border-t border-border/70 bg-card/85 px-3 py-3 backdrop-blur-xl">
          <AnimatePresence>
            {attachmentsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                className="absolute bottom-[76px] left-3 z-10 grid w-64 grid-cols-3 gap-2 rounded-2xl border border-border bg-popover p-3 shadow-xl"
              >
                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <AdImageUploadButton mediaType="image" label="Foto" showPreview={false} size="icon" className="h-12 w-12 rounded-2xl bg-[#8f66ff] text-white hover:bg-[#7a55df]" onImageUploaded={(url) => handleMediaUploaded(url, 'image')} />
                  Foto
                </div>
                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <AdImageUploadButton mediaType="video" label="Video" showPreview={false} size="icon" className="h-12 w-12 rounded-2xl bg-[#ff2e74] text-white hover:bg-[#db285f]" onImageUploaded={(url) => handleMediaUploaded(url, 'video')} />
                  Video
                </div>
                <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                  <AdImageUploadButton mediaType="audio" label="Audio" showPreview={false} size="icon" className="h-12 w-12 rounded-2xl bg-[#00a884] text-white hover:bg-[#008f72]" onImageUploaded={(url) => handleMediaUploaded(url, 'audio')} />
                  Audio
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachmentsOpen((open) => !open)} className="mb-1 h-10 w-10 shrink-0 rounded-xl" aria-label="Anexar midia">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachmentsOpen(true)} className="mb-1 hidden h-10 w-10 shrink-0 rounded-xl sm:inline-flex" aria-label="Abrir anexos de imagem e video">
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
                disabled={!canType || listening}
                className="min-h-[38px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] shadow-none focus-visible:ring-0"
                autoFocus
              />
            </div>
            {input.trim() ? (
              <Button onClick={() => submitMessage(input)} disabled={!canType} size="icon" className="mb-1 h-11 w-11 shrink-0 rounded-2xl">
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button type="button" onClick={startVoiceInput} disabled={step === 'done' || thinking} size="icon" className={`mb-1 h-11 w-11 shrink-0 rounded-2xl ${listening ? 'bg-destructive hover:bg-destructive/90' : ''}`} aria-label={listening ? 'Parar gravacao de voz' : 'Falar com a IA'}>
                {listening ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
      </section>

      <aside className="hidden min-h-0 border-l border-border bg-card/55 p-4 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rascunho vivo</p>
            <h3 className="text-base font-bold">Previa do anuncio</h3>
          </div>
          <Badge variant={isReady(draft) ? 'default' : 'outline'}>{isReady(draft) ? 'pronto' : 'incompleto'}</Badge>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-background/70 p-4 shadow-inner">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline">{draft.ad_type ? AD_TYPE_LABELS[draft.ad_type] : 'formato pendente'}</Badge>
            <Badge variant="outline">{draft.display_duration}s</Badge>
            {mediaKind && <Badge variant="outline">{mediaKind === 'image' ? 'foto' : mediaKind === 'video' ? 'video' : 'audio'}</Badge>}
          </div>
          {draft.image_url && mediaKind && renderMedia(draft.image_url, mediaKind, draft.title)}
          <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{draft.ad_type ? AD_TYPE_LABELS[draft.ad_type] : 'Novo anuncio'}</p>
            <h4 className="mt-2 text-lg font-bold leading-tight">{draft.title || 'Titulo ainda nao definido'}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{draft.description || 'A descricao aparece aqui quando voce pedir ou enviar uma copy.'}</p>
            <p className="mt-3 break-all text-xs text-muted-foreground">{draft.link_url || 'https://link-do-anuncio.com'}</p>
          </div>

          {!isReady(draft) && (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
              Falta: {missing === 'type' ? 'formato do anuncio' : missing === 'title' ? 'titulo principal' : missing === 'link' ? 'link de destino' : 'revisao'}.
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={publish} disabled={!isReady(draft) || saving || step === 'done'} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Publicar
          </Button>
          <Button variant="outline" onClick={reset} disabled={saving}>Novo</Button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Antes de publicar, voce pode pedir: mudar formato, encurtar texto, melhorar CTA, trocar link ou ajustar tempo.
        </p>
      </aside>
    </div>
  );
}

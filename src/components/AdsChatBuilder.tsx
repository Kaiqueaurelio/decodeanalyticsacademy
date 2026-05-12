import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdImageUploadButton } from './AdImageUploadButton';

const supabase = supabaseTyped as any;

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';

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
  { value: 'banner', label: 'Banner', desc: 'Faixa fixa no topo das páginas' },
  { value: 'popup', label: 'Popup', desc: 'Modal centralizado de destaque' },
  { value: 'inline', label: 'Inline', desc: 'Card dentro do feed de conteúdo' },
  { value: 'sidebar', label: 'Sidebar', desc: 'Card lateral em telas amplas' },
  { value: 'footer', label: 'Rodapé', desc: 'Faixa fixa no rodapé mobile' },
];

const STEP_ORDER: Step[] = ['type', 'title', 'description', 'link', 'image', 'duration', 'review'];

const PROMPTS: Record<Exclude<Step, 'done'>, string> = {
  type: 'Olá! Vou te ajudar a criar um anúncio em poucos passos. Pra começar, qual o **formato** do anúncio?',
  title: 'Beleza! Qual o **título** do anúncio? (curto e direto, até 60 caracteres)',
  description: 'Quer adicionar uma **descrição** ou subtítulo? Você pode pular.',
  link: 'Qual a **URL de destino** quando o aluno clicar? (cole o link completo, com https://)',
  image: 'Agora envie a **imagem** do anúncio (opcional, mas recomendado).',
  duration: 'Por quantos **segundos** o popup deve ficar visível antes de fechar sozinho? (1 a 30)',
  review: 'Pronto! Confira o anúncio abaixo. Se estiver tudo certo, clique em **Publicar**.',
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

  function pushBot(text: string) {
    setMessages((m) => [...m, { id: uid(), role: 'bot', text, ts: Date.now() }]);
  }
  function pushUser(text: string) {
    setMessages((m) => [...m, { id: uid(), role: 'user', text, ts: Date.now() }]);
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

  function handleSendText() {
    const value = input.trim();
    if (!value) return;
    setInput('');

    if (step === 'title') {
      if (value.length > 80) {
        toast.error('Título muito longo (máx 80)');
        return;
      }
      setDraft((d) => ({ ...d, title: value }));
      pushUser(value);
      advance('description');
    } else if (step === 'description') {
      setDraft((d) => ({ ...d, description: value }));
      pushUser(value);
      advance('link');
    } else if (step === 'link') {
      try {
        new URL(value);
      } catch {
        toast.error('URL inválida. Inclua https://');
        return;
      }
      setDraft((d) => ({ ...d, link_url: value }));
      pushUser(value);
      advance('image');
    } else if (step === 'duration') {
      const n = parseInt(value, 10);
      if (!Number.isFinite(n) || n < 1 || n > 30) {
        toast.error('Informe um número entre 1 e 30');
        return;
      }
      setDraft((d) => ({ ...d, display_duration: n }));
      pushUser(`${n}s`);
      advance('review');
    }
  }

  function handleSkip() {
    if (step === 'description') {
      pushUser('— sem descrição');
      setDraft((d) => ({ ...d, description: '' }));
      advance('link');
    } else if (step === 'image') {
      pushUser('— sem imagem');
      advance('duration');
    }
  }

  function handleImageUploaded(url: string) {
    if (!url) return;
    setDraft((d) => ({ ...d, image_url: url }));
    pushUser('Imagem enviada ✔');
    advance('duration');
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setMessages([]);
    setStep('type');
    setTimeout(() => pushBot(PROMPTS.type), 50);
  }

  async function publish() {
    if (!isAdmin) {
      toast.error('Apenas admins podem publicar anúncios');
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
      toast.success('Anúncio publicado!');
      pushBot('🎉 Anúncio publicado com sucesso! Já está ativo no app.');
      setStep('done');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao publicar: ' + (e?.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  }

  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Progress */}
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2 flex-wrap">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Assistente de Anúncios</span>
        <div className="flex items-center gap-1 ml-auto">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < currentIdx ? 'bg-primary' : i === currentIdx ? 'bg-primary/60' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Recomeçar
        </Button>
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'bot' && (
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                }`}
                dangerouslySetInnerHTML={{
                  __html: m.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                }}
              />
              {m.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Step-specific UI */}
        {step === 'type' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10">
            {AD_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleType(t.value)}
                className="text-left p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
              </button>
            ))}
          </motion.div>
        )}

        {step === 'image' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10">
            <Card className="p-4">
              <AdImageUploadButton onImageUploaded={handleImageUploaded} />
              <Button variant="ghost" size="sm" onClick={handleSkip} className="mt-3">
                Pular esta etapa
              </Button>
            </Card>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{AD_TYPES.find((a) => a.value === draft.ad_type)?.label}</Badge>
                <Badge variant="outline">{draft.display_duration}s</Badge>
              </div>
              {draft.image_url && (
                <img src={draft.image_url} alt="" className="w-full max-h-40 object-cover rounded-lg" />
              )}
              <div>
                <div className="font-semibold">{draft.title}</div>
                {draft.description && (
                  <div className="text-sm text-muted-foreground mt-1">{draft.description}</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground break-all">→ {draft.link_url}</div>
              <div className="flex gap-2 pt-2">
                <Button onClick={publish} disabled={saving} className="gap-2 flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Publicar anúncio
                </Button>
                <Button variant="outline" onClick={reset} disabled={saving}>
                  Recomeçar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10">
            <Button onClick={reset} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" /> Criar outro anúncio
            </Button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {(step === 'title' || step === 'description' || step === 'link' || step === 'duration') && (
        <div className="border-t border-border/60 p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText();
              }
            }}
            placeholder={
              step === 'title'
                ? 'Ex: Curso de Python — 50% OFF'
                : step === 'description'
                ? 'Ex: Aulas ao vivo + projetos...'
                : step === 'link'
                ? 'https://...'
                : 'Ex: 5'
            }
            type={step === 'duration' ? 'number' : 'text'}
            autoFocus
          />
          {step === 'description' && (
            <Button variant="ghost" onClick={handleSkip}>
              Pular
            </Button>
          )}
          <Button onClick={handleSendText} disabled={!input.trim()} className="gap-1.5">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, Trash2, Loader2, BookOpen, Volume2, Square } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  apostilaId: string;
  apostilaTitle: string;
  variant?: 'panel' | 'inline';
}

const SUGGESTED = [
  'Resuma esta apostila em 5 pontos',
  'Quais são os conceitos mais importantes?',
  'Me dê 3 exemplos práticos baseados no conteúdo',
  'Crie uma analogia para o tema principal',
];

export function ApostilaChat({ apostilaId, apostilaTitle, variant = 'panel' }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Para a fala ao desmontar
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const speak = (idx: number, text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Seu navegador não suporta leitura em voz');
      return;
    }
    const synth = window.speechSynthesis;
    if (speakingIdx === idx) {
      synth.cancel();
      setSpeakingIdx(null);
      return;
    }
    synth.cancel();
    // Remove markdown básico para leitura mais natural
    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#>~]+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'pt-BR';
    utter.rate = 1;
    utter.pitch = 1;
    const voices = synth.getVoices();
    const ptVoice = voices.find(v => v.lang?.toLowerCase().startsWith('pt'));
    if (ptVoice) utter.voice = ptVoice;
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    synth.speak(utter);
  };

  // Carrega histórico
  useEffect(() => {
    if (!user || !apostilaId) return;
    (async () => {
      const { data } = await supabase
        .from('apostila_chats')
        .select('role, content')
        .eq('user_id', user.id)
        .eq('apostila_id', apostilaId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data as Msg[]);
    })();
  }, [user, apostilaId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async (text: string) => {
    if (!text.trim() || loading || streaming) return;
    if (!user) {
      toast.error('Faça login para usar o chat');
      return;
    }

    const userMsg: Msg = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    // Persiste mensagem do usuário
    await supabase.from('apostila_chats').insert({
      user_id: user.id,
      apostila_id: apostilaId,
      role: 'user',
      content: userMsg.content,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apostila-chat`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          apostilaId,
          messages: next.slice(-10), // últimas 10 mensagens p/ contexto
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('Muitas perguntas em sequência. Aguarde um pouco.');
        else if (resp.status === 402) toast.error('Créditos de IA esgotados. Avise o admin.');
        else toast.error('Erro ao consultar a IA');
        setLoading(false);
        return;
      }

      // Erro tratado pelo backend (200 + fallback:true) — mostra toast e sai sem quebrar
      const ctype = resp.headers.get('Content-Type') || '';
      if (ctype.includes('application/json')) {
        const j = await resp.json().catch(() => null);
        if (j?.fallback || j?.error) {
          toast.error(j?.error || 'IA temporariamente indisponível', {
            duration: 8000,
            description: j?.provider === 'google-direct'
              ? 'Verifique sua chave em Admin → IA ou em aistudio.google.com/apikey'
              : 'Ative sua chave Google em Admin → IA para evitar limites de créditos.',
          });
          setLoading(false);
          return;
        }
      }

      // Aviso quando o admin esperava Google mas caiu no Lovable
      const usedProvider = resp.headers.get('X-AI-Provider') || '';
      if (usedProvider && usedProvider !== 'google-direct' && localStorage.getItem('ai_prefer_google_hint') === '1') {
        toast.message('Resposta veio do Lovable AI', {
          description: 'O toggle no Admin → IA pode estar desligado.',
        });
      }

      if (!resp.body) {
        toast.error('Resposta vazia');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStreaming(true);
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
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
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: assistantContent };
                return copy;
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Persiste resposta
      if (assistantContent.trim()) {
        await supabase.from('apostila_chats').insert({
          user_id: user.id,
          apostila_id: apostilaId,
          role: 'assistant',
          content: assistantContent,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Falha de conexão com o chat');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    if (!confirm('Apagar todo o histórico desta conversa?')) return;
    await supabase
      .from('apostila_chats')
      .delete()
      .eq('user_id', user.id)
      .eq('apostila_id', apostilaId);
    setMessages([]);
    toast.success('Histórico limpo');
  };

  const isInline = variant === 'inline';

  return (
    <Card className={`flex flex-col ${isInline ? 'h-[600px]' : 'h-full'} overflow-hidden border-0 rounded-none`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">Chat com IA</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <BookOpen className="h-3 w-3 shrink-0" /> <span className="truncate">{apostilaTitle}</span>
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} className="h-8 w-8 p-0 shrink-0" title="Limpar histórico">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="text-center py-6 px-2">
            <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground mb-4">
              Faça perguntas sobre o conteúdo desta apostila. Eu uso apenas o que está aqui dentro para te responder.
            </p>
            <div className="space-y-1.5">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all"
                >
                  💡 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-foreground'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="space-y-1.5">
                  <div className="prose prose-xs max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:my-2 prose-code:text-[10px] prose-pre:text-[10px] dark:prose-invert">
                    <ReactMarkdown>{m.content || '...'}</ReactMarkdown>
                  </div>
                  {m.content && (
                    <button
                      onClick={() => speak(i, m.content)}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      title={speakingIdx === i ? 'Parar leitura' : 'Ouvir resposta'}
                    >
                      {speakingIdx === i ? <Square className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}
                      {speakingIdx === i ? 'Parar' : 'Ouvir'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted/60 rounded-2xl px-3 py-2 text-xs flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/60 shrink-0">
        <div className="flex gap-1.5 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Pergunte sobre a apostila..."
            className="min-h-[36px] max-h-24 resize-none text-xs"
            rows={1}
            disabled={loading || streaming}
          />
          <Button
            size="sm"
            onClick={() => send(input)}
            disabled={!input.trim() || loading || streaming}
            className="h-9 w-9 p-0 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
          Respostas baseadas apenas no conteúdo desta apostila
        </p>
      </div>
    </Card>
  );
}

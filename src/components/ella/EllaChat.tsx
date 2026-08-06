import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, MessageCircle, CheckCircle2, AlertCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { streamFunction } from "@/lib/stream-function";
import { getEllaAvatarUrl } from "@/lib/ellaAvatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; actions?: any[] };

const STORAGE_KEY = "ella.chat.v1";

interface EllaChatProps {
  contextHint?: string;
  compact?: boolean;
  onAfterAction?: () => void;
}

export function EllaChat({ contextHint, compact, onAfterAction }: EllaChatProps) {
  const { user, isAdmin } = useAuth();
  const [contentScope, setContentScope] = useState<string>("full");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("content_scope").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.content_scope) setContentScope(data.content_scope); });
  }, [user]);

  const suggestions = useMemo(() => {
    if (isAdmin) return [
      "Crie uma apostila sobre Estruturas de Dados",
      "Liste minhas últimas apostilas",
      "Publique um aviso de prova amanhã",
      "Abra a tela de admin",
    ];
    if (contentScope === "enem_only") return [
      "Me explique função de 2º grau com exemplo",
      "Como estruturar uma redação nota 1000 do ENEM?",
      "Resuma a Revolução Industrial em 5 pontos",
      "Me dê 3 exercícios de interpretação de texto",
      "Vire isso em um plano de estudos com gabarito comentado",
    ];
    return [
      "Me explique herança em POO com exemplo",
      "Como funciona um algoritmo de ordenação Merge Sort?",
      "Resuma normalização de banco de dados",
      "Me dê 3 exercícios sobre listas encadeadas",
      "Vire isso em um plano de estudos com gabarito comentado",
    ];
  }, [isAdmin, contentScope]);

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      
      // Mensagem de boas-vindas para novos alunos
      if (!isAdmin) {
        return [{ 
          role: "assistant", 
          content: "Olá! Eu sou a **Ella**, sua tutora de estudos. Estou aqui para te ajudar a entender qualquer conteúdo, resolver exercícios ou criar planos de estudos personalizados. Como posso te ajudar hoje?" 
        }];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const navigate = useNavigate();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch {}
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    const newUserMsg: Msg = { role: "user", content: text };
    const history = [...messages, newUserMsg];
    // Já cria a bolha da assistente vazia — o texto entra token a token.
    setMessages([...history, { role: "assistant", content: "" }]);
    if (override === undefined) setInput("");
    setLoading(true);

    const assistantIndex = history.length;
    let streamed = "";
    let pending = "";
    let flushing = false;

    // Agrupa os tokens por frame para não re-renderizar a cada caractere
    // (mantém fluidez em celulares mais simples).
    const flush = () => {
      if (!pending) { flushing = false; return; }
      streamed += pending;
      pending = "";
      const snapshot = streamed;
      setMessages((m) => {
        const next = [...m];
        if (next[assistantIndex]) next[assistantIndex] = { ...next[assistantIndex], content: snapshot };
        return next;
      });
      requestAnimationFrame(flush);
    };

    const { error } = await streamFunction(
      "ella-chat",
      {
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        context: contextHint,
        stream: true,
      },
      {
        onDelta: (chunk) => {
          pending += chunk;
          if (!flushing) { flushing = true; requestAnimationFrame(flush); }
        },
        onTool: (name) => {
          if (name === "web_search") setStatusHint("Pesquisando na internet…");
          else setStatusHint("Consultando o app…");
        },
        onDone: (actions) => {
          setStatusHint(null);
          const finalText = streamed + pending;
          pending = "";
          setMessages((m) => {
            const next = [...m];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                role: "assistant",
                content: finalText || "(sem resposta)",
                actions,
              };
            }
            return next;
          });
          const nav = actions?.find((a: any) => a.name === "navigate_to" && a.result?.navigate);
          if (nav) setTimeout(() => navigate(nav.result.navigate), 400);
          if (actions?.some((a: any) => a.result?.ok && a.name !== "search_app" && a.name !== "get_apostila")) {
            onAfterAction?.();
          }
        },
      },
    );

    if (error) {
      setStatusHint(null);
      setMessages((m) => {
        const next = [...m];
        if (next[assistantIndex]) next[assistantIndex] = { role: "assistant", content: error };
        return next;
      });
    }

    setLoading(false);
    setTimeout(() => taRef.current?.focus(), 50);
  }, [input, loading, messages, contextHint, navigate, onAfterAction]);

  useEffect(() => { taRef.current?.focus(); }, []);

  // Listener para prompt externo (ex.: botão de resolver pendências)
  useEffect(() => {
    const handleExternalPrompt = (e: any) => {
      if (e.detail) {
        send(e.detail);
      }
    };
    window.addEventListener('ella:prompt', handleExternalPrompt);
    return () => window.removeEventListener('ella:prompt', handleExternalPrompt);
  }, [send]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const STUDY_PLAN_PROMPT =
    "Transforme a sua última resposta em um plano de estudos completo: cronograma em tabela, pontos-chave, 5 a 8 exercícios de dificuldade crescente e gabarito comentado explicando cada resposta.";

  const askStudyPlan = () => { if (!loading) send(STUDY_PLAN_PROMPT); };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", compact ? "" : "")}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-border">
            <AvatarImage src={getEllaAvatarUrl()} alt="Ella Ribeiro" />
            <AvatarFallback className="bg-muted text-foreground">
              <MessageCircle className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">Ella Ribeiro</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isAdmin ? "Copiloto executiva" : contentScope === "enem_only" ? "Tutora ENEM" : "Tutora de estudos"}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs">Nova conversa</Button>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {isAdmin
                  ? "Posso criar apostilas, gerar exercícios, publicar avisos e abrir páginas."
                  : contentScope === "enem_only"
                    ? "Pergunte sobre qualquer matéria do ENEM — resumo, exemplos, exercícios e redação."
                    : "Pergunte sobre qualquer conteúdo — resumo, exemplos e exercícios."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground transition"
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "")}>
              {m.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/60">
                  <AvatarImage src={getEllaAvatarUrl()} alt="Ella" />
                  <AvatarFallback className="bg-muted text-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground"
              )}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_code]:text-xs">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                {m.role === "assistant" && !!m.content && i === messages.length - 1 && !loading && (
                  <div className="mt-3 pt-2 border-t border-border/40">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={askStudyPlan}
                      className="h-9 gap-2 text-xs"
                    >
                      <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Virar plano de estudos
                    </Button>
                  </div>
                )}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.actions.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {a.result?.ok ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-red-500" />}
                        <span className="font-mono">{a.name}</span>
                        {a.result?.summary && <span>· {a.result.summary}</span>}
                        {a.result?.error && <span className="text-red-500">· {a.result.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && !messages[messages.length - 1]?.content && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/60">
                <AvatarImage src={getEllaAvatarUrl()} alt="Ella" />
                <AvatarFallback className="bg-muted text-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin keep-pulse" />
                <span className="text-xs text-muted-foreground">{statusHint ?? "Pensando…"}</span>

              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-3">
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isAdmin ? "Peça para a Ella criar, editar, navegar…" : "Tire uma dúvida ou peça um exemplo…"}
            rows={1}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            disabled={loading}
          />
          <Button size="icon" onClick={() => send()} disabled={!input.trim() || loading} className="shrink-0 h-11 w-11" aria-label="Botão">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Enter envia · Shift+Enter quebra linha · Ações destrutivas pedem confirmação
        </p>
      </div>
    </div>
  );
}
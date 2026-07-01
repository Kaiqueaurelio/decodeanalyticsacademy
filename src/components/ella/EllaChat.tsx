import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles, CheckCircle2, AlertCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { invokeFunction } from "@/lib/invoke-function";
import { getEllaAvatarUrl } from "@/lib/ellaAvatar";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; actions?: any[] };

const STORAGE_KEY = "ella.chat.v1";

interface EllaChatProps {
  contextHint?: string;
  compact?: boolean;
  onAfterAction?: () => void;
}

export function EllaChat({ contextHint, compact, onAfterAction }: EllaChatProps) {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch {}
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  useEffect(() => { taRef.current?.focus(); }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newUserMsg: Msg = { role: "user", content: text };
    const history = [...messages, newUserMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const { data, error } = await invokeFunction<{ reply: string; actions: any[] }>("ella-chat", {
      body: {
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        context: contextHint,
      },
      errorTitle: "Ella não respondeu",
    });

    if (error || !data) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${error?.message ?? "Erro desconhecido"}` }]);
    } else {
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "(sem resposta)", actions: data.actions }]);
      // Execute navigation intents
      const nav = data.actions?.find((a) => a.name === "navigate_to" && a.result?.navigate);
      if (nav) setTimeout(() => navigate(nav.result.navigate), 400);
      if (data.actions?.some((a) => a.result?.ok && a.name !== "search_app" && a.name !== "get_apostila")) {
        onAfterAction?.();
      }
    }
    setLoading(false);
    setTimeout(() => taRef.current?.focus(), 50);
  }, [input, loading, messages, contextHint, navigate, onAfterAction]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", compact ? "" : "")}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/40">
            <AvatarImage src={getEllaAvatarUrl()} alt="Ella Ribeiro" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">Ella Ribeiro</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Copiloto executiva</p>
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
              <Wand2 className="h-10 w-10 mx-auto text-primary opacity-60" />
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Sou sua copiloto. Posso criar apostilas, gerar exercícios, publicar avisos, abrir páginas e mais.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {[
                  "Crie uma apostila sobre Estruturas de Dados",
                  "Liste minhas últimas apostilas",
                  "Publique um aviso de prova amanhã",
                  "Abra a tela de admin",
                ].map((s) => (
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
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
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

          {loading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground animate-pulse" />
              </div>
              <div className="bg-muted/50 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Ella está pensando…</span>
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
            placeholder="Peça para a Ella criar, editar, navegar…"
            rows={1}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            disabled={loading}
          />
          <Button size="icon" onClick={send} disabled={!input.trim() || loading} className="shrink-0 h-11 w-11" aria-label="Botão">
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

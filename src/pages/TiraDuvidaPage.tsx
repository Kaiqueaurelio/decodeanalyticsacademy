import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Trash2, Camera, History as HistoryIcon } from "lucide-react";
import { TiraDuvidaDialog } from "@/components/TiraDuvidaDialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { AppImage } from "@/components/ui/app-image";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Item {
  id: string;
  image_url: string;
  image_path: string | null;
  concept: string | null;
  hint: string | null;
  full_answer: string | null;
  related_apostila_id: string | null;
  related_apostila_title: string | null;
  similarity: number | null;
  created_at: string;
}

export default function TiraDuvidaPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tira_duvidas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error("Erro ao carregar histórico");
    setItems((data as Item[]) ?? []);
    setLoading(false);

    // Sign URLs
    const urls: Record<string, string> = {};
    for (const it of data ?? []) {
      if (it.image_path) {
        const { data: signed } = await supabase.storage.from("tira-duvida").createSignedUrl(it.image_path, 3600);
        if (signed?.signedUrl) urls[it.id] = signed.signedUrl;
      }
    }
    setSignedUrls(urls);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (item: Item) => {
    if (!confirm("Excluir esta dúvida?")) return;
    if (item.image_path) {
      await supabase.storage.from("tira-duvida").remove([item.image_path]);
    }
    const { error } = await supabase.from("tira_duvidas").delete().eq("id", item.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Dúvida excluída");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main className="container max-w-3xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-mono">
              <HistoryIcon className="h-3 w-3" /> Histórico
            </div>
            <h1 className="text-2xl font-semibold mt-1">Tira-dúvida com foto</h1>
            <p className="text-sm text-muted-foreground mt-1">Suas perguntas anteriores e respostas da IA.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="shrink-0">
            <Camera className="mr-2 h-4 w-4" /> Nova
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">Nenhuma dúvida ainda</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Camera className="mr-2 h-4 w-4" /> Tirar primeira foto
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isExpanded = expanded === item.id;
              const imgSrc = signedUrls[item.id];
              return (
                <article key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {imgSrc && (
                      <button onClick={() => setExpanded(isExpanded ? null : item.id)} className="shrink-0">
                        <AppImage src={imgSrc} alt="Dúvida" className="h-20 w-20 object-cover rounded-md border border-border" fallbackClassName="h-20 w-20 rounded-md" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                      </div>
                      <div className="font-semibold text-sm mt-0.5 line-clamp-2">
                        {item.concept?.slice(0, 120) || "Sem resumo"}
                      </div>
                      {item.related_apostila_id && item.related_apostila_title && (
                        <Link
                          to={`/apostila/${item.related_apostila_id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                        >
                          <BookOpen className="h-3 w-3" /> {item.related_apostila_title}
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="w-full text-xs text-muted-foreground border-t border-border py-2 hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? "Ocultar resposta" : "Ver resposta completa"}
                  </button>

                  {isExpanded && item.full_answer && (
                    <div className="border-t border-border p-4 bg-muted/30 prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{item.full_answer}</ReactMarkdown>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <TiraDuvidaDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) load(); }} />
    </div>
  );
}

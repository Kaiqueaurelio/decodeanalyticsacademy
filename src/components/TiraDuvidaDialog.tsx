import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, BookOpen, Sparkles, X, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface Result {
  id?: string;
  topic: string;
  concept: string;
  hint: string;
  related_apostila?: { id: string; title: string; category: string; similarity: number } | null;
  remaining_today?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", quality)
  );
}

export function TiraDuvidaDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setSelectedFile(null);
    setLoading(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handlePick = async (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 20MB)");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;
    setLoading(true);
    try {
      const compressed = await compressImage(selectedFile);
      const ext = "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      // Upload to storage (private)
      const { error: upErr } = await supabase.storage.from("tira-duvida").upload(path, compressed, {
        contentType: "image/jpeg",
      });
      if (upErr) throw upErr;

      // Convert to data URL for vision call
      const dataUrl = await fileToDataUrl(new File([compressed], "img.jpg", { type: "image/jpeg" }));

      // invoke retorna error genérico em status >= 400, mas o body com a mensagem
      // real ainda chega em `data` (parsed). Tratamos ambos os casos.
      const { data, error } = await supabase.functions.invoke("tira-duvida-foto", {
        body: { image: dataUrl, image_path: path },
      });

      const serverMsg =
        (data && typeof data === "object" && (data as any).error) ||
        (error && (error as any)?.context?.body) ||
        error?.message;

      if (error || (data && (data as any).error)) {
        const friendly =
          typeof serverMsg === "string" && serverMsg.length < 200
            ? serverMsg
            : "Não consegui analisar a foto. Tente novamente em instantes.";
        toast.error(friendly);
        setLoading(false);
        return;
      }

      setResult(data);
      toast.success("Resposta gerada!", {
        description: data.remaining_today !== undefined ? `Restam ${data.remaining_today} dúvidas hoje.` : undefined,
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao analisar a foto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Tira-dúvida com foto
          </DialogTitle>
          <DialogDescription>
            Tire uma foto do exercício. A IA explica o conceito, dá uma dica e linka a apostila relacionada.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            {!preview ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePick(e.target.files[0])}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePick(e.target.files[0])}
                />
                <Button
                  variant="outline"
                  className="h-32 flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8 text-primary" />
                  <span>Tirar foto</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-primary" />
                  <span>Enviar imagem</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="Pré-visualização" className="w-full max-h-80 object-contain bg-muted" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => { setPreview(null); setSelectedFile(null); }}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Pedir ajuda</>
                  )}
                </Button>
              </div>
            )}
            <div className="text-xs text-muted-foreground flex items-center justify-between pt-2">
              <span>Limite diário: 10 dúvidas</span>
              <Button variant="ghost" size="sm" onClick={() => { handleClose(false); navigate("/tira-duvida"); }}>
                <History className="mr-1.5 h-3 w-3" /> Histórico
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="text-xs uppercase tracking-wider text-primary font-mono mb-1">Tema</div>
              <div className="font-semibold">{result.topic}</div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Conceito</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{result.concept}</ReactMarkdown>
              </div>
            </div>

            <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-accent-foreground">💡 Dica de resolução</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result.hint}</ReactMarkdown>
              </div>
            </div>

            {result.related_apostila && (
              <button
                onClick={() => { handleClose(false); navigate(`/apostila/${result.related_apostila!.id}`); }}
                className="w-full text-left rounded-lg border border-border hover:border-primary bg-card p-4 transition-all hover:shadow-md group"
              >
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Apostila relacionada</div>
                    <div className="font-semibold group-hover:text-primary transition-colors">{result.related_apostila.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.related_apostila.category} • {Math.round((result.related_apostila.similarity ?? 0) * 100)}% relevância
                    </div>
                  </div>
                </div>
              </button>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Nova dúvida
              </Button>
              <Button onClick={() => handleClose(false)} variant="ghost" className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

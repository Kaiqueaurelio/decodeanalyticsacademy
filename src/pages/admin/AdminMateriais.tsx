import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, FileText, Image, Video, Headphones, Presentation, Link as LinkIcon, BookOpen, Mic } from "lucide-react";
import { toast } from "sonner";

const typeConfig: Record<string, { label: string; icon: typeof FileText; accept?: string; hint?: string }> = {
  pdf: { label: "PDF", icon: FileText, accept: ".pdf", hint: "Arquivos .pdf" },
  image: { label: "Imagem", icon: Image, accept: "image/*", hint: "JPG, PNG, WEBP, GIF" },
  video: { label: "Vídeo", icon: Video, accept: "video/*", hint: "MP4, MOV, AVI" },
  audio: { label: "Áudio / Aula Gravada", icon: Headphones, accept: "audio/*", hint: "MP3, WAV, M4A, OGG" },
  powerpoint: { label: "PowerPoint", icon: Presentation, accept: ".ppt,.pptx", hint: "Arquivos .ppt e .pptx" },
  word: { label: "Word", icon: FileText, accept: ".doc,.docx", hint: "Arquivos .doc e .docx" },
  excel: { label: "Excel", icon: FileText, accept: ".xls,.xlsx,.csv", hint: "Arquivos .xls, .xlsx e .csv" },
  gif: { label: "GIF", icon: Image, accept: ".gif", hint: "Imagens animadas .gif" },
  link: { label: "Link Externo", icon: LinkIcon },
  exam: { label: "Simulado / Prova", icon: BookOpen, accept: ".pdf", hint: "Arquivos .pdf de provas e simulados" },
  other: { label: "Outro", icon: FileText, accept: "*", hint: "Qualquer tipo de arquivo" },
};

export default function AdminMateriais() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("pdf");
  const [categoryId, setCategoryId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: materials } = useQuery({
    queryKey: ["admin-materials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("materials")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setType("pdf"); setCategoryId(""); setFileUrl(""); setFile(null);
  };

  const createMaterial = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let filePath: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("materials").upload(path, file);
        if (uploadError) throw uploadError;
        filePath = path;
      }

      const { error } = await supabase.from("materials").insert({
        title,
        description: description || null,
        type: type as any,
        category_id: categoryId || null,
        file_url: type === "link" ? fileUrl : null,
        file_path: filePath,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
      toast.success("Material enviado com sucesso!");
      setOpen(false); resetForm(); setUploading(false);
    },
    onError: () => { toast.error("Erro ao enviar material."); setUploading(false); },
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
      toast.success("Material removido.");
    },
  });

  const currentTypeConfig = typeConfig[type];
  const TypeIcon = currentTypeConfig?.icon || FileText;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 px-4 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestão de Materiais</h1>
          <p className="text-muted-foreground text-sm mt-1">Faça upload de PDFs, vídeos, áudios, simulados e mais</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Material</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Adicionar Material
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMaterial.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aula 01 - Introdução" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição..." rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conteúdo *</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(typeConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isSelected = type === key;
                    return (
                      <button key={key} type="button"
                        onClick={() => { setType(key); setFile(null); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors ${
                          isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[10px] font-medium text-center leading-tight">{cfg.label.split(" / ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === "link" ? (
                <div className="space-y-2">
                  <Label>URL do Link</Label>
                  <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-primary" /> Arquivo — {currentTypeConfig?.label}
                  </Label>
                  <Input type="file" accept={currentTypeConfig?.accept} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {currentTypeConfig?.hint && <p className="text-[11px] text-muted-foreground">{currentTypeConfig.hint}</p>}
                  {type === "audio" && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 flex gap-2">
                      <Mic className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground">
                        <span className="text-primary font-medium">Dica:</span> Suba as gravações de aulas aqui. Formatos: MP3, WAV, M4A, OGG.
                      </p>
                    </div>
                  )}
                  {file && <p className="text-[11px] text-primary font-medium">📎 {file.name} ({formatFileSize(file.size)})</p>}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={uploading || !title}>
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Salvar Material</>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials?.map((mat: any) => {
                const cfg = typeConfig[mat.type];
                const Icon = cfg?.icon || FileText;
                return (
                  <TableRow key={mat.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">{mat.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{cfg?.label || mat.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{mat.categories?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {new Date(mat.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMaterial.mutate(mat.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!materials || materials.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum material cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

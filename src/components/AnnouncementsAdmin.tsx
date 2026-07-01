import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AppImage } from '@/components/ui/app-image';
import {
  Plus, Trash2, Edit, Megaphone, GraduationCap, Calendar, Briefcase, Sparkles, Eye, EyeOff, Image as ImageIcon, X
} from 'lucide-react';
import { Upload, Loader2, Link2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  link_url: string | null;
  published: boolean;
  created_by: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'geral', label: 'Geral', icon: Megaphone },
  { value: 'cursos', label: 'Cursos', icon: GraduationCap },
  { value: 'provas', label: 'Provas', icon: Calendar },
  { value: 'empregos', label: 'Empregos', icon: Briefcase },
  { value: 'eventos', label: 'Eventos', icon: Sparkles },
];

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

export function AnnouncementsAdmin() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [autoFillUrl, setAutoFillUrl] = useState('');
  const [autoFilling, setAutoFilling] = useState(false);
  const [rawText, setRawText] = useState('');
  const [cleaningText, setCleaningText] = useState('');

  const handleAutoFill = async () => {
    const url = autoFillUrl.trim();
    if (!url) return;

    if (!isValidUrl(url)) {
      toast.error('Por favor, insira uma URL válida (ex: https://exemplo.com)');
      return;
    }

    setAutoFilling(true);
    try {
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url, options: { formats: ['markdown'] } },
      });

      if (scrapeError || !scrapeData?.success) {
        toast.error('Erro ao acessar o link. Verifique a URL.');
        setAutoFilling(false);
        return;
      }

      const markdown = scrapeData.data?.markdown || '';
      const metadata = scrapeData.data?.metadata || {};

      const { data: aiData, error: aiError } = await supabase.functions.invoke('extract-announcement', {
        body: { markdown, metadata, url },
      });

      if (aiError || !aiData || aiData.error) {
        // Fallback: use metadata directly
        setTitle(metadata.title || '');
        setContent(metadata.description || markdown.slice(0, 500));
        setLinkUrl(url);
        if (metadata.ogImage) setImageUrl(metadata.ogImage);
        const urlLower = url.toLowerCase();
        if (urlLower.includes('curso') || urlLower.includes('course') || urlLower.includes('udemy') || urlLower.includes('coursera')) {
          setCategory('cursos');
        } else if (urlLower.includes('emprego') || urlLower.includes('vaga') || urlLower.includes('job') || urlLower.includes('linkedin.com/jobs')) {
          setCategory('empregos');
        } else if (urlLower.includes('evento') || urlLower.includes('event')) {
          setCategory('eventos');
        }
        toast.success('Campos preenchidos com dados básicos!');
      } else {
        if (aiData.title) setTitle(aiData.title);
        if (aiData.content) setContent(aiData.content);
        if (aiData.category && CATEGORIES.some(c => c.value === aiData.category)) setCategory(aiData.category);
        if (aiData.image_url) setImageUrl(aiData.image_url);
        setLinkUrl(url);
        toast.success('Campos preenchidos automaticamente!');
      }
    } catch (err) {
      console.error('Auto-fill error:', err);
      toast.error('Erro ao preencher automaticamente');
    } finally {
      setAutoFilling(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { error } = await supabase.storage
        .from('announcements')
        .upload(fileName, file, { contentType: file.type });

      if (error) {
        toast.error(`Erro ao fazer upload: ${error.message}`);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('announcements').getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const loadAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleCleanText = async () => {
    const text = rawText.trim();
    if (text.length < 20) {
      toast.error('Cole pelo menos 20 caracteres de texto.');
      return;
    }
    setCleaningText(text);
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('extract-announcement', {
        body: { markdown: text, metadata: { title: '', description: text.slice(0, 200) } },
      });

      if (aiError || !aiData || aiData.error) {
        toast.error('Não foi possível organizar o texto. Tente novamente.');
        return;
      }

      if (aiData.title) setTitle(aiData.title);
      if (aiData.content) setContent(aiData.content);
      if (aiData.category && CATEGORIES.some(c => c.value === aiData.category)) setCategory(aiData.category);
      if (aiData.image_url) setImageUrl(aiData.image_url);
      setRawText('');
      toast.success('Texto organizado e formatado!');
    } catch (err) {
      console.error('Clean text error:', err);
      toast.error('Erro ao processar texto');
    } finally {
      setCleaningText('');
    }
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setCategory('geral');
    setImageUrl(''); setLinkUrl(''); setPublished(true);
    setAutoFillUrl(''); setRawText(''); setEditing(null); setShowForm(false);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setImageUrl(a.image_url || '');
    setLinkUrl(a.link_url || '');
    setPublished(a.published);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      image_url: imageUrl.trim() || null,
      link_url: linkUrl.trim() || null,
      published,
      created_by: user.id,
    };

    if (editing) {
      const { error } = await supabase.from('announcements').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Aviso atualizado!');
    } else {
      const { error } = await supabase.from('announcements').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Aviso criado!');
    }
    resetForm();
    loadAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este aviso?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('Aviso excluído');
    loadAnnouncements();
  };

  const togglePublished = async (a: Announcement) => {
    await supabase.from('announcements').update({ published: !a.published }).eq('id', a.id);
    toast.success(a.published ? 'Aviso ocultado' : 'Aviso publicado');
    loadAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Mural de Avisos ({announcements.length})</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs gradient-primary text-primary-foreground" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" /> Novo Aviso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {CATEGORIES.map(cat => {
          const count = announcements.filter(a => a.category === cat.value).length;
          const Icon = cat.icon;
          return (
            <Card key={cat.value}>
              <CardContent className="p-3 text-center">
                <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground">{cat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* List */}
      <div className="grid gap-2">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-20 rounded-xl" />)
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum aviso publicado.</p>
          </div>
        ) : (
          announcements.map(a => {
            const catCfg = CATEGORIES.find(c => c.value === a.category) || CATEGORIES[0];
            const Icon = catCfg.icon;
            return (
              <Card key={a.id} className={`hover:shadow-md transition-shadow ${!a.published ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{a.title}</h4>
                        {!a.published && <Badge variant="secondary" className="text-[9px]">Rascunho</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {catCfg.label} · {new Date(a.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() = aria-label="Visualizar"> togglePublished(a)}>
                        {a.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() = aria-label="Editar"> openEdit(a)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() = aria-label="Excluir"> handleDelete(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Auto-fill from URL */}
            <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                <Wand2 className="h-3.5 w-3.5 text-primary" />
                Preencher automaticamente via link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={autoFillUrl}
                  onChange={e => setAutoFillUrl(e.target.value)}
                  placeholder="Cole o link do curso, vaga, evento..."
                  className="flex-1 text-xs"
                  disabled={autoFilling}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAutoFill}
                  disabled={autoFilling || !autoFillUrl.trim()}
                  className="gap-1.5 shrink-0"
                >
                  {autoFilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                  {autoFilling ? 'Extraindo...' : 'Extrair'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Cole a URL e clique em Extrair para preencher título, conteúdo e categoria automaticamente.</p>
            </div>

            {/* Clean raw text via AI */}
            <div className="p-3 rounded-lg border border-dashed border-accent/40 bg-accent/5">
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                Colar texto bruto e organizar com IA
              </Label>
              <Textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Cole aqui o texto cru do aviso (e-mail, comunicado, descrição copiada). A IA vai limpar, resumir e categorizar."
                rows={4}
                className="text-xs"
                disabled={!!cleaningText}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCleanText}
                disabled={!!cleaningText || rawText.trim().length < 20}
                className="gap-1.5 mt-2 w-full"
              >
                {cleaningText ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {cleaningText ? 'Organizando...' : 'Organizar com IA'}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1.5">A IA vai gerar título limpo, conteúdo formatado e detectar a categoria automaticamente.</p>
            </div>

            <div>
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do aviso" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva o aviso..." rows={4} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Imagem do Aviso</Label>
              <div className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    <Button type="button" variant="outline" className="w-full gap-2 h-10" disabled={uploading} asChild>
                      <span>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        {uploading ? 'Enviando...' : 'Subir Imagem'}
                      </span>
                    </Button>
                  </label>
                  {imageUrl && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-destructive hover:bg-destructive/10"
                      onClick={() = aria-label="Botão"> setImageUrl('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <Input 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    placeholder="Ou cole a URL da imagem aqui..." 
                    className="pl-9 text-xs h-9" 
                  />
                </div>

                {imageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-border bg-background">
                    <AppImage src={imageUrl} alt="Preview" className="w-full h-32 object-cover" fallbackClassName="w-full h-32" />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                      Preview
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs">Link externo (opcional)</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label className="text-xs">Publicar imediatamente</Label>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={handleSave} disabled={!title.trim() || !content.trim()}>
              {editing ? 'Salvar Alterações' : 'Criar Aviso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

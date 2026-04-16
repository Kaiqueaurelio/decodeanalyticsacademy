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
import {
  Plus, Trash2, Edit, Megaphone, GraduationCap, Calendar, Briefcase, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { Upload, Loader2, ImageIcon, Link2, Wand2 } from 'lucide-react';
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
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

    const { error } = await supabase.storage
      .from('announcements')
      .upload(fileName, file, { contentType: file.type });

    if (error) {
      toast.error(`Erro ao fazer upload: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('announcements')
      .getPublicUrl(fileName);

    setImageUrl(urlData.publicUrl);
    setUploading(false);
    toast.success('Imagem enviada!');
  };

  const loadAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const resetForm = () => {
    setTitle(''); setContent(''); setCategory('geral');
    setImageUrl(''); setLinkUrl(''); setPublished(true);
    setEditing(null); setShowForm(false);
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
            <p className="text-sm">Nenhum aviso criado.</p>
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
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => togglePublished(a)}>
                        {a.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div>
              <Label className="text-xs">URL da Imagem (opcional)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" disabled={uploading} asChild>
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </span>
                  </Button>
                </label>
              </div>
              {imageUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-border">
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              )}
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

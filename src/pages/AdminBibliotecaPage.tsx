import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, BookPlus, Eye, EyeOff, Loader2, Trash2, CheckCircle2, AlertCircle, ImageIcon, FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Book } from '@/modules/library/types';
import { detectFileType } from '@/modules/library/types';

type UploadPhase = 'idle' | 'cover' | 'book' | 'saving' | 'done' | 'error';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/** Upload via XHR to expose real progress events (supabase-js does not surface them). */
function uploadWithProgress(opts: {
  bucket: string;
  path: string;
  file: File;
  token: string;
  onProgress: (pct: number) => void;
}): Promise<void> {
  const { bucket, path, file, token, onProgress } = opts;
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON);
    xhr.setRequestHeader('x-upsert', 'false');
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        let msg = `Upload falhou (HTTP ${xhr.status})`;
        try { const j = JSON.parse(xhr.responseText); msg = j.message || j.error || msg; } catch { /* noop */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Erro de rede ao enviar arquivo.'));
    xhr.onabort = () => reject(new Error('Upload cancelado.'));
    xhr.send(file);
  });
}

export default function AdminBibliotecaPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [coverPct, setCoverPct] = useState(0);
  const [bookPct, setBookPct] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => { void load(); }, []);

  const MAX_COVER_MB = 5;
  const MAX_BOOK_MB = 50;
  const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const COVER_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
  const BOOK_TYPES = ['application/pdf', 'application/epub+zip'];
  const BOOK_EXTS = ['pdf', 'epub'];

  const validateFile = (
    file: File,
    allowedTypes: string[],
    allowedExts: string[],
    maxMb: number,
    label: string,
  ): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const typeOk = allowedTypes.includes(file.type) || allowedExts.includes(ext);
    if (!typeOk) {
      return `${label}: formato não permitido. Aceitos: ${allowedExts.join(', ').toUpperCase()}.`;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      return `${label}: arquivo muito grande (${sizeMb.toFixed(1)}MB). Máximo: ${maxMb}MB.`;
    }
    if (file.size === 0) {
      return `${label}: arquivo vazio.`;
    }
    return null;
  };

  const onPickCover = (f: File | null) => {
    if (!f) { setCoverFile(null); return; }
    const err = validateFile(f, COVER_TYPES, COVER_EXTS, MAX_COVER_MB, 'Capa');
    if (err) { toast.error(err); return; }
    setCoverFile(f);
  };

  const onPickBook = (f: File | null) => {
    if (!f) { setBookFile(null); return; }
    const err = validateFile(f, BOOK_TYPES, BOOK_EXTS, MAX_BOOK_MB, 'Livro');
    if (err) { toast.error(err); return; }
    setBookFile(f);
  };

  const load = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks((data || []) as Book[]);
  };

  const upload = async () => {
    if (!user || !bookFile || !title) {
      toast.error('Título e arquivo são obrigatórios');
      return;
    }
    const bookErr = validateFile(bookFile, BOOK_TYPES, BOOK_EXTS, MAX_BOOK_MB, 'Livro');
    if (bookErr) { toast.error(bookErr); return; }
    if (coverFile) {
      const coverErr = validateFile(coverFile, COVER_TYPES, COVER_EXTS, MAX_COVER_MB, 'Capa');
      if (coverErr) { toast.error(coverErr); return; }
    }
    setUploading(true);
    try {
      const ext = bookFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = detectFileType(bookFile.name);
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('books').upload(path, bookFile);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(path);

      let coverUrl: string | null = null;
      if (coverFile) {
        const cExt = coverFile.name.split('.').pop() || 'jpg';
        const cPath = `${user.id}/covers/${Date.now()}.${cExt}`;
        const { error: cErr } = await supabase.storage.from('books').upload(cPath, coverFile);
        if (!cErr) coverUrl = supabase.storage.from('books').getPublicUrl(cPath).data.publicUrl;
      }

      const { error } = await supabase.from('books').insert({
        title, author: author || null, description: description || null,
        cover_url: coverUrl, file_url: publicUrl, file_type: fileType, created_by: user.id,
        published: false,
      });
      if (error) throw error;
      toast.success('Livro adicionado como rascunho. Publique quando estiver pronto.');
      setTitle(''); setAuthor(''); setDescription(''); setCoverFile(null); setBookFile(null);
      void load();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar');
    } finally {
      setUploading(false);
    }
  };

  const togglePublished = async (book: Book) => {
    const next = !book.published;
    const { error } = await supabase.from('books').update({ published: next }).eq('id', book.id);
    if (error) {
      toast.error(error.message || 'Erro ao atualizar');
      return;
    }
    toast.success(next ? 'Livro publicado' : 'Livro despublicado');
    setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, published: next } : b)));
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este livro?')) return;
    await supabase.from('books').delete().eq('id', id);
    toast.success('Removido');
    void load();
  };

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-sm">Acesso restrito.</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Admin
        </Button>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><BookPlus className="h-5 w-5" /> Biblioteca Decode Analytics Academy</h1>
        <p className="text-sm text-muted-foreground mb-6">Acervo exclusivo de livros em PDF e EPUB. Outros materiais (vídeos, slides, imagens) continuam sendo gerenciados na aba <strong>Materiais</strong>.</p>

        <Card className="p-5 mb-8 space-y-3">
          <h2 className="font-semibold">Adicionar Livro</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Autor</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Capa (imagem)</Label>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPickCover(e.target.files?.[0] || null)} />
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG ou WEBP · até {MAX_COVER_MB}MB</p>
              {coverFile && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">✓ {coverFile.name} ({(coverFile.size / 1024 / 1024).toFixed(2)}MB)</p>}
            </div>
            <div>
              <Label>Arquivo (PDF ou EPUB) *</Label>
              <Input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(e) => onPickBook(e.target.files?.[0] || null)} />
              <p className="text-[11px] text-muted-foreground mt-1">PDF ou EPUB · até {MAX_BOOK_MB}MB</p>
              {bookFile && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">✓ {bookFile.name} ({(bookFile.size / 1024 / 1024).toFixed(2)}MB)</p>}
            </div>
          </div>
          <Button onClick={upload} disabled={uploading || !title || !bookFile}>
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Adicionar'}
          </Button>
        </Card>

        <h2 className="font-semibold mb-3">Livros ({books.length})</h2>
        <div className="space-y-2">
          {books.map((b) => (
            <Card key={b.id} className="p-3 flex items-center gap-3">
              <div className="w-10 h-14 bg-muted rounded flex-shrink-0 overflow-hidden">
                {b.cover_url && <img src={b.cover_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{b.title}</p>
                  <Badge variant={b.published ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                    {b.published ? <><Eye className="h-3 w-3 mr-1" />Publicado</> : <><EyeOff className="h-3 w-3 mr-1" />Rascunho</>}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{b.author || '—'} · {b.file_type.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5" title={b.published ? 'Despublicar' : 'Publicar'}>
                  <Switch checked={!!b.published} onCheckedChange={() => togglePublished(b)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(b.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

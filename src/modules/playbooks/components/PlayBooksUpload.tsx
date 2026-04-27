// PlayBooks Upload — drop a local EPUB/PDF and add to a personal in-browser shelf.
// Saves to IndexedDB-backed Object URL stored in localStorage metadata so the user
// can continue reading their own uploaded files. Does NOT touch the admin/published library.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PBBook } from '../types';
import { detectPBFormat } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: (book: PBBook) => void;
}

const LOCAL_KEY = 'pb:local-uploads:v1';

interface LocalUploadMeta {
  id: string; title: string; author: string | null; format: 'pdf' | 'epub';
  cover: string | null; size: number; addedAt: string;
}

export function PlayBooksUpload({ open, onClose, onAdded }: Props) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!file || !title) { toast.error('Título e arquivo são obrigatórios'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'epub'].includes(ext)) { toast.error('Apenas PDF ou EPUB são aceitos'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('Arquivo muito grande (máx 100MB)'); return; }

    setBusy(true);
    try {
      // Store the file in IndexedDB via a Blob URL session-cached for runtime use,
      // but we also persist the binary so it survives reloads.
      const id = crypto.randomUUID();
      await idbPut(id, file);
      const meta: LocalUploadMeta = {
        id, title, author: author || null, format: detectPBFormat(file.name),
        cover: null, size: file.size, addedAt: new Date().toISOString(),
      };
      const cur = readLocal();
      cur.push(meta);
      writeLocal(cur);

      const blobUrl = URL.createObjectURL(file);
      const book: PBBook = {
        id: `local:${id}`,
        title, author: author || null, cover: null,
        format: meta.format, fileUrl: blobUrl, pageCount: null,
      };
      toast.success('Livro adicionado à sua estante');
      onAdded(book);
      setTitle(''); setAuthor(''); setFile(null);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[92%] max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> Enviar livro</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Estruturas de Dados" />
          </div>
          <div>
            <Label className="text-xs">Autor</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <Label className="text-xs">Arquivo (PDF ou EPUB) *</Label>
            <Input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && (
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3" /> {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
              </p>
            )}
          </div>
          <Button className="w-full" onClick={handleSave} disabled={busy || !file || !title}>
            {busy ? 'Enviando…' : 'Adicionar à estante'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            O arquivo é salvo localmente no seu dispositivo (offline).
          </p>
        </div>
      </div>
    </div>
  );
}

// Helpers — local upload metadata
function readLocal(): LocalUploadMeta[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function writeLocal(m: LocalUploadMeta[]) { localStorage.setItem(LOCAL_KEY, JSON.stringify(m)); }

// Tiny IndexedDB wrapper
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('playbooks', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('files'); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function idbPut(key: string, blob: Blob) {
  const db = await idb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function idbGet(key: string): Promise<Blob | null> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const req = tx.objectStore('files').get(key);
    req.onsuccess = () => resolve((req.result as Blob) || null);
    req.onerror = () => reject(req.error);
  });
}

export function loadLocalBooks(): Promise<PBBook[]> {
  return Promise.all(readLocal().map(async (m) => {
    const blob = await idbGet(m.id);
    const url = blob ? URL.createObjectURL(blob) : '';
    return {
      id: `local:${m.id}`, title: m.title, author: m.author, cover: m.cover,
      format: m.format, fileUrl: url, pageCount: null,
    } as PBBook;
  }));
}

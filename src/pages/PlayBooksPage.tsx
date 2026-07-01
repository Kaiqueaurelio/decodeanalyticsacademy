// PlayBooks page — container that wires together Library + Reader + Upload.
// Plugs into the existing app at /playbooks without touching other tabs.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { PlayBooksLibrary } from '@/modules/playbooks/components/PlayBooksLibrary';
import { PlayBooksReader } from '@/modules/playbooks/components/PlayBooksReader';
import { PlayBooksUpload, loadLocalBooks } from '@/modules/playbooks/components/PlayBooksUpload';
import { flushSyncQueue, fetchAllProgress } from '@/modules/playbooks/api';
import { pbCache } from '@/modules/playbooks/storage';
import type { PBBook } from '@/modules/playbooks/types';
import { Library } from 'lucide-react';

export default function PlayBooksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openBook, setOpenBook] = useState<PBBook | null>(null);
  const [resumeAt, setResumeAt] = useState<{ page?: number; loc?: string | null }>({});
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Flush queued sync ops + refresh local uploads on mount/online
  useEffect(() => {
    void flushSyncQueue();
    const onOnline = () => { void flushSyncQueue(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // Hydrate local books into cache for the library's recent shelf
  useEffect(() => {
    void (async () => {
      const local = await loadLocalBooks();
      if (local.length) {
        const existing = pbCache.getBooks();
        const merged = [...local, ...existing.filter((e) => !e.id.startsWith('local:'))];
        pbCache.setBooks(merged);
        setRefreshKey((k) => k + 1);
      }
    })();
  }, []);

  const handleOpen = async (book: PBBook) => {
    if (user) {
      pbCache.pushRecent(user.id, book.id);
      const all = await fetchAllProgress(user.id);
      const p = all[book.id];
      setResumeAt({ page: p?.page || 1, loc: p?.location || null });
    } else {
      setResumeAt({ page: 1, loc: null });
    }
    setOpenBook(book);
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Library className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Play Books</h1>
            <p className="text-xs text-muted-foreground">Sua biblioteca de leitura — PDF e EPUB com destaques, marcadores e sincronização.</p>
          </div>
        </div>

        <div key={refreshKey}>
          <PlayBooksLibrary onOpen={handleOpen} onUploadClick={() => setShowUpload(true)} />
        </div>
      </main>

      {openBook && (
        <PlayBooksReader
          book={openBook}
          initialPage={resumeAt.page || 1}
          initialLocation={resumeAt.loc || null}
          onBack={() => setOpenBook(null)}
        />
      )}

      <PlayBooksUpload
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onAdded={(b) => {
          const cur = pbCache.getBooks();
          pbCache.setBooks([b, ...cur.filter((x) => x.id !== b.id)]);
          setRefreshKey((k) => k + 1);
          setOpenBook(b);
        }}
      />
    </div>
  );
}

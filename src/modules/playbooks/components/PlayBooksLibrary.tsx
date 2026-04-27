// PlayBooks Library — Home + grid/shelves with Continue Reading & shelves
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllProgress, fetchBooks } from '../api';
import { pbCache } from '../storage';
import type { PBBook } from '../types';
import { Loader2, BookOpen, Star, Download, Search as SearchIcon, Upload as UploadIcon, Headphones } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  onOpen: (book: PBBook) => void;
  onUploadClick: () => void;
}

export function PlayBooksLibrary({ onOpen, onUploadClick }: Props) {
  const { user } = useAuth();
  const [books, setBooks] = useState<PBBook[]>(() => pbCache.getBooks());
  const [progress, setProgress] = useState<Record<string, { percentage: number; page: number | null; location: string | null; updatedAt: string }>>({});
  const [loading, setLoading] = useState(books.length === 0);
  const [tab, setTab] = useState<'home' | 'library' | 'audiobooks'>('home');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const bs = await fetchBooks();
        setBooks(bs);
        if (user) setProgress(await fetchAllProgress(user.id));
      } finally { setLoading(false); }
    })();
  }, [user]);

  const favorites = user ? new Set(pbCache.getFavorites(user.id)) : new Set<string>();
  const recentIds = user ? pbCache.getRecent(user.id) : [];
  const downloaded = user ? new Set(pbCache.getDownloaded(user.id)) : new Set<string>();

  const continueReading = useMemo(() => {
    return books
      .filter((b) => (progress[b.id]?.percentage ?? 0) > 0 && (progress[b.id]?.percentage ?? 0) < 99)
      .sort((a, b) => (progress[b.id]?.updatedAt || '').localeCompare(progress[a.id]?.updatedAt || ''))
      .slice(0, 12);
  }, [books, progress]);

  const recently = useMemo(() => recentIds.map((id) => books.find((b) => b.id === id)).filter(Boolean) as PBBook[], [recentIds, books]);

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter((b) => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q));
  }, [books, search]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60">
        {[
          { id: 'home', label: 'Início', icon: BookOpen },
          { id: 'library', label: 'Biblioteca', icon: Star },
          { id: 'audiobooks', label: 'Audiolivros', icon: Headphones },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onUploadClick} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <UploadIcon className="h-3.5 w-3.5" /> Enviar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título ou autor…" className="pl-9 rounded-full" />
      </div>

      {tab === 'home' && (
        <>
          {continueReading.length > 0 && (
            <Shelf title="Continue lendo" books={continueReading} progress={progress} downloaded={downloaded} favorites={favorites} onOpen={onOpen} variant="continue" />
          )}
          {recently.length > 0 && (
            <Shelf title="Abertos recentemente" books={recently} progress={progress} downloaded={downloaded} favorites={favorites} onOpen={onOpen} />
          )}
          <Shelf title="Seus livros" books={books.slice(0, 12)} progress={progress} downloaded={downloaded} favorites={favorites} onOpen={onOpen} />
        </>
      )}

      {tab === 'library' && (
        <BookGrid books={filtered} progress={progress} downloaded={downloaded} favorites={favorites} onOpen={onOpen} />
      )}

      {tab === 'audiobooks' && (
        <Card className="p-10 text-center">
          <Headphones className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Audiolivros em breve</p>
          <p className="text-xs text-muted-foreground mt-1">O acervo de áudio será disponibilizado nas próximas atualizações.</p>
        </Card>
      )}
    </div>
  );
}

function Shelf({ title, books, progress, downloaded, favorites, onOpen, variant }: {
  title: string;
  books: PBBook[];
  progress: Record<string, { percentage: number }>;
  downloaded: Set<string>;
  favorites: Set<string>;
  onOpen: (b: PBBook) => void;
  variant?: 'continue';
}) {
  if (books.length === 0) return null;
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {books.map((b) => (
          <div key={b.id} className="snap-start shrink-0" style={{ width: variant === 'continue' ? 132 : 116 }}>
            <BookCard book={b} progress={progress[b.id]?.percentage} isDownloaded={downloaded.has(b.id)} isFavorite={favorites.has(b.id)} onOpen={() => onOpen(b)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BookGrid({ books, progress, downloaded, favorites, onOpen }: {
  books: PBBook[];
  progress: Record<string, { percentage: number }>;
  downloaded: Set<string>;
  favorites: Set<string>;
  onOpen: (b: PBBook) => void;
}) {
  if (books.length === 0) {
    return (
      <Card className="p-10 text-center">
        <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm">Nenhum livro encontrado.</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-6">
      {books.map((b) => (
        <BookCard
          key={b.id}
          book={b}
          progress={progress[b.id]?.percentage}
          isDownloaded={downloaded.has(b.id)}
          isFavorite={favorites.has(b.id)}
          onOpen={() => onOpen(b)}
        />
      ))}
    </div>
  );
}

function BookCard({ book, progress, isDownloaded, isFavorite, onOpen }: {
  book: PBBook;
  progress?: number;
  isDownloaded: boolean;
  isFavorite: boolean;
  onOpen: () => void;
}) {
  const pct = progress ? Math.round(progress) : 0;
  return (
    <button onClick={onOpen} className="group flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md w-full">
      <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-muted shadow-[0_4px_12px_-2px_rgba(0,0,0,0.18)] group-hover:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.28)] transition-all duration-300 group-hover:-translate-y-1">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <GeneratedCover title={book.title} author={book.author} />
        )}
        <Badge className="absolute top-1.5 right-1.5 text-[9px] uppercase tracking-wide px-1.5 py-0 h-4 font-medium backdrop-blur-sm bg-background/80 text-foreground border-0" variant="secondary">
          {book.format}
        </Badge>
        {isDownloaded && (
          <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-emerald-500/90 flex items-center justify-center" title="Disponível offline">
            <Download className="h-3 w-3 text-white" />
          </div>
        )}
        {isFavorite && (
          <Star className="absolute bottom-2 left-2 h-3.5 w-3.5" style={{ color: '#fbbf24', fill: '#fbbf24' }} />
        )}
        {pct > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-background/40">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5 flex flex-col gap-0.5">
        <h3 className="font-medium text-[12px] leading-snug line-clamp-2">{book.title}</h3>
        {book.author && <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>}
        {pct > 0 && <p className="text-[10px] text-primary font-medium">{pct}% lido</p>}
      </div>
    </button>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Star, FileText, Image as ImageIcon, Video, Music, Link as LinkIcon, FileSpreadsheet, FileType, Presentation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Material = Tables<'materials'>;

const TYPE_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  gif: ImageIcon,
  video: Video,
  audio: Music,
  link: LinkIcon,
  excel: FileSpreadsheet,
  word: FileType,
  powerpoint: Presentation,
  exam: FileText,
  other: FileText,
};

const TYPE_COLOR: Record<string, string> = {
  pdf: 'hsl(0 72% 60%)',
  image: 'hsl(280 70% 65%)',
  gif: 'hsl(280 70% 65%)',
  video: 'hsl(355 75% 60%)',
  audio: 'hsl(40 90% 55%)',
  link: 'hsl(190 80% 55%)',
  excel: 'hsl(140 60% 45%)',
  word: 'hsl(215 75% 55%)',
  powerpoint: 'hsl(15 80% 55%)',
  exam: 'hsl(330 70% 55%)',
  other: 'hsl(220 10% 60%)',
};

export function FavoriteMaterialsWidget() {
  const { user } = useAuth();
  const [items, setItems] = useState<(Material & { fav_at: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let active = true;
    (async () => {
      // Pega os 5 últimos favoritos com join no material
      const { data } = await supabase
        .from('material_favorites')
        .select('created_at, material_id, materials:material_id(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!active) return;
      const list = ((data ?? []) as any[])
        .filter((r) => r.materials)
        .map((r) => ({ ...(r.materials as Material), fav_at: r.created_at as string }));
      setItems(list);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">Meus Favoritos</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-shimmer h-24 w-40 rounded-lg shrink-0" />
          ))}
        </div>
      </Card>
    );
  }
  if (items.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">Meus Favoritos</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nenhum material favoritado ainda. Na <Link to="/biblioteca" className="text-primary hover:underline">Biblioteca</Link>, deslize um card para a direita ou use a estrela ⭐ para adicionar.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">
            Meus Favoritos
          </span>
          <span className="text-[10px] text-muted-foreground/70">· últimos {items.length}</span>
        </div>
        <Link to="/biblioteca" className="text-[10px] text-primary hover:underline">
          Ver tudo →
        </Link>
      </div>
      <div className="-mx-1 overflow-x-auto scrollbar-none snap-x snap-mandatory">
        <div className="flex gap-3 px-1 pb-1 min-w-max">
          {items.map((m, idx) => {
            const Icon = TYPE_ICON[m.type] ?? FileText;
            const color = TYPE_COLOR[m.type] ?? TYPE_COLOR.other;
            return (
              <Link
                key={m.id}
                to="/biblioteca"
                className={cn(
                  'group snap-start shrink-0 w-44 sm:w-48 rounded-lg border border-border/50 bg-background hover:border-primary/40 hover:shadow-md transition-all p-3 animate-fade-in flex flex-col gap-2',
                )}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="h-9 w-9 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-auto shrink-0" />
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                  {m.title}
                </p>
                <p className="text-[10px] font-mono-label uppercase tracking-wider text-muted-foreground">
                  {m.type}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

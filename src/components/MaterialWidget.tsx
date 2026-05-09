import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Video, Music, Image, Link as LinkIcon, File,
  Presentation, FileSpreadsheet, ChevronRight, FolderOpen
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Material = Tables<'materials'>;

const TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText, image: Image, video: Video, audio: Music,
  powerpoint: Presentation, word: FileText, excel: FileSpreadsheet,
  link: LinkIcon, other: File, exam: FileText, gif: Image,
};

const TYPE_COLORS: Record<string, string> = {
  pdf: '#EF4444', video: '#8B5CF6', audio: '#F59E0B',
  image: '#10B981', powerpoint: '#F97316', word: '#3B82F6',
  excel: '#22C55E', link: '#6366F1', other: '#6B7280',
};

function isNew(date: string) {
  const d = new Date(date);
  const now = new Date();
  return (now.getTime() - d.getTime()) < 3 * 24 * 60 * 60 * 1000; // 3 days
}

export function MaterialWidget() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('materials').select('*').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { setMaterials(data || []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        <div className="skeleton-shimmer h-4 w-32 rounded" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-12 rounded-lg" />)}
      </Card>
    );
  }

  if (materials.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
    >
      <Card className="p-4 hover-lift overflow-hidden bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
        <button onClick={() => navigate('/biblioteca')} className="w-full text-left group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 group-hover:scale-110 transition-transform duration-300">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-primary/90">Biblioteca</h3>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        <AnimatePresence>
          <div className="space-y-2">
            {materials.map((m, i) => {
              const Icon = TYPE_ICONS[m.type] || File;
              const color = TYPE_COLORS[m.type] || '#6B7280';
              const brandNew = isNew(m.created_at);

              return (
                <motion.a
                  key={m.id}
                  href={m.file_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group/item no-underline"
                >
                  <div
                    className="rounded-lg p-2 shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-foreground">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground">{m.type.toUpperCase()}</p>
                  </div>
                  {brandNew && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 animate-pulse bg-primary/10 text-primary border-primary/20">
                      Novo
                    </Badge>
                  )}
                </motion.a>
              );
            })}
          </div>
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

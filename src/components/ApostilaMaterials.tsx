import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText, Image, Video, Music, Presentation, File, Link as LinkIcon,
  FileSpreadsheet, Download, ExternalLink, Paperclip
} from 'lucide-react';

interface LinkedMaterial {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  description: string | null;
}

const TYPE_ICONS: Record<string, any> = {
  pdf: FileText, image: Image, video: Video, audio: Music,
  powerpoint: Presentation, word: FileText, excel: FileSpreadsheet,
  link: LinkIcon, gif: Image, other: File, exam: FileText,
};

interface Props {
  apostilaId: string;
}

export function ApostilaMaterials({ apostilaId }: Props) {
  const [materials, setMaterials] = useState<LinkedMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('apostila_materials')
      .select('material_id, sort_order')
      .eq('apostila_id', apostilaId)
      .order('sort_order')
      .then(async ({ data: links }) => {
        if (!links || links.length === 0) { setLoading(false); return; }
        const ids = links.map(l => (l as any).material_id);
        const { data: mats } = await supabase.from('materials').select('id, title, type, file_url, description').in('id', ids);
        // Preserve sort order
        const matMap = new Map((mats || []).map(m => [m.id, m]));
        const sorted = ids.map(id => matMap.get(id)).filter(Boolean) as LinkedMaterial[];
        setMaterials(sorted);
        setLoading(false);
      });
  }, [apostilaId]);

  if (loading || materials.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border/50 animate-content-show">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">Material de Apoio</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {materials.map(m => {
          const Icon = TYPE_ICONS[m.type] || File;
          const isLink = m.type === 'link';
          return (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{m.title}</h4>
                    {m.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                    )}
                  </div>
                  {m.file_url && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" asChild>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                        {isLink ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Trash2, StickyNote } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  apostilaId: string;
}

type Annotation = { id: string; content: string; color: string; created_at: string };

const COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];

export function AnnotationsPanel({ apostilaId }: Props) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Annotation[]>([]);
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('annotations').select('*').eq('user_id', user.id).eq('apostila_id', apostilaId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotes((data || []) as Annotation[]));
  }, [user, apostilaId]);

  const addNote = async () => {
    if (!user || !content.trim()) return;
    const { data, error } = await supabase.from('annotations').insert({
      user_id: user.id, apostila_id: apostilaId, content: content.trim(), color,
    }).select().single();
    if (error) { toast.error('Erro ao salvar anotação'); return; }
    setNotes(prev => [data as Annotation, ...prev]);
    setContent(''); toast.success('Anotação salva!');
  };

  const deleteNote = async (id: string) => {
    await supabase.from('annotations').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setShow(!show)} className="text-xs gap-1.5 mb-3">
        <StickyNote className="h-3.5 w-3.5" /> Anotações ({notes.length})
      </Button>

      {show && (
        <div className="space-y-3 animate-fade-in">
          <div className="space-y-2">
            <Textarea placeholder="Sua anotação..." value={content} onChange={e => setContent(e.target.value)} className="text-xs min-h-[60px]" />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`h-5 w-5 rounded-full border-2 smooth-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <Button size="sm" onClick={addNote} className="text-xs h-7 ml-auto gradient-primary text-primary-foreground">
                <MessageSquarePlus className="h-3 w-3 mr-1" /> Salvar
              </Button>
            </div>
          </div>

          {notes.map(n => (
            <div key={n.id} className="p-2.5 rounded-lg text-xs relative group" style={{ backgroundColor: n.color + '20', borderLeft: `3px solid ${n.color}` }}>
              <p className="text-foreground pr-6">{n.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
              <button onClick={() => deleteNote(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 smooth-all text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

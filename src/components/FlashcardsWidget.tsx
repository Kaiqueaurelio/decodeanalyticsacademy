import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, RotateCcw, Check, X, Layers, Sparkles, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { sm2, formatNextReview, type SRSQuality } from '@/lib/srs';
import { useNavigate } from 'react-router-dom';

interface Props {
  apostilaId?: string;
}

type Flashcard = {
  id: string; front: string; back: string;
  difficulty: number; next_review: string | null;
  ease_factor: number; interval_days: number; repetitions: number;
};

export function FlashcardsWidget({ apostilaId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = supabase.from('flashcards').select('*').eq('user_id', user.id).order('next_review');
    if (apostilaId) q.eq('apostila_id', apostilaId);
    q.then(({ data }) => setCards((data || []) as Flashcard[]));
  }, [user, apostilaId]);

  const dueCount = cards.filter(c => !c.next_review || new Date(c.next_review).getTime() <= Date.now()).length;

  const addCard = async () => {
    if (!user || !front.trim() || !back.trim()) return;
    const { data, error } = await supabase.from('flashcards').insert({
      user_id: user.id, front: front.trim(), back: back.trim(),
      apostila_id: apostilaId || null,
    }).select().single();
    if (error) { toast.error('Erro ao criar flashcard'); return; }
    setCards(prev => [...prev, data as Flashcard]);
    setFront(''); setBack(''); setShowForm(false);
    toast.success('Flashcard criado!');
  };

  const handleAnswer = async (quality: SRSQuality) => {
    const card = cards[currentIdx];
    if (!card) return;
    const result = sm2(
      {
        ease_factor: card.ease_factor || 2.5,
        interval_days: card.interval_days || 0,
        repetitions: card.repetitions || 0,
      },
      quality,
    );
    await supabase.from('flashcards').update({
      ease_factor: result.ease_factor,
      interval_days: result.interval_days,
      repetitions: result.repetitions,
      next_review: result.next_review,
      last_reviewed: new Date().toISOString(),
      difficulty: quality < 3 ? 0 : quality === 3 ? 1 : 2,
    }).eq('id', card.id);
    toast.success(`Próx. revisão em ${formatNextReview(result.next_review)}`);
    setFlipped(false);
    setCurrentIdx(prev => (prev + 1) % Math.max(1, cards.length));
  };

  const current = cards[currentIdx];

  return (
    <Card className="p-4 bg-card border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Flashcards</span>
          <span className="text-[10px] text-muted-foreground">({cards.length})</span>
          {dueCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning">
              {dueCount} a revisar
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {dueCount > 0 && (
            <Button size="icon" variant="ghost" className="h-7 w-7" title="Revisar todos" onClick={() => navigate('/review')}>
              <Brain className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-2 mb-3 animate-fade-in">
          <Input placeholder="Frente (pergunta)" value={front} onChange={e => setFront(e.target.value)} className="text-xs h-8" />
          <Textarea placeholder="Verso (resposta)" value={back} onChange={e => setBack(e.target.value)} className="text-xs min-h-[60px]" />
          <div className="flex gap-2">
            <Button size="sm" onClick={addCard} className="text-xs h-7 gradient-primary text-primary-foreground">Criar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs h-7">Cancelar</Button>
          </div>
        </div>
      )}

      {current && !showForm ? (
        <div className="space-y-2">
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[80px] p-3 rounded-lg border border-border/50 bg-accent/30 text-center smooth-all hover:shadow-sm"
          >
            <p className="text-[10px] text-muted-foreground mb-1">{flipped ? 'Resposta' : 'Pergunta'}</p>
            <p className="text-sm font-medium">{flipped ? current.back : current.front}</p>
          </button>
          {flipped && (
            <div className="grid grid-cols-4 gap-1 animate-fade-in">
              <Button size="sm" variant="outline" className="text-[10px] h-7 px-1 border-destructive/30 text-destructive" onClick={() => handleAnswer(0)}>
                <X className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-7 px-1" onClick={() => handleAnswer(3)}>
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-7 px-1 border-primary/30 text-primary" onClick={() => handleAnswer(4)}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-7 px-1 border-success/30 text-success" onClick={() => handleAnswer(5)}>
                <Sparkles className="h-3 w-3" />
              </Button>
            </div>
          )}
          <p className="text-[10px] text-center text-muted-foreground">{currentIdx + 1}/{cards.length} • Toque para virar</p>
        </div>
      ) : cards.length === 0 && !showForm ? (
        <p className="text-xs text-muted-foreground text-center py-3">Nenhum flashcard ainda. Crie o primeiro!</p>
      ) : null}
    </Card>
  );
}

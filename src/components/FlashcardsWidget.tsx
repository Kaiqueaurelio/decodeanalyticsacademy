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

  const handleDifficulty = async (level: number) => {
    const card = cards[currentIdx];
    if (!card) return;
    const hours = level === 0 ? 1 : level === 1 ? 24 : 72;
    const next = new Date(Date.now() + hours * 3600000).toISOString();
    await supabase.from('flashcards').update({ difficulty: level, next_review: next }).eq('id', card.id);
    setFlipped(false);
    setCurrentIdx(prev => (prev + 1) % cards.length);
  };

  const current = cards[currentIdx];

  return (
    <Card className="p-4 bg-card border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Flashcards</span>
          <span className="text-[10px] text-muted-foreground">({cards.length})</span>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
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
            <div className="flex gap-1.5 justify-center animate-fade-in">
              <Button size="sm" variant="outline" className="text-[10px] h-7 border-destructive/30 text-destructive" onClick={() => handleDifficulty(0)}>
                <X className="h-3 w-3 mr-0.5" /> Difícil
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleDifficulty(1)}>
                <RotateCcw className="h-3 w-3 mr-0.5" /> Médio
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-7 border-success/30 text-success" onClick={() => handleDifficulty(2)}>
                <Check className="h-3 w-3 mr-0.5" /> Fácil
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

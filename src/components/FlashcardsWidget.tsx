import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  Library,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Wand2,
  X,
} from 'lucide-react';
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

type FormMode = 'create' | 'edit' | null;

export function FlashcardsWidget({ apostilaId }: Props) {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCards([]);
      return;
    }

    let cancelled = false;
    const loadCards = async () => {
      let query = supabase
        .from('flashcards')
        .select('id, front, back, difficulty, next_review, ease_factor, interval_days, repetitions')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (apostilaId) query = query.eq('apostila_id', apostilaId);

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error('Erro ao carregar flashcards da apostila:', error);
        toast.error('Não foi possível carregar os flashcards desta apostila.');
        return;
      }
      setCards((data || []) as Flashcard[]);
    };

    void loadCards();
    return () => { cancelled = true; };
  }, [userId, apostilaId]);

  useEffect(() => {
    if (cards.length === 0) {
      setCurrentIdx(0);
      setFlipped(false);
      return;
    }
    if (currentIdx >= cards.length) setCurrentIdx(cards.length - 1);
  }, [cards.length, currentIdx]);

  const dueCount = cards.filter(c => !c.next_review || new Date(c.next_review).getTime() <= Date.now()).length;

  const resetForm = () => {
    setFormMode(null);
    setFront('');
    setBack('');
  };

  const openCreateForm = () => {
    setFront('');
    setBack('');
    setFormMode('create');
  };

  const openEditForm = () => {
    const current = cards[currentIdx];
    if (!current) return;
    setFront(current.front);
    setBack(current.back);
    setFormMode('edit');
  };

  const saveCard = async () => {
    if (!userId) return;
    const nextFront = front.trim();
    const nextBack = back.trim();
    if (!nextFront || !nextBack) {
      toast.error('Preencha a pergunta e a resposta.');
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'edit') {
        const current = cards[currentIdx];
        if (!current) return;
        const { data, error } = await supabase
          .from('flashcards')
          .update({ front: nextFront, back: nextBack })
          .eq('id', current.id)
          .eq('user_id', userId)
          .select('id')
          .single();
        if (error) throw error;
        if (!data) throw new Error('Flashcard não encontrado para este aluno.');
        setCards((previous) => previous.map((card) => (
          card.id === current.id ? { ...card, front: nextFront, back: nextBack } : card
        )));
        toast.success('Flashcard atualizado.');
      } else {
        const { data, error } = await supabase
          .from('flashcards')
          .insert({
            user_id: userId,
            front: nextFront,
            back: nextBack,
            apostila_id: apostilaId || null,
          })
          .select('id, front, back, difficulty, next_review, ease_factor, interval_days, repetitions')
          .single();
        if (error) throw error;
        setCards((previous) => [...previous, data as Flashcard]);
        setCurrentIdx(cards.length);
        toast.success('Flashcard criado!');
      }
      setFlipped(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar flashcard:', error);
      toast.error(formMode === 'edit' ? 'Não foi possível atualizar o flashcard.' : 'Não foi possível criar o flashcard.');
    } finally {
      setSaving(false);
    }
  };

  const moveCard = (direction: -1 | 1) => {
    if (cards.length < 2) return;
    setFlipped(false);
    setCurrentIdx((previous) => (previous + direction + cards.length) % cards.length);
  };

  const exportCards = async () => {
    if (cards.length === 0) return;
    setExporting(true);
    try {
      const { exportFlashcardsToPdf } = await import('@/lib/flashcard-pdf');
      await exportFlashcardsToPdf(
        cards.map((card) => ({ question: card.front, answer: card.back })),
        { title: 'Flashcards desta apostila' },
      );
      toast.success('PDF gerado com a formatação dos cartões.');
    } catch (error) {
      console.error('Erro ao exportar flashcards:', error);
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setExporting(false);
    }
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
    const { error } = await supabase.from('flashcards').update({
      ease_factor: result.ease_factor,
      interval_days: result.interval_days,
      repetitions: result.repetitions,
      next_review: result.next_review,
      last_reviewed: new Date().toISOString(),
      difficulty: quality < 3 ? 0 : quality === 3 ? 1 : 2,
    }).eq('id', card.id).eq('user_id', userId || '');
    if (error) {
      console.error('Erro ao revisar flashcard:', error);
      toast.error('Não foi possível salvar esta revisão.');
      return;
    }
    setCards((previous) => previous.map((item) => item.id === card.id ? {
      ...item,
      ease_factor: result.ease_factor,
      interval_days: result.interval_days,
      repetitions: result.repetitions,
      next_review: result.next_review,
      difficulty: quality < 3 ? 0 : quality === 3 ? 1 : 2,
    } : item));
    toast.success(`Próx. revisão em ${formatNextReview(result.next_review)}`);
    setFlipped(false);
    moveCard(1);
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
        <div className="flex items-center gap-0.5 sm:gap-1">
          {dueCount > 0 && (
            <Button size="icon" variant="ghost" className="h-9 w-9" title="Revisar todos" aria-label="Revisar todos os flashcards" onClick={() => navigate('/review')}>
              <Brain className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-9 w-9" title="Abrir biblioteca" aria-label="Abrir biblioteca de flashcards" onClick={() => navigate('/flashcards')}>
            <Library className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" title="Baixar PDF" aria-label="Baixar flashcards em PDF" disabled={exporting || cards.length === 0} onClick={() => void exportCards()}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" title="Criar flashcard" aria-label="Criar novo flashcard" onClick={openCreateForm}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {formMode && (
        <div className="space-y-2 mb-3 animate-fade-in">
          <p className="text-xs font-semibold">{formMode === 'edit' ? 'Editar flashcard' : 'Novo flashcard'}</p>
          <Input aria-label="Pergunta do flashcard" placeholder="Frente (pergunta)" value={front} onChange={e => setFront(e.target.value)} className="h-10 text-sm" maxLength={2000} />
          <Textarea aria-label="Resposta do flashcard" placeholder="Verso (resposta)" value={back} onChange={e => setBack(e.target.value)} className="min-h-[88px] text-sm" maxLength={5000} />
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => void saveCard()} disabled={saving || !front.trim() || !back.trim()} className="h-10 gap-1.5 text-xs gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {formMode === 'edit' ? 'Salvar' : 'Criar'}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm} disabled={saving} className="h-10 text-xs">Cancelar</Button>
          </div>
        </div>
      )}

      {current && !formMode ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="min-h-[112px] w-full rounded-lg border border-border/50 bg-accent/30 p-3 text-center smooth-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={flipped ? 'Mostrar pergunta' : 'Mostrar resposta'}
          >
            <p className="text-[10px] text-muted-foreground mb-1">{flipped ? 'Resposta' : 'Pergunta'}</p>
            <p className="max-h-40 overflow-y-auto break-words whitespace-pre-wrap text-sm font-medium">{flipped ? current.back : current.front}</p>
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
                <Wand2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <Button type="button" size="icon" variant="outline" className="h-11 w-11" disabled={cards.length < 2} aria-label="Flashcard anterior" onClick={() => moveCard(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{currentIdx + 1}/{cards.length} • Toque para virar</p>
              <Button type="button" size="sm" variant="ghost" className="mt-1 h-8 gap-1.5 text-xs" onClick={openEditForm}>
                <Pencil className="h-3.5 w-3.5" /> Editar este cartão
              </Button>
            </div>
            <Button type="button" size="icon" variant="outline" className="h-11 w-11" disabled={cards.length < 2} aria-label="Próximo flashcard" onClick={() => moveCard(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : cards.length === 0 && !formMode ? (
        <p className="text-xs text-muted-foreground text-center py-3">Nenhum flashcard ainda. Crie o primeiro!</p>
      ) : null}
    </Card>
  );
}

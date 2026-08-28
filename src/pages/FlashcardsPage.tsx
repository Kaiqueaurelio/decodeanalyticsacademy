import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flashcard } from '@/components/Flashcard';
import { useFlashcards, type Flashcard as FlashcardItem } from '@/hooks/useFlashcards';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Brain, Download, Library, Loader2, Pencil, Save, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const reviewDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatReviewDate(value: string | null) {
  if (!value) return 'Disponível agora';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return `Revisão em ${reviewDateFormatter.format(date)}`;
}

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { cards, allCards, loading, rateCard, updateCard } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardItem | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const totalCards = cards.length;
  const currentCard = cards[currentIndex];
  const progress = sessionTotal > 0 ? (reviewedCount / sessionTotal) * 100 : 0;

  useEffect(() => {
    if (!loading && sessionTotal === 0 && cards.length > 0) {
      setSessionTotal(cards.length);
    }
  }, [cards.length, loading, sessionTotal]);

  useEffect(() => {
    if (currentIndex >= cards.length && cards.length > 0) setCurrentIndex(0);
  }, [cards.length, currentIndex]);

  const handleRate = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    const updated = await rateCard(currentCard.id, difficulty);
    if (!updated) return;

    const nextReviewedCount = reviewedCount + 1;
    setReviewedCount(nextReviewedCount);
    if (totalCards <= 1 || nextReviewedCount >= sessionTotal) {
      setSessionFinished(true);
      return;
    }
    if (currentIndex >= totalCards - 1) setCurrentIndex(0);
  };

  const openEditor = (card: FlashcardItem) => {
    setEditingCard(card);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const closeEditor = () => {
    if (savingEdit) return;
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const saveEditedCard = async () => {
    if (!editingCard) return;
    setSavingEdit(true);
    const saved = await updateCard(editingCard.id, editQuestion, editAnswer);
    setSavingEdit(false);
    if (saved) {
      setEditingCard(null);
      setEditQuestion('');
      setEditAnswer('');
    }
  };

  const handleExportPdf = async () => {
    if (allCards.length === 0) {
      toast.error('Você ainda não possui flashcards para exportar.');
      return;
    }

    setExportingPdf(true);
    const toastId = toast.loading('Montando o PDF dos flashcards...');
    try {
      const { exportFlashcardsToPdf } = await import('@/lib/flashcard-pdf');
      await exportFlashcardsToPdf(allCards, { title: 'Meus Flashcards' });
      toast.success('PDF gerado mantendo o formato dos cartões.', { id: toastId });
    } catch (error) {
      console.error('Erro ao exportar flashcards:', error);
      toast.error('Não foi possível gerar o PDF.', { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-primary">
                <Brain className="h-5 w-5 shrink-0" />
                <h1 className="truncate text-lg font-bold sm:text-xl">Flashcards</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Revise, edite e exporte seus cartões de estudo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
            {currentCard ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEditor(currentCard)}>
                <Pencil className="h-3.5 w-3.5" /> Editar atual
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void handleExportPdf()}
              disabled={exportingPdf || loading || allCards.length === 0}
            >
              {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Baixar PDF
            </Button>
          </div>
        </header>

        {!sessionFinished && sessionTotal > 0 ? (
          <div className="mx-auto mb-8 max-w-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Progresso da sessão</span>
              <span>{Math.min(reviewedCount + 1, sessionTotal)} / {sessionTotal}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : null}

        <section className="mx-auto flex min-h-[390px] max-w-2xl flex-col justify-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Buscando seus cartões...</p>
              </motion.div>
            ) : sessionFinished || totalCards === 0 ? (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 text-center sm:p-8"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
                  <Trophy className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold sm:text-2xl">Tudo revisado!</h2>
                  <p className="text-sm text-muted-foreground">
                    {allCards.length === 0
                      ? 'Você ainda não possui cartões. Crie cartões dentro de uma apostila.'
                      : 'Nenhum cartão está pendente agora. Você ainda pode editar ou baixar sua biblioteca abaixo.'}
                  </p>
                </div>
              </motion.div>
            ) : currentCard ? (
              <motion.div
                key={currentCard.id}
                initial={{ x: 32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -32, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <Flashcard
                  question={currentCard.question}
                  answer={currentCard.answer}
                  onRate={handleRate}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        <section className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5" aria-labelledby="flashcard-library-title">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="flashcard-library-title" className="flex items-center gap-2 font-bold">
                <Library className="h-4 w-4 text-primary" /> Minha biblioteca
              </h2>
              <p className="text-xs text-muted-foreground">
                {allCards.length} {allCards.length === 1 ? 'cartão salvo' : 'cartões salvos'}
              </p>
            </div>
            <Button
              size="sm"
              className="w-full gap-1.5 sm:w-auto"
              onClick={() => void handleExportPdf()}
              disabled={exportingPdf || allCards.length === 0}
            >
              {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Exportar todos em PDF
            </Button>
          </div>

          {allCards.length > 0 ? (
            <div className="grid max-h-[520px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {allCards.map((card, index) => (
                <article
                  key={card.id}
                  className="rounded-xl border border-border/60 bg-background/70 p-4 [content-visibility:auto]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Cartão {index + 1}</span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => openEditor(card)}>
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pergunta</p>
                  <p className="mt-1 break-words whitespace-pre-wrap text-sm font-semibold">{card.question}</p>
                  <div className="my-3 h-px bg-border/60" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resposta</p>
                  <p className="mt-1 break-words whitespace-pre-wrap text-sm text-foreground/85">{card.answer}</p>
                  <p className="mt-3 text-[10px] text-muted-foreground">{formatReviewDate(card.next_review)}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Seus flashcards aparecerão aqui assim que forem criados em uma apostila.
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(editingCard)} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar flashcard</DialogTitle>
            <DialogDescription>As alterações serão salvas somente no seu cartão.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="flashcard-question">Pergunta</Label>
              <Textarea
                id="flashcard-question"
                value={editQuestion}
                onChange={(event) => setEditQuestion(event.target.value)}
                className="min-h-24 resize-y"
                maxLength={2000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flashcard-answer">Resposta</Label>
              <Textarea
                id="flashcard-answer"
                value={editAnswer}
                onChange={(event) => setEditAnswer(event.target.value)}
                className="min-h-32 resize-y"
                maxLength={5000}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeEditor} disabled={savingEdit}>Cancelar</Button>
            <Button onClick={() => void saveEditedCard()} disabled={savingEdit || !editQuestion.trim() || !editAnswer.trim()} className="gap-1.5">
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

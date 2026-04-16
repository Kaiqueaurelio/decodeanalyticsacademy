import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquareQuote, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TestimonialDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (content.trim().length < 20) { toast.error('Mínimo de 20 caracteres'); return; }
    if (content.length > 500) { toast.error('Máximo de 500 caracteres'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('testimonials' as any).insert({
      user_id: user.id,
      content: content.trim(),
      rating,
    } as any);
    setSubmitting(false);

    if (error) { toast.error('Erro ao enviar depoimento'); return; }
    toast.success('Depoimento enviado! Após aprovação, aparecerá na página inicial.');
    setContent('');
    setRating(5);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquareQuote className="h-4 w-4" />
          Deixar depoimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Compartilhe sua experiência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Seu depoimento poderá aparecer na página inicial da plataforma após aprovação.
          </p>

          {/* Stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
              >
                <Star className={cn(
                  'h-7 w-7 transition-colors',
                  n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/40'
                )} />
              </button>
            ))}
          </div>

          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Conte como a Decode Analytics está te ajudando nos estudos..."
            className="min-h-[120px] text-sm"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-[10px] font-mono',
              content.length < 20 ? 'text-muted-foreground' :
                content.length > 480 ? 'text-destructive' : 'text-primary'
            )}>
              {content.length}/500 (mín. 20)
            </span>
            <Button onClick={handleSubmit} disabled={submitting || content.trim().length < 20}>
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvasiveButtonProps {
  email: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function EvasiveButton({ email, children, disabled, className, onClick }: EvasiveButtonProps) {
  const [evadeCount, setEvadeCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [resending, setResending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const evade = useCallback(() => {
    if (evadeCount >= 3) {
      setShowModal(true);
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const maxX = Math.min(rect.width * 0.6, 120);
    const maxY = Math.min(rect.height * 0.4, 60);
    const newX = (Math.random() - 0.5) * maxX * 2;
    const newY = (Math.random() - 0.5) * maxY * 2;
    x.set(newX);
    y.set(newY);
    setEvadeCount(c => c + 1);
  }, [evadeCount, x, y]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    evade();
  }, [evade]);

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success('Link de verificação reenviado!');
  };

  return (
    <>
      <div ref={containerRef} className="relative" style={{ minHeight: '48px' }}>
        <motion.div style={{ x: springX, y: springY }}>
          <Button
            type="submit"
            disabled={disabled}
            className={className}
            onMouseEnter={handleInteraction}
            onTouchStart={handleInteraction}
            onClick={onClick}
          >
            {children}
          </Button>
        </motion.div>
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" />
              Verifique seu e-mail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enviamos um link de verificação para <strong className="text-foreground">{email}</strong>.
              Confirme seu e-mail antes de acessar a plataforma.
            </p>
            <Button onClick={handleResend} disabled={resending} className="w-full">
              {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Reenviar link de verificação
            </Button>
            <button
              type="button"
              onClick={() => { setShowModal(false); setEvadeCount(0); x.set(0); y.set(0); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground smooth-all"
            >
              Voltar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

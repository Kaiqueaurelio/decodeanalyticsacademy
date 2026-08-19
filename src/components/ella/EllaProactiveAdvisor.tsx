import React, { useEffect, useState } from 'react';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const EllaProactiveAdvisor: React.FC = () => {
  const { user } = useAuth();
  const [tip, setTip] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Proactive trigger logic based on time or activity
    const timer = setTimeout(() => {
      const messages = [
        "Olá! Notei que você está estudando hoje. Que tal revisar o Caderno de Erros para fixar os conceitos que faltaram?",
        "Dica da Ella: Divida seus estudos em blocos de 25 minutos (Pomodoro). Isso aumenta a retenção em até 40%!",
        "Paralelo aos estudos, verifique a aba de Vagas e Estágios. Temos excelentes oportunidades em São Paulo compatíveis com seu curso!",
        "Lembre-se: a consistência vence a intensidade. Continue firme na sua trilha hoje!"
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setTip(randomMsg);
      setIsOpen(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [user]);

  if (!isOpen || !tip) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-card/95 backdrop-blur-md border border-primary/30 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Ella Mentoria Proativa</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar dica"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
};

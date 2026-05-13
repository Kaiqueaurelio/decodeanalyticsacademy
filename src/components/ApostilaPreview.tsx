import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApostilaPreviewProps {
  content: string;
  apostilaTitle: string;
  apostilaId: string;
  isLoggedIn: boolean;
}

export function ApostilaPreview({
  content,
  apostilaTitle,
  apostilaId,
  isLoggedIn,
}: ApostilaPreviewProps) {
  const navigate = useNavigate();
  const [showBlocker, setShowBlocker] = useState(!isLoggedIn);

  // Limita o conteúdo a 500 caracteres para o preview
  const previewContent = content.substring(0, 500);
  const hasMoreContent = content.length > 500;

  // Quando o aluno está logado, o conteúdo formatado é renderizado pelas
  // seções abaixo (ApostilaContentBoundary). Esse preview só serve para o
  // estado deslogado (paywall com blur). Renderizar `content` cru aqui via
  // dangerouslySetInnerHTML transformava o markdown em um paredão de texto.
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="relative">
      {/* Conteúdo com efeito de desfoque */}
      <motion.div
        animate={{ opacity: showBlocker ? 0.5 : 1 }}
        className={`${showBlocker ? 'blur-sm' : ''} transition-all`}
      >
        <div
          dangerouslySetInnerHTML={{ __html: previewContent }}
          className="prose prose-sm max-w-none"
        />
        {hasMoreContent && (
          <p className="text-muted-foreground italic mt-4">
            ... [conteúdo limitado ao preview]
          </p>
        )}
      </motion.div>

      {/* Bloqueador com CTA */}
      {showBlocker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-background/80 to-background rounded-xl"
        >
          <div className="text-center space-y-6 max-w-md p-6">
            {/* Ícone */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Título e Descrição */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Conteúdo Exclusivo</h3>
              <p className="text-sm text-muted-foreground">
                Para continuar lendo <strong>{apostilaTitle}</strong> e acessar todos os áudios, vídeos e exercícios, faça login ou crie sua conta gratuita.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/login', { state: { from: `/apostila/${apostilaId}` } })}
                className="w-full gap-2 h-11"
              >
                <LogIn size={18} />
                Fazer Login
              </Button>

              <Button
                onClick={() => navigate('/login', { state: { from: `/apostila/${apostilaId}`, signup: true } })}
                variant="outline"
                className="w-full gap-2 h-11"
              >
                <UserPlus size={18} />
                Criar Conta Gratuita
              </Button>
            </div>

            {/* Benefícios */}
            <div className="pt-4 border-t border-border/50 space-y-2 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Ao se cadastrar, você terá acesso a:
              </p>
              <ul className="text-sm space-y-1.5">
                {[
                  '📚 Todas as apostilas completas',
                  '🎧 Áudios das aulas',
                  '🎬 Vídeos explicativos',
                  '✏️ Exercícios e simulados',
                  '⭐ Flashcards inteligentes',
                  '🏆 Gamificação e ranking',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ArrowRight size={12} className="text-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

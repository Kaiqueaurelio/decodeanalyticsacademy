import React, { useState } from 'react';
import { useSocialFeatures } from '@/hooks/useSocialFeatures';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Heart, MessageCircle, Share2, Trash2, Loader2, Eye, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ApostilaSocialSectionProps {
  apostilaId: string;
  apostilaTitle: string;
}

export function ApostilaSocialSection({ apostilaId, apostilaTitle }: ApostilaSocialSectionProps) {
  const { user } = useAuth();
  const {
    likes,
    userLiked,
    comments,
    views,
    loading,
    toggleLike,
    addComment,
    deleteComment,
  } = useSocialFeatures(apostilaId);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmitComment = async () => {
    setIsSubmitting(true);
    try {
      await addComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/apostila/${apostilaId}?shared=true`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: apostilaTitle,
          text: `Confira esta apostila: ${apostilaTitle}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Erro ao copiar link');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mt-12 space-y-6 border-t border-border/50 pt-8">
      {/* Barra de Ações Sociais */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
        {/* Curtidas */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            userLiked
              ? 'bg-red-500/20 text-red-600'
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <Heart
            size={18}
            className={userLiked ? 'fill-current' : ''}
          />
          <span className="text-sm font-medium">{likes}</span>
        </motion.button>

        {/* Comentários */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">{comments.length}</span>
        </motion.button>

        {/* Visualizações */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground">
          <Eye size={18} />
          <span className="text-sm font-medium">{views}</span>
        </div>

        {/* Compartilhar */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground transition-all ml-auto"
        >
          {copied ? (
            <>
              <Check size={18} className="text-green-600" />
              <span className="text-sm font-medium">Copiado!</span>
            </>
          ) : (
            <>
              <Share2 size={18} />
              <span className="text-sm font-medium">Compartilhar</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Seção de Comentários */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Formulário de Novo Comentário */}
            {user ? (
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="resize-none min-h-12"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewComment('')}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Comentar'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Faça login para comentar
                </p>
                <Button size="sm" variant="outline">
                  Fazer Login
                </Button>
              </div>
            )}

            {/* Lista de Comentários */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground">
                          {comment.user?.user_metadata?.full_name || comment.user?.email}
                        </p>
                        <p className="text-sm mt-1 break-words">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {user?.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteComment(comment.id)}
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

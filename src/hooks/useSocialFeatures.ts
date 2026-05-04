import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  user?: {
    email: string;
    user_metadata?: { full_name?: string };
  };
}

export function useSocialFeatures(apostilaId: string) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);

  // Carrega dados sociais
  useEffect(() => {
    loadSocialData();
    recordView();
  }, [apostilaId]);

  const loadSocialData = async () => {
    try {
      setLoading(true);

      // Carrega curtidas
      const { data: likesData, count: likesCount } = await supabase
        .from('apostila_likes')
        .select('*', { count: 'exact' })
        .eq('apostila_id', apostilaId);

      setLikes(likesCount || 0);

      // Verifica se o usuário curtiu
      if (user) {
        const { data: userLike } = await supabase
          .from('apostila_likes')
          .select('*')
          .eq('apostila_id', apostilaId)
          .eq('user_id', user.id)
          .single();

        setUserLiked(!!userLike);
      }

      // Carrega comentários
      const { data: commentsData } = await supabase
        .from('apostila_comments')
        .select('*')
        .eq('apostila_id', apostilaId)
        .order('created_at', { ascending: false });

      setComments(commentsData || []);

      // Carrega visualizações
      const { data: viewsData, count: viewsCount } = await supabase
        .from('apostila_views')
        .select('*', { count: 'exact' })
        .eq('apostila_id', apostilaId);

      setViews(viewsCount || 0);
    } catch (error) {
      console.error('Erro ao carregar dados sociais:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    try {
      const sessionId = sessionStorage.getItem('session_id') || `session_${Date.now()}`;
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }

      await supabase.from('apostila_views').insert({
        apostila_id: apostilaId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }

    try {
      if (userLiked) {
        await supabase
          .from('apostila_likes')
          .delete()
          .eq('apostila_id', apostilaId)
          .eq('user_id', user.id);

        setUserLiked(false);
        setLikes(Math.max(0, likes - 1));
        toast.success('Curtida removida');
      } else {
        await supabase.from('apostila_likes').insert({
          apostila_id: apostilaId,
          user_id: user.id,
        });

        setUserLiked(true);
        setLikes(likes + 1);
        toast.success('Apostila curtida!');
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      toast.error('Erro ao processar curtida');
    }
  };

  const addComment = async (content: string) => {
    if (!user) {
      toast.error('Faça login para comentar');
      return;
    }

    if (!content.trim()) {
      toast.error('Comentário não pode estar vazio');
      return;
    }

    try {
      const { data: newComment, error } = await supabase
        .from('apostila_comments')
        .insert({
          apostila_id: apostilaId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setComments([newComment, ...comments]);
      toast.success('Comentário adicionado!');
      return newComment;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await supabase
        .from('apostila_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id);

      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('Comentário removido');
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      toast.error('Erro ao deletar comentário');
    }
  };

  return {
    likes,
    userLiked,
    comments,
    views,
    loading,
    toggleLike,
    addComment,
    deleteComment,
    loadSocialData,
  };
}

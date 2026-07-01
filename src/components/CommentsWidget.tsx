import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle, Send, Trash2, Pencil, X, Check, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string; email: string; avatar_url: string | null };
}

interface CommentsWidgetProps {
  contextType: 'apostila' | 'exercise';
  contextId: string;
  compact?: boolean;
}

export function CommentsWidget({ contextType, contextId, compact = false }: CommentsWidgetProps) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expanded, setExpanded] = useState(!compact);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments' as any)
      .select('*')
      .eq('context_type', contextType)
      .eq('context_id', contextId)
      .order('created_at', { ascending: true });

    if (data) {
      // Fetch profiles for comment authors
      const userIds = [...new Set((data as any[]).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setComments((data as any[]).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || { full_name: '', email: '', avatar_url: null }
      })));
    }
    setLoading(false);
  }, [contextType, contextId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    if (newComment.trim().length < 2) { toast.error('Comentário muito curto.'); return; }
    if (newComment.length > 2000) { toast.error('Comentário muito longo (máx 2000 caracteres).'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('comments' as any).insert({
      user_id: user.id,
      content: newComment.trim(),
      context_type: contextType,
      context_id: contextId,
    } as any);

    if (error) {
      toast.error('Erro ao enviar comentário.');
    } else {
      setNewComment('');
      toast.success('Comentário adicionado!');
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('comments' as any).delete().eq('id', commentId);
    if (error) { toast.error('Erro ao excluir.'); return; }
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast.success('Comentário excluído.');
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim() || editText.length > 2000) return;
    const { error } = await supabase.from('comments' as any).update({ content: editText.trim(), updated_at: new Date().toISOString() } as any).eq('id', commentId);
    if (error) { toast.error('Erro ao editar.'); return; }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editText.trim(), updated_at: new Date().toISOString() } : c));
    setEditingId(null);
    toast.success('Comentário editado.');
  };

  const getInitials = (name: string, email: string) => {
    if (name) return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    return email?.[0]?.toUpperCase() || '?';
  };

  const formatTime = (date: string) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR }); }
    catch { return ''; }
  };

  return (
    <div className="mt-6">
      {/* Header */}
      <button
        onClick={() => compact && setExpanded(!expanded)}
        className={`flex items-center gap-2 mb-3 ${compact ? 'cursor-pointer hover:opacity-80' : ''}`}
      >
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Comentários</span>
        {comments.length > 0 && (
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
            {comments.length}
          </span>
        )}
      </button>

      {(!compact || expanded) && (
        <div className="space-y-3 animate-fade-in">
          {/* Comments list */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {comments.map(comment => (
                <div key={comment.id} className="group flex gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border/30 transition-colors hover:bg-secondary/50">
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                      {getInitials(comment.profile?.full_name || '', comment.profile?.email || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold truncate">
                        {comment.profile?.full_name || comment.profile?.email || 'Usuário'}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTime(comment.created_at)}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-[9px] text-muted-foreground/60 italic">(editado)</span>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea value={editText} onChange={e => setEditText(e.target.value)}
                          className="min-h-[60px] text-xs bg-background/50" autoFocus />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3" /> Cancelar
                          </Button>
                          <Button size="sm" className="h-6 text-[10px] gap-1 gradient-primary text-primary-foreground" onClick={() => handleEdit(comment.id)}>
                            <Check className="h-3 w-3" /> Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line break-words">
                        {comment.content}
                      </p>
                    )}

                    {/* Actions */}
                    {!editingId && user && (user.id === comment.user_id || isAdmin) && (
                      <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.id === comment.user_id && (
                          <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditingId(comment.id); setEditText(comment.content); }}>
                            <Pencil className="h-2.5 w-2.5" /> Editar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}>
                          <Trash2 className="h-2.5 w-2.5" /> Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New comment input */}
          {user && (
            <div className="flex gap-2 items-end pt-1">
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="min-h-[44px] max-h-32 text-xs resize-none bg-secondary/20 border-border/40 flex-1"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              />
              <Button size="icon" className="h-[44px] w-[44px] shrink-0 gradient-primary text-primary-foreground"
                disabled={submitting || !newComment.trim()}
                onClick={handleSubmit} aria-label="Botão">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

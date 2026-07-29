import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  Send, Heart, MessageCircle, Trash2, Loader2, Users, Pin, Share2, Copy, Reply, Link2, Flag, PenLine,
} from 'lucide-react';
import { ActionSheet, type ActionItem } from '@/components/ActionSheet';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MentionTextarea, MentionContent } from '@/components/MentionTextarea';
import { notifyMentions } from '@/lib/mentions';
import { useLongPress } from '@/hooks/useLongPress';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  is_general: boolean;
  sort_order: number;
}

interface Post {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  profile?: { full_name: string; email: string; avatar_url: string | null };
  likes_count?: number;
  user_liked?: boolean;
  replies_count?: number;
}

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string; email: string };
}

const getInitials = (name: string, email: string) => {
  if (name) return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return email?.[0]?.toUpperCase() || '?';
};
const formatTime = (d: string) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR }); }
  catch { return ''; }
};

export default function CommunityPage() {
  const { user, isAdmin } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openReplies, setOpenReplies] = useState<Record<string, Reply[] | undefined>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showChannels, setShowChannels] = useState(false); // mobile drawer (start on feed)
  const channelRef = useRef<any>(null);

  // Load channels
  useEffect(() => {
    supabase.from('community_channels' as any).select('*').order('sort_order')
      .then(({ data }) => {
        const list = (data as any[]) || [];
        setChannels(list);
        if (list.length && !activeChannel) setActiveChannel(list[0]);
      });
  }, []);

  // Load posts whenever channel changes
  const loadPosts = useCallback(async (channelId: string) => {
    setLoadingPosts(true);
    const { data: postsData } = await supabase
      .from('community_posts' as any)
      .select('*')
      .eq('channel_id', channelId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    const list = (postsData as any[]) || [];
    if (!list.length) { setPosts([]); setLoadingPosts(false); return; }

    const userIds = [...new Set(list.map(p => p.user_id))];
    const postIds = list.map(p => p.id);

    const [{ data: profiles }, { data: likes }, { data: replies }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email, avatar_url').in('user_id', userIds),
      supabase.from('community_post_likes' as any).select('post_id, user_id').in('post_id', postIds),
      supabase.from('community_replies' as any).select('post_id').in('post_id', postIds),
    ]);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const likesMap = new Map<string, { count: number; mine: boolean }>();
    (likes as any[] || []).forEach(l => {
      const cur = likesMap.get(l.post_id) || { count: 0, mine: false };
      cur.count++;
      if (l.user_id === user?.id) cur.mine = true;
      likesMap.set(l.post_id, cur);
    });
    const repliesCount = new Map<string, number>();
    (replies as any[] || []).forEach(r => repliesCount.set(r.post_id, (repliesCount.get(r.post_id) || 0) + 1));

    setPosts(list.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) || { full_name: '', email: '', avatar_url: null },
      likes_count: likesMap.get(p.id)?.count || 0,
      user_liked: likesMap.get(p.id)?.mine || false,
      replies_count: repliesCount.get(p.id) || 0,
    })));
    setLoadingPosts(false);
  }, [user?.id]);

  useEffect(() => {
    if (!activeChannel) return;
    loadPosts(activeChannel.id);

    // Realtime subscription
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase.channel(`community-${activeChannel.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'community_posts',
        filter: `channel_id=eq.${activeChannel.id}`,
      }, () => loadPosts(activeChannel.id))
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [activeChannel, loadPosts]);

  const handleSubmit = async () => {
    if (!user || !activeChannel || !newPost.trim()) return;
    if (newPost.length > 2000) { toast.error('Máximo de 2000 caracteres'); return; }
    setSubmitting(true);
    const content = newPost.trim();
    const { data, error } = await supabase.from('community_posts' as any).insert({
      channel_id: activeChannel.id,
      user_id: user.id,
      content,
    } as any).select('id').maybeSingle();
    if (error) toast.error('Erro ao publicar');
    else {
      setNewPost('');
      toast.success('Publicado!');
      const postId = (data as any)?.id;
      if (postId) notifyMentions({ text: content, authorId: user.id, contextType: 'post', contextId: postId });
    }
    setSubmitting(false);
  };

  const handleDeletePost = async (id: string) => {
    const { error } = await supabase.from('community_posts' as any).delete().eq('id', id);
    if (error) return toast.error('Erro ao excluir');
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Post excluído');
  };

  const handleLike = async (post: Post) => {
    if (!user) return;
    if (post.user_liked) {
      await supabase.from('community_post_likes' as any).delete()
        .eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('community_post_likes' as any).insert({
        post_id: post.id, user_id: user.id,
      } as any);
    }
    setPosts(prev => prev.map(p => p.id === post.id ? {
      ...p,
      user_liked: !post.user_liked,
      likes_count: (post.likes_count || 0) + (post.user_liked ? -1 : 1),
    } : p));
  };

  const toggleReplies = async (postId: string) => {
    if (openReplies[postId] !== undefined) {
      setOpenReplies(prev => ({ ...prev, [postId]: undefined }));
      return;
    }
    const { data } = await supabase
      .from('community_replies' as any).select('*')
      .eq('post_id', postId).order('created_at', { ascending: true });
    const list = (data as any[]) || [];
    const userIds = [...new Set(list.map(r => r.user_id))];
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, full_name, email').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setOpenReplies(prev => ({
      ...prev,
      [postId]: list.map(r => ({ ...r, profile: profileMap.get(r.user_id) || { full_name: '', email: '' } })),
    }));
  };

  const handleReply = async (postId: string) => {
    if (!user) return;
    const text = (replyText[postId] || '').trim();
    if (!text) return;
    if (text.length > 1000) { toast.error('Máximo de 1000 caracteres'); return; }
    const { data, error } = await supabase.from('community_replies' as any).insert({
      post_id: postId, user_id: user.id, content: text,
    } as any).select('id').maybeSingle();
    if (error) return toast.error('Erro ao responder');
    setReplyText(prev => ({ ...prev, [postId]: '' }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p));
    const replyId = (data as any)?.id;
    if (replyId) notifyMentions({ text, authorId: user.id, contextType: 'reply', contextId: replyId });
    toggleReplies(postId); // close
    setTimeout(() => toggleReplies(postId), 50); // reopen with fresh data
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl">Comunidade</h1>
          <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
            Converse com sua turma
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Channels sidebar */}
          <aside className={cn(
            "lg:block",
            showChannels ? "block" : "hidden",
          )}>
            <Card className="p-3 sticky top-20">
              <p className="text-[10px] font-mono-label uppercase text-muted-foreground tracking-wider mb-2 px-2">
                Canais
              </p>
              <div className="space-y-1">
                {channels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => { setActiveChannel(ch); setShowChannels(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors text-left",
                      activeChannel?.id === ch.id
                        ? "bg-primary/15 text-primary font-semibold"
                        : "hover:bg-secondary/60 text-foreground/80"
                    )}
                  >
                    <span aria-hidden="true" className="text-base">{ch.icon}</span>
                    <span className="truncate">{ch.name}</span>
                    {ch.is_general && (
                      <span className="ml-auto text-[9px] bg-primary/20 text-primary px-1.5 rounded">GERAL</span>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          {/* Feed */}
          <main className={cn(showChannels ? "hidden lg:block" : "block")}>
            {/* Mobile: chip bar de canais (sempre visível) */}
            <div className="lg:hidden mb-3 -mx-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5 px-1 pb-1 min-w-max">
                {channels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch)}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors border",
                      activeChannel?.id === ch.id
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-secondary/40 border-border/40 text-foreground/80 hover:bg-secondary"
                    )}
                  >
                    <span aria-hidden="true">{ch.icon}</span>
                    <span>{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeChannel && (
              <Card className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span aria-hidden="true" className="text-xl">{activeChannel.icon}</span>
                  <h2 className="font-display text-lg">{activeChannel.name}</h2>
                </div>
                {activeChannel.description && (
                  <p className="text-xs text-muted-foreground">{activeChannel.description}</p>
                )}
              </Card>
            )}

            {/* New post */}
            {user && activeChannel && (
              <Card className="p-3 mb-4 border-primary/30 bg-primary/5">
                <p className="text-[10px] font-mono-label uppercase text-primary mb-2 tracking-wider flex items-center gap-1.5">
                  <PenLine className="h-3 w-3" strokeWidth={1.75} />
                  Escreva sua mensagem
                </p>
                <MentionTextarea
                  value={newPost}
                  onChange={setNewPost}
                  placeholder={`Compartilhe algo, tire dúvidas em #${activeChannel.name}... use @ para mencionar`}
                  className="min-h-[80px] text-sm bg-background border border-border/50 resize-none"
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {newPost.length}/2000 · use <span className="text-primary">@</span> para mencionar
                  </span>
                  <Button size="sm" disabled={!newPost.trim() || submitting} onClick={handleSubmit} className="gap-1.5">
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Publicar
                  </Button>
                </div>
              </Card>
            )}
            {!user && activeChannel && (
              <Card className="p-4 mb-4 text-center text-xs text-muted-foreground">
                Faça login para participar da conversa.
              </Card>
            )}

            {/* Posts list */}
            {loadingPosts ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-10 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma publicação ainda. Seja o primeiro a postar!
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={user?.id === post.user_id}
                    isAdmin={isAdmin}
                    onLike={() => handleLike(post)}
                    onToggleReplies={() => toggleReplies(post.id)}
                    onDelete={() => handleDeletePost(post.id)}
                    repliesNode={
                      openReplies[post.id] !== undefined && (
                        <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                          {openReplies[post.id]?.map(reply => (
                            <div key={reply.id} className="flex gap-2 p-2 rounded-lg bg-secondary/30">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                  {getInitials(reply.profile?.full_name || '', reply.profile?.email || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold truncate">
                                    {reply.profile?.full_name || reply.profile?.email?.split('@')[0] || 'Aluno'}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">{formatTime(reply.created_at)}</span>
                                </div>
                                <MentionContent className="text-xs text-foreground/80 whitespace-pre-line break-words block">{reply.content}</MentionContent>
                              </div>
                            </div>
                          ))}
                          {user && (
                            <div className="flex gap-2 items-end pt-1">
                              <div className="flex-1">
                                <MentionTextarea
                                  value={replyText[post.id] || ''}
                                  onChange={(v) => setReplyText(prev => ({ ...prev, [post.id]: v }))}
                                  placeholder="Responder... use @ para mencionar"
                                  className="min-h-[36px] text-xs resize-none"
                                  maxLength={1000}
                                  onSubmitShortcut={() => handleReply(post.id)}
                                />
                              </div>
                              <Button size="icon" className="h-9 w-9" onClick={() => handleReply(post.id)}>
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    }
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PostCard com long-press → bottom sheet
// ─────────────────────────────────────────────
interface PostCardProps {
  post: Post;
  isOwner: boolean;
  isAdmin: boolean;
  onLike: () => void;
  onToggleReplies: () => void;
  onDelete: () => void;
  repliesNode: React.ReactNode;
}

function PostCard({ post, isOwner, isAdmin, onLike, onToggleReplies, onDelete, repliesNode }: PostCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPress = useLongPress(() => setSheetOpen(true));

  const shareUrl = `${window.location.origin}/comunidade#post-${post.id}`;
  const authorLabel = post.profile?.full_name || post.profile?.email?.split('@')[0] || 'Post';

  const actions: ActionItem[] = [
    { id: 'reply', label: 'Responder', icon: Reply, variant: 'primary', onSelect: onToggleReplies },
    {
      id: 'like',
      label: post.user_liked ? 'Descurtir' : 'Curtir',
      icon: Heart,
      onSelect: onLike,
    },
    {
      id: 'share',
      label: 'Compartilhar',
      icon: Share2,
      onSelect: async () => {
        try {
          if (navigator.share) await navigator.share({ title: 'Post da comunidade', text: post.content.slice(0, 100), url: shareUrl });
          else { await navigator.clipboard.writeText(shareUrl); toast.success('Link copiado'); }
        } catch { /* cancelado */ }
      },
    },
    {
      id: 'copy-link',
      label: 'Copiar link',
      icon: Link2,
      onSelect: async () => {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado');
      },
    },
    {
      id: 'copy-text',
      label: 'Copiar texto',
      icon: Copy,
      onSelect: async () => {
        await navigator.clipboard.writeText(post.content);
        toast.success('Texto copiado');
      },
    },
    ...(!isOwner ? [{
      id: 'report',
      label: 'Denunciar',
      description: 'Avisar moderação sobre conteúdo impróprio',
      icon: Flag,
      onSelect: () => toast.success('Denúncia enviada à moderação'),
    } as ActionItem] : []),
    ...((isOwner || isAdmin) ? [{
      id: 'delete',
      label: 'Excluir post',
      icon: Trash2,
      variant: 'destructive' as const,
      onSelect: onDelete,
    } as ActionItem] : []),
  ];

  return (
    <ActionSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      title="Ações do post"
      description={authorLabel}
      actions={actions}
      trigger={
        <Card
          className="p-4 cursor-pointer select-none"
          onTouchStart={longPress.onTouchStart}
          onTouchEnd={longPress.onTouchEnd}
          onTouchMove={longPress.onTouchMove}
          onTouchCancel={longPress.onTouchCancel}
          onContextMenu={longPress.onContextMenu}
        >
          {post.pinned && (
            <div className="flex items-center gap-1 mb-2 text-[10px] font-mono-label uppercase text-primary">
              <Pin className="h-3 w-3" /> Fixado
            </div>
          )}
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {getInitials(post.profile?.full_name || '', post.profile?.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold truncate">{authorLabel}</span>
                <span className="text-[10px] text-muted-foreground">{formatTime(post.created_at)}</span>
              </div>
              <MentionContent className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line break-words block">
                {post.content}
              </MentionContent>

              <div className="flex items-center gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 gap-1.5 text-xs"
                  onClick={(e) => { e.stopPropagation(); if (longPress.wasLongPress()) return; onLike(); }}
                >
                  <Heart className={cn("h-3.5 w-3.5", post.user_liked && "fill-destructive text-destructive")} />
                  {post.likes_count || 0}
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 gap-1.5 text-xs"
                  onClick={(e) => { e.stopPropagation(); if (longPress.wasLongPress()) return; onToggleReplies(); }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.replies_count || 0}
                </Button>
                <span className="ml-auto text-[10px] text-muted-foreground/60 hidden sm:inline">
                  Mantenha pressionado para mais
                </span>
              </div>

              {repliesNode}
            </div>
          </div>
        </Card>
      }
    />
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Send, Upload, Link as LinkIcon, Clock, Zap, Image as ImageIcon, Video as VideoIcon,
  FileText, X, Check, AlertCircle, Play, Pause, Trash2, Eye, MousePointerClick
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'preview';
  content: string;
  timestamp: Date;
  metadata?: {
    title?: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    link_url?: string;
    ad_type?: 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';
    display_duration?: number;
    is_active?: boolean;
  };
}

interface AdData {
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  link_url: string;
  ad_type: 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';
  display_duration: number;
  is_active: boolean;
}

export function AdsChatBuilder() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adData, setAdData] = useState<AdData>({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    link_url: '',
    ad_type: 'banner',
    display_duration: 5,
    is_active: true,
  });
  const [testingAd, setTestingAd] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Mensagem inicial do sistema
    setMessages([
      {
        id: '1',
        type: 'system',
        content: 'Olá! 👋 Bem-vindo ao Gerenciador de Anúncios com Chat. Você pode criar anúncios de forma conversacional. Diga-me o que deseja criar!',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleFileUpload = async (file: File, fileType: 'image' | 'video') => {
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Selecione um arquivo de vídeo válido');
      return;
    }

    setLoading(true);
    try {
      const ext = file.name.split('.').pop() || (fileType === 'image' ? 'png' : 'mp4');
      const path = `ads/${fileType}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('ads').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('ads').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      if (fileType === 'image') {
        setAdData(prev => ({ ...prev, image_url: publicUrl }));
        addMessage({
          id: Date.now().toString(),
          type: 'user',
          content: `📷 Imagem enviada: ${file.name}`,
          timestamp: new Date(),
          metadata: { image_url: publicUrl },
        });
      } else {
        setAdData(prev => ({ ...prev, video_url: publicUrl }));
        addMessage({
          id: Date.now().toString(),
          type: 'user',
          content: `🎥 Vídeo enviado: ${file.name}`,
          timestamp: new Date(),
          metadata: { video_url: publicUrl },
        });
      }

      toast.success(`${fileType === 'image' ? 'Imagem' : 'Vídeo'} enviado com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao enviar ${fileType}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setLoading(true);

    try {
      // Processar comandos de chat para atualizar dados do anúncio
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes('título') || lowerInput.includes('nome')) {
        const titleMatch = input.match(/(?:título|nome)[:\s]+(.+?)(?:\.|$)/i);
        if (titleMatch) {
          setAdData(prev => ({ ...prev, title: titleMatch[1].trim() }));
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            content: `✅ Título definido como: "${titleMatch[1].trim()}"`,
            timestamp: new Date(),
          });
        }
      }

      if (lowerInput.includes('descrição') || lowerInput.includes('descricao')) {
        const descMatch = input.match(/(?:descrição|descricao)[:\s]+(.+?)(?:\.|$)/i);
        if (descMatch) {
          setAdData(prev => ({ ...prev, description: descMatch[1].trim() }));
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            content: `✅ Descrição definida: "${descMatch[1].trim()}"`,
            timestamp: new Date(),
          });
        }
      }

      if (lowerInput.includes('link') || lowerInput.includes('url')) {
        const urlMatch = input.match(/(?:link|url)[:\s]+(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
          setAdData(prev => ({ ...prev, link_url: urlMatch[1] }));
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            content: `✅ Link definido: ${urlMatch[1]}`,
            timestamp: new Date(),
          });
        }
      }

      if (lowerInput.includes('duração') || lowerInput.includes('duracao') || lowerInput.includes('segundos')) {
        const durationMatch = input.match(/(\d+)\s*(?:segundo|seg|s)/i);
        if (durationMatch) {
          const duration = Math.min(Math.max(parseInt(durationMatch[1]), 1), 30);
          setAdData(prev => ({ ...prev, display_duration: duration }));
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            content: `✅ Duração definida para ${duration} segundos`,
            timestamp: new Date(),
          });
        }
      }

      if (lowerInput.includes('tipo') || lowerInput.includes('posição') || lowerInput.includes('posicao')) {
        let adType: AdData['ad_type'] = 'banner';
        if (lowerInput.includes('banner')) adType = 'banner';
        else if (lowerInput.includes('popup') || lowerInput.includes('pop-up')) adType = 'popup';
        else if (lowerInput.includes('inline')) adType = 'inline';
        else if (lowerInput.includes('lateral') || lowerInput.includes('sidebar')) adType = 'sidebar';
        else if (lowerInput.includes('rodapé') || lowerInput.includes('rodape') || lowerInput.includes('footer')) adType = 'footer';

        setAdData(prev => ({ ...prev, ad_type: adType }));
        addMessage({
          id: Date.now().toString(),
          type: 'system',
          content: `✅ Tipo de anúncio definido como: ${adType}`,
          timestamp: new Date(),
        });
      }

      if (lowerInput.includes('criar') || lowerInput.includes('salvar') || lowerInput.includes('publicar')) {
        if (!adData.title || !adData.link_url) {
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            content: '⚠️ Título e URL de destino são obrigatórios. Por favor, defina-os antes de criar o anúncio.',
            timestamp: new Date(),
          });
        } else {
          await createAd();
        }
      }

      if (lowerInput.includes('testar') || lowerInput.includes('preview')) {
        if (!adData.title) {
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            content: '⚠️ Defina pelo menos um título antes de testar o anúncio.',
            timestamp: new Date(),
          });
        } else {
          setTestingAd(adData);
          addMessage({
            id: Date.now().toString(),
            type: 'preview',
            content: 'Anúncio em modo de teste. Veja a prévia abaixo.',
            timestamp: new Date(),
            metadata: adData,
          });
        }
      }

      if (lowerInput.includes('limpar') || lowerInput.includes('resetar') || lowerInput.includes('novo')) {
        setAdData({
          title: '',
          description: '',
          image_url: '',
          video_url: '',
          link_url: '',
          ad_type: 'banner',
          display_duration: 5,
          is_active: true,
        });
        setTestingAd(null);
        addMessage({
          id: Date.now().toString(),
          type: 'system',
          content: '🔄 Formulário limpo. Pronto para criar um novo anúncio!',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAd = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.from('ads').insert({
        title: adData.title,
        description: adData.description || null,
        image_url: adData.image_url || null,
        link_url: adData.link_url,
        ad_type: adData.ad_type,
        display_duration: adData.display_duration,
        is_active: adData.is_active,
        created_by: user?.id,
      });

      if (error) throw error;

      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `🎉 Anúncio "${adData.title}" criado com sucesso! Ele está ${adData.is_active ? 'ativo' : 'inativo'}.`,
        timestamp: new Date(),
      });

      // Limpar dados
      setAdData({
        title: '',
        description: '',
        image_url: '',
        video_url: '',
        link_url: '',
        ad_type: 'banner',
        display_duration: 5,
        is_active: true,
      });
      setTestingAd(null);

      toast.success('Anúncio criado com sucesso!');
    } catch (error: any) {
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `❌ Erro ao criar anúncio: ${error.message}`,
        timestamp: new Date(),
      });
      toast.error('Erro ao criar anúncio');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta funcionalidade.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Chat */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Gerenciador de Anúncios - Chat
            </CardTitle>
            <CardDescription>Crie anúncios de forma conversacional</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <ScrollArea className="flex-1 pr-4 border rounded-lg p-4 bg-muted/30">
              <div className="space-y-4" ref={scrollRef}>
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : msg.type === 'preview'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        {msg.metadata?.image_url && (
                          <img src={msg.metadata.image_url} alt="Preview" className="mt-2 max-w-xs rounded" />
                        )}
                        {msg.metadata?.video_url && (
                          <video src={msg.metadata.video_url} controls className="mt-2 max-w-xs rounded" />
                        )}
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp.toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite aqui... (ex: 'Título: Novo Curso', 'Link: https://...', 'Tipo: popup')"
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Foto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar Imagem</DialogTitle>
                    </DialogHeader>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'image');
                      }}
                      className="block w-full"
                    />
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <VideoIcon className="h-3.5 w-3.5" />
                      Vídeo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar Vídeo</DialogTitle>
                    </DialogHeader>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'video');
                      }}
                      className="block w-full"
                    />
                  </DialogContent>
                </Dialog>

                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInput(input + ' Testar')}>
                  <Eye className="h-3.5 w-3.5" />
                  Testar
                </Button>

                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInput(input + ' Criar')}>
                  <Check className="h-3.5 w-3.5" />
                  Criar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-base">Prévia do Anúncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Ad Data */}
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-semibold text-xs text-muted-foreground">TÍTULO</label>
                <p className="text-sm font-medium">{adData.title || '(não definido)'}</p>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground">DESCRIÇÃO</label>
                <p className="text-sm">{adData.description || '(não definida)'}</p>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground">TIPO</label>
                <Badge variant="secondary" className="mt-1">
                  {adData.ad_type}
                </Badge>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground">DURAÇÃO</label>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {adData.display_duration}s
                </p>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground">LINK</label>
                <p className="text-sm truncate text-blue-600">{adData.link_url || '(não definido)'}</p>
              </div>

              {adData.image_url && (
                <div>
                  <label className="font-semibold text-xs text-muted-foreground">IMAGEM</label>
                  <img src={adData.image_url} alt="Preview" className="w-full rounded mt-2 max-h-32 object-cover" />
                </div>
              )}

              {adData.video_url && (
                <div>
                  <label className="font-semibold text-xs text-muted-foreground">VÍDEO</label>
                  <video src={adData.video_url} controls className="w-full rounded mt-2 max-h-32" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                className="w-full gap-2"
                onClick={createAd}
                disabled={!adData.title || !adData.link_url || loading}
              >
                <Check className="h-4 w-4" />
                Criar Anúncio
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setInput('Limpar')}
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

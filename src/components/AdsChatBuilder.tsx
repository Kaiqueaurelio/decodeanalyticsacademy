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
    ad_type?: 'banner' | 'popup' | 'inline';
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
  ad_type: 'banner' | 'popup' | 'inline';
  display_duration: number;
  is_active: boolean;
}

export function AdsChatBuilder() {
  const { user } = useAuth();
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
    setMessages([
      {
        id: '1',
        type: 'system',
        content: 'Olá! 👋 Bem-vindo ao Gerenciador de Anúncios com Chat. Você pode criar anúncios de forma conversacional. Diga-me o que deseja criar!',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

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
        created_by: user?.id
      });

      if (error) throw error;

      toast.success('Anúncio criado com sucesso!');
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: '🎉 Parabéns! O anúncio foi criado e já está ativo no sistema.',
        timestamp: new Date(),
      });
    } catch (error: any) {
      toast.error(`Erro ao criar anúncio: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const lowerInput = currentInput.toLowerCase();

      if (lowerInput.includes('título') || lowerInput.includes('nome')) {
        const titleMatch = currentInput.match(/(?:título|nome)[:\s]+(.+?)(?:\.|$)/i);
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
        const descMatch = currentInput.match(/(?:descrição|descricao)[:\s]+(.+?)(?:\.|$)/i);
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
        const urlMatch = currentInput.match(/(?:link|url)[:\s]+(https?:\/\/[^\s]+)/i);
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
        const durationMatch = currentInput.match(/(\d+)\s*(?:segundo|seg|s)/i);
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Chat Area */}
      <Card className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Ads Chat Builder</CardTitle>
              <CardDescription>Crie anúncios conversando com a IA</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground border'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.metadata?.image_url && (
                        <img src={msg.metadata.image_url} alt="Uploaded" className="mt-2 rounded-lg max-h-40 w-full object-cover" />
                      )}
                      {msg.metadata?.video_url && (
                        <video src={msg.metadata.video_url} controls className="mt-2 rounded-lg max-h-40 w-full" />
                      )}
                      <span className="text-[10px] opacity-50 mt-1 block">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background/80">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 shrink-0"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, 'image');
                  };
                  input.click();
                }}
              >
                <ImageIcon className="h-4 w-4" /> Foto
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 shrink-0"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, 'video');
                  };
                  input.click();
                }}
              >
                <VideoIcon className="h-4 w-4" /> Vídeo
              </Button>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setInput('Tipo: Popup')}>
                <Zap className="h-4 w-4" /> Popup
              </Button>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setInput('Link: https://')}>
                <LinkIcon className="h-4 w-4" /> Link
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ex: Título: Promoção de Maio. Link: https://decode.com"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Area */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <Card className="bg-background/50 backdrop-blur border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> PRÉVIA DO ANÚNCIO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Título</label>
                <p className="text-sm font-medium leading-tight mt-1">{adData.title || '(aguardando título...)'}</p>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Posição</label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {adData.ad_type}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Duração</label>
                <p className="text-sm flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {adData.display_duration}s
                </p>
              </div>

              <div>
                <label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Link de Destino</label>
                <p className="text-sm truncate text-blue-500 mt-1">{adData.link_url || '(não definido)'}</p>
              </div>

              {(adData.image_url || adData.video_url) && (
                <div>
                  <label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Mídia</label>
                  <div className="mt-2 rounded-lg overflow-hidden border bg-muted/30">
                    {adData.image_url && (
                      <img src={adData.image_url} alt="Preview" className="w-full h-32 object-cover" />
                    )}
                    {adData.video_url && (
                      <video src={adData.video_url} className="w-full h-32 object-cover" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button
                className="w-full gap-2 shadow-lg shadow-primary/20"
                onClick={createAd}
                disabled={!adData.title || !adData.link_url || loading}
              >
                <Check className="h-4 w-4" /> Criar Anúncio
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setInput('Limpar')}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Resetar Formulário
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4">
            <h4 className="text-xs font-bold mb-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> DICAS DE COMANDOS
            </h4>
            <ul className="text-[11px] space-y-1 text-muted-foreground">
              <li>• "Título: Oferta Especial"</li>
              <li>• "Link: https://site.com"</li>
              <li>• "Duração: 10 segundos"</li>
              <li>• "Tipo: Popup" ou "Banner"</li>
              <li>• "Criar" para finalizar</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Link as LinkIcon, Clock, Zap, Image as ImageIcon, Video as VideoIcon,
  X, Check, AlertCircle, Trash2, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'preview';
  content: string;
  timestamp: Date;
  metadata?: {
    title?: string;
    image_url?: string;
    video_url?: string;
    link_url?: string;
    ad_type?: 'banner' | 'popup' | 'inline';
    display_duration?: number;
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

    if (lowerInput.includes('tipo') || lowerInput.includes('posição')) {
      let adType: AdData['ad_type'] = 'banner';
      if (lowerInput.includes('banner')) adType = 'banner';
      else if (lowerInput.includes('popup')) adType = 'popup';
      else if (lowerInput.includes('inline')) adType = 'inline';

      setAdData(prev => ({ ...prev, ad_type: adType }));
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `✅ Tipo de anúncio definido como: ${adType}`,
        timestamp: new Date(),
      });
    }

    if (lowerInput.includes('criar') || lowerInput.includes('salvar')) {
      if (!adData.title || !adData.link_url) {
        addMessage({
          id: Date.now().toString(),
          type: 'system',
          content: '⚠️ Título e URL de destino são obrigatórios.',
          timestamp: new Date(),
        });
      } else {
        await createAd();
      }
    }

    if (lowerInput.includes('limpar') || lowerInput.includes('resetar')) {
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
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: '🔄 Formulário limpo.',
        timestamp: new Date(),
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Ads Chat Builder</CardTitle>
          <CardDescription>Crie anúncios conversando</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.metadata?.image_url && (
                      <img src={msg.metadata.image_url} alt="Uploaded" className="mt-2 rounded max-h-40" />
                    )}
                    {msg.metadata?.video_url && (
                      <video src={msg.metadata.video_url} controls className="mt-2 rounded max-h-40" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
                i.onchange = (e) => { const f = (e.target as any).files?.[0]; if (f) handleFileUpload(f, 'image'); };
                i.click();
              }}>
                <ImageIcon className="h-4 w-4 mr-1" /> Foto
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const i = document.createElement('input'); i.type = 'file'; i.accept = 'video/*';
                i.onchange = (e) => { const f = (e.target as any).files?.[0]; if (f) handleFileUpload(f, 'video'); };
                i.click();
              }}>
                <VideoIcon className="h-4 w-4 mr-1" /> Vídeo
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full lg:w-80 h-full overflow-y-auto">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> PRÉVIA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Título</label>
            <p className="text-sm">{adData.title || '(vazio)'}</p>
            
            <label className="text-xs font-bold text-muted-foreground uppercase">Tipo</label>
            <div><Badge>{adData.ad_type}</Badge></div>

            <label className="text-xs font-bold text-muted-foreground uppercase">Link</label>
            <p className="text-xs truncate text-blue-500">{adData.link_url || '(vazio)'}</p>

            {adData.image_url && (
              <img src={adData.image_url} alt="Preview" className="w-full rounded border" />
            )}
          </div>

          <Button className="w-full" onClick={createAd} disabled={!adData.title || !adData.link_url || loading}>
            <Check className="h-4 w-4 mr-2" /> Criar Anúncio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

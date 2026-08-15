import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Upload, MessageCircle, RefreshCw, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getEllaAvatarUrl, DEFAULT_ELLA_AVATAR, ELLA_AVATAR_STORAGE_KEY } from '@/lib/ellaAvatar';

export function EllaSettings() {
  const { user } = useAuth();
  const [currentAvatar, setCurrentAvatar] = useState(getEllaAvatarUrl());
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sincroniza o estado local se o avatar mudar globalmente
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAvatar(getEllaAvatarUrl());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    // Usamos um nome fixo com cache-busting para facilitar o controle
    const fileName = `ella-avatar-custom.${ext}`;

    try {
      // Faz upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
          cacheControl: '0' // Sem cache no storage para forçar atualização
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // Adiciona cache-busting agressivo na URL salva
      const finalUrl = `${publicUrl}?v=${Date.now()}`;
      
      localStorage.setItem(ELLA_AVATAR_STORAGE_KEY, finalUrl);
      setCurrentAvatar(finalUrl);
      
      // Notifica o sistema de que o avatar mudou
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--ella-avatar-url', `url('${finalUrl}')`);
      }

      toast.success('Avatar da Ella atualizado com sucesso!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error('Erro ao atualizar avatar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setUploading(false);
    }
  };

  const resetToDefault = () => {
    localStorage.removeItem(ELLA_AVATAR_STORAGE_KEY);
    const defaultUrl = DEFAULT_ELLA_AVATAR;
    setCurrentAvatar(defaultUrl);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--ella-avatar-url', `url('${defaultUrl}')`);
    }
    toast.success('Avatar resetado para o padrão do sistema');
  };

  const forceRefresh = () => {
    setRefreshing(true);
    // Atualiza a URL com um novo timestamp
    const base = currentAvatar.split('?')[0];
    const newUrl = `${base}?v=${Date.now()}`;
    localStorage.setItem(ELLA_AVATAR_STORAGE_KEY, newUrl);
    setCurrentAvatar(newUrl);
    
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--ella-avatar-url', `url('${newUrl}')`);
    }
    
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Cache do avatar renovado!');
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Identidade da Ella</CardTitle>
              <CardDescription>Gerencie a aparência visual da sua assistente virtual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-3xl bg-background/30 border border-border/50">
            <div className="relative">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-primary/20 shadow-2xl overflow-hidden">
                <AvatarImage src={currentAvatar} alt="Ella Avatar" className="object-cover" />
                <AvatarFallback className="bg-muted">
                  <MessageCircle className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                <Check className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h4 className="text-lg font-bold">Avatar Oficial</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  Esta imagem é exibida no chat, na sidebar e em todas as interações da assistente.
                  Recomendamos imagens quadradas (1:1) com boa iluminação.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload} 
                    disabled={uploading} 
                  />
                  <Button disabled={uploading} className="gap-2 gradient-primary rounded-xl">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                </label>
                
                <Button 
                  variant="outline" 
                  onClick={forceRefresh} 
                  disabled={refreshing}
                  className="gap-2 rounded-xl border-primary/20 hover:bg-primary/5"
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  Forçar Atualização
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={resetToDefault}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Resetar Padrão
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-2xl border border-border/50 bg-muted/20 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status do Cache</h5>
              <p className="text-sm font-medium">Versão Ativa: <span className="font-mono text-primary">{currentAvatar.split('v=')[1] || 'Default'}</span></p>
              <p className="text-[10px] text-muted-foreground">O sistema usa cache-busting dinâmico para garantir que novos uploads apareçam instantaneamente para todos os administradores.</p>
            </div>
            
            <div className="p-4 rounded-2xl border border-border/50 bg-muted/20 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dica Técnica</h5>
              <p className="text-sm font-medium">Formato Recomendado: <span className="text-primary">PNG ou WEBP</span></p>
              <p className="text-[10px] text-muted-foreground">Para melhores resultados em telas Retina, utilize imagens de pelo menos 512x512 pixels.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

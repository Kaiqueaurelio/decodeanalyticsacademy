import React, { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Eye, MousePointerClick, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type AdType = 'banner' | 'popup' | 'inline' | 'sidebar' | 'footer';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  ad_type: AdType;
  is_active: boolean;
  display_duration: number;
  view_count: number;
  click_count: number;
}

export function AdminAdsManager() {
  const { user, isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    ad_type: 'banner' as AdType,
    display_duration: 5,
    is_active: true,
  });

  useEffect(() => {
    if (isAdmin) {
      loadAds();
    }
  }, [isAdmin]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      toast.error('Erro ao carregar anúncios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.link_url) {
      toast.error('Título e URL são obrigatórios');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('ads')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Anúncio atualizado!');
        setEditingId(null);
      } else {
        const { error } = await supabase.from('ads').insert({
          ...formData,
          created_by: user?.id,
        });

        if (error) throw error;
        toast.success('Anúncio criado!');
      }

      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        ad_type: 'banner',
        display_duration: 5,
        is_active: true,
      });

      loadAds();
    } catch (error) {
      console.error('Erro ao salvar anúncio:', error);
      toast.error('Erro ao salvar anúncio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este anúncio?')) return;

    try {
      const { error } = await supabase.from('ads').delete().eq('id', id);

      if (error) throw error;
      toast.success('Anúncio deletado!');
      loadAds();
    } catch (error) {
      console.error('Erro ao deletar anúncio:', error);
      toast.error('Erro ao deletar anúncio');
    }
  };

  const handleEdit = (ad: Ad) => {
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      link_url: ad.link_url,
      ad_type: ad.ad_type,
      display_duration: ad.display_duration,
      is_active: ad.is_active,
    });
    setEditingId(ad.id);
  };

  const toggleActive = async (ad: Ad) => {
    const { error } = await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id);
    if (error) {
      toast.error('Falha ao atualizar status');
      return;
    }
    toast.success(ad.is_active ? 'Anúncio pausado' : 'Anúncio ativado');
    loadAds();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciador de Anúncios</h2>
        <p className="text-muted-foreground">Crie e gerencie anúncios para sua plataforma</p>
      </div>

      {/* Formulário de Criação/Edição */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Anúncio' : 'Novo Anúncio'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do anúncio"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">URL de Destino *</label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://exemplo.com"
                  type="url"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Anúncio</label>
                <Select value={formData.ad_type} onValueChange={(value: any) => setFormData({ ...formData, ad_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner (Dashboard)</SelectItem>
                    <SelectItem value="inline">Inline (dentro da apostila)</SelectItem>
                    <SelectItem value="sidebar">Lateral (desktop)</SelectItem>
                    <SelectItem value="footer">Rodapé (mobile)</SelectItem>
                    <SelectItem value="popup">Pop-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Duração (segundos)</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.display_duration}
                  onChange={(e) => setFormData({ ...formData, display_duration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do anúncio"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">URL da Imagem</label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                type="url"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Plus size={16} />
                {editingId ? 'Atualizar' : 'Criar'} Anúncio
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: '',
                      description: '',
                      image_url: '',
                      link_url: '',
                      ad_type: 'banner',
                      display_duration: 5,
                      is_active: true,
                    });
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Anúncios */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Anúncios Existentes</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : ads.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum anúncio criado ainda</p>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad, idx) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{ad.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ad.ad_type === 'banner'
                              ? 'bg-blue-100 text-blue-700'
                              : ad.ad_type === 'popup'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {ad.ad_type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ad.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ad.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground mb-2">{ad.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye size={14} /> {ad.view_count} visualizações
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick size={14} /> {ad.click_count} cliques
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={ad.is_active ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => toggleActive(ad)}
                          className="gap-1.5"
                        >
                          {ad.is_active ? 'Pausar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(ad)}
                          className="gap-1.5"
                        >
                          <Edit2 size={14} />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(ad.id)}
                          className="gap-1.5"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Deletar</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

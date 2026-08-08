import React from 'react';
import { 
  Megaphone, 
  Trash2, 
  Plus, 
  Settings2, 
  Clock, 
  Eye, 
  MousePointer2, 
  Calendar 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminAdsManager } from '@/components/AdminAdsManager';

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
  ad_type: string;
  view_count: number;
  click_count: number;
  start_date: string | null;
  end_date: string | null;
}

interface AnnouncementsTabProps {
  filteredAds: Ad[];
  loadAll: () => void;
}

export function AnnouncementsTab({ filteredAds, loadAll }: AnnouncementsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">Anúncios e Banners</h2>
          <p className="text-[11px] text-muted-foreground">Gerencie a publicidade interna do aplicativo.</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{filteredAds.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {filteredAds.reduce((acc, ad) => acc + (ad.view_count || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {filteredAds.reduce((acc, ad) => acc + (ad.click_count || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Cliques</p>
          </CardContent>
        </Card>
      </div>

      <AdminAdsManager />

      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" /> Lista de Anúncios Ativos
        </h3>
        <div className="grid gap-3">
          {filteredAds.map(ad => (
            <Card key={ad.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="flex items-stretch min-h-[100px]">
                  {ad.image_url ? (
                    <div className="w-24 sm:w-32 bg-muted shrink-0 relative overflow-hidden">
                      <img 
                        src={ad.image_url} 
                        alt={ad.title} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 sm:w-32 bg-muted shrink-0 flex items-center justify-center">
                      <Megaphone className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium text-sm truncate max-w-[200px]">{ad.title}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                          {ad.ad_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {ad.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer2 className="h-3 w-3" /> {ad.click_count || 0}
                        </span>
                        {ad.end_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Expira {new Date(ad.end_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                        onClick={async () => {
                          if (!confirm('Excluir este anúncio?')) return;
                          const { error } = await supabase.from('ads').delete().eq('id', ad.id);
                          if (error) {
                            toast.error('Erro ao excluir: ' + error.message);
                            return;
                          }
                          toast.success('Anúncio removido');
                          loadAll();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredAds.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">Nenhum anúncio encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

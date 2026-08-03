
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Store, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAds } from '@/hooks/useAds';
import { AppImage } from '@/components/ui/app-image';

export function AdminSponsorsManager() {
  const { ads, loading } = useAds('sponsor');
  const [search, setSearch] = React.useState('');

  const filtered = ads.filter(ad => 
    ad.title.toLowerCase().includes(search.toLowerCase()) || 
    (ad.description?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Anunciantes</h2>
          <p className="text-muted-foreground text-sm">Controle as marcas externas que aparecem no Media Kit e página "Anuncie".</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar marcas..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((ad) => (
            <Card key={ad.id} className="overflow-hidden border-border/60 hover:border-primary/40 transition-colors">
              <div className="aspect-video bg-muted/30 relative flex items-center justify-center p-4">
                {ad.image_url ? (
                  <AppImage src={ad.image_url} alt={ad.title} className="max-h-full w-auto object-contain" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold truncate">{ad.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">Patrocinador</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {ad.description || 'Sem descrição.'}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1.5" asChild>
                    <a href={ad.link_url || '#'} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3" /> Ver Link
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
            <Store className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum anunciante encontrado.</p>
          </div>
        )}
      </div>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Como adicionar?</p>
            <p className="text-xs text-muted-foreground">Use o <b>Gerenciador de Anúncios</b> principal e selecione o tipo <b>"Anunciante Externo"</b>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

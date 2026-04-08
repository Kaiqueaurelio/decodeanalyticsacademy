import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContentCard } from "@/components/ContentCard";
import { ContentRow } from "@/components/ContentRow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const typeLabels: Record<string, string> = {
  pdf: "PDF", image: "Imagem", video: "Vídeo", audio: "Áudio",
  powerpoint: "PowerPoint", word: "Word", excel: "Excel", gif: "GIF",
  link: "Link", exam: "Simulado", other: "Outro",
};

export default function Biblioteca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tipoFilter = searchParams.get("tipo") || "";
  const categoriaFilter = searchParams.get("categoria") || "";
  const [searchQuery, setSearchQuery] = useState("");

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials", tipoFilter, categoriaFilter],
    queryFn: async () => {
      let query = supabase
        .from("materials")
        .select("*, categories(name, slug)")
        .order("created_at", { ascending: false });
      if (tipoFilter) query = query.eq("type", tipoFilter as any);
      const { data } = await query;
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const filtered = (materials || []).filter((m: any) =>
    !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const noFilters = !tipoFilter && !categoriaFilter && !searchQuery;
  const materialsByCategory = noFilters
    ? (categories || []).map((cat) => ({
        ...cat,
        materials: filtered.filter((m: any) => (m.categories as any)?.slug === cat.slug),
      })).filter((c) => c.materials.length > 0)
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="px-[3.5%] pt-6 sm:pt-8 space-y-5">
        <h1 className="text-2xl sm:text-4xl font-black text-foreground">Biblioteca</h1>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted border-0 h-10 rounded-sm text-sm"
            />
          </div>

          <Select
            value={tipoFilter || "all"}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v === "all") params.delete("tipo"); else params.set("tipo", v);
              setSearchParams(params);
            }}
          >
            <SelectTrigger className="w-[130px] sm:w-[150px] h-10 rounded-sm bg-muted border-0 text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoriaFilter || "all"}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v === "all") params.delete("categoria"); else params.set("categoria", v);
              setSearchParams(params);
            }}
          >
            <SelectTrigger className="w-[130px] sm:w-[150px] h-10 rounded-sm bg-muted border-0 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-24 text-muted-foreground text-sm">Carregando materiais...</div>
      ) : noFilters && materialsByCategory.length > 0 ? (
        <div className="space-y-2 sm:space-y-4">
          {filtered.filter((m: any) => !(m.categories as any)?.slug).length > 0 && (
            <ContentRow
              title="Sem Categoria"
              materials={filtered.filter((m: any) => !(m.categories as any)?.slug)}
            />
          )}
          {materialsByCategory.map((cat) => (
            <ContentRow key={cat.id} title={cat.name} materials={cat.materials} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="px-[3.5%] pb-8">
          <div className="flex flex-wrap gap-1 sm:gap-[4px]">
            {filtered.map((mat: any) => (
              <ContentCard
                key={mat.id}
                id={mat.id}
                title={mat.title}
                type={mat.type}
                description={mat.description}
                categoryName={(mat.categories as any)?.name}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-24">
          <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum material encontrado</h3>
          <p className="text-muted-foreground text-sm">Tente alterar os filtros de busca.</p>
        </div>
      )}
    </div>
  );
}

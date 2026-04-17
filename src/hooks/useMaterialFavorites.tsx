import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook que carrega e gerencia os IDs de materiais favoritados pelo usuário.
 * Sincroniza com a tabela `material_favorites` (RLS por user_id).
 */
export function useMaterialFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setFavorites(new Set()); setLoading(false); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("material_favorites")
        .select("material_id")
        .eq("user_id", user.id);
      if (!active) return;
      setFavorites(new Set((data ?? []).map((d) => d.material_id)));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const isFavorite = useCallback(
    (materialId: string) => favorites.has(materialId),
    [favorites],
  );

  const toggle = useCallback(
    async (materialId: string): Promise<boolean> => {
      if (!user) return false;
      const currentlyFav = favorites.has(materialId);

      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (currentlyFav) next.delete(materialId);
        else next.add(materialId);
        return next;
      });

      if (currentlyFav) {
        const { error } = await supabase
          .from("material_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("material_id", materialId);
        if (error) {
          // rollback
          setFavorites((prev) => new Set(prev).add(materialId));
          return true;
        }
        return false;
      } else {
        const { error } = await supabase
          .from("material_favorites")
          .insert({ user_id: user.id, material_id: materialId });
        if (error) {
          setFavorites((prev) => {
            const next = new Set(prev);
            next.delete(materialId);
            return next;
          });
          return false;
        }
        return true;
      }
    },
    [favorites, user],
  );

  return { favorites, isFavorite, toggle, loading };
}

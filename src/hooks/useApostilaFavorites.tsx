import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook que carrega e gerencia os IDs de apostilas favoritadas pelo usuário.
 * Sincroniza com a tabela `apostila_favorites` (RLS por user_id).
 */
export function useApostilaFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setFavorites(new Set()); setLoading(false); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("apostila_favorites")
        .select("apostila_id")
        .eq("user_id", user.id);
      if (!active) return;
      setFavorites(new Set((data ?? []).map((d) => d.apostila_id)));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const isFavorite = useCallback(
    (apostilaId: string) => favorites.has(apostilaId),
    [favorites],
  );

  const toggle = useCallback(
    async (apostilaId: string): Promise<boolean> => {
      if (!user) return false;
      const currentlyFav = favorites.has(apostilaId);

      // Optimistic
      setFavorites((prev) => {
        const next = new Set(prev);
        if (currentlyFav) next.delete(apostilaId);
        else next.add(apostilaId);
        return next;
      });

      if (currentlyFav) {
        const { error } = await supabase
          .from("apostila_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("apostila_id", apostilaId);
        if (error) { setFavorites((prev) => new Set(prev).add(apostilaId)); return true; }
        return false;
      } else {
        const { error } = await supabase
          .from("apostila_favorites")
          .insert({ user_id: user.id, apostila_id: apostilaId });
        if (error) {
          setFavorites((prev) => { const n = new Set(prev); n.delete(apostilaId); return n; });
          return false;
        }
        return true;
      }
    },
    [favorites, user],
  );

  return { favorites, isFavorite, toggle, loading };
}

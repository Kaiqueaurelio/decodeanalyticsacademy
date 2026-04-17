import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useApostilaCompletions() {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCompletedIds(new Set()); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("apostila_completions")
        .select("apostila_id")
        .eq("user_id", user.id);
      if (!cancelled) {
        setCompletedIds(new Set((data ?? []).map((r) => r.apostila_id)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const isCompleted = useCallback(
    (apostilaId: string) => completedIds.has(apostilaId),
    [completedIds]
  );

  const toggle = useCallback(
    async (apostilaId: string) => {
      if (!user) { toast.error("Faça login para marcar como concluída"); return; }
      const has = completedIds.has(apostilaId);
      // Optimistic
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(apostilaId); else next.add(apostilaId);
        return next;
      });
      if (has) {
        const { error } = await supabase
          .from("apostila_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("apostila_id", apostilaId);
        if (error) {
          setCompletedIds((prev) => new Set(prev).add(apostilaId));
          toast.error("Não foi possível desmarcar");
        } else {
          toast.success("Conclusão removida");
        }
      } else {
        const { error } = await supabase
          .from("apostila_completions")
          .insert({ user_id: user.id, apostila_id: apostilaId });
        if (error) {
          setCompletedIds((prev) => { const n = new Set(prev); n.delete(apostilaId); return n; });
          toast.error("Não foi possível marcar");
        } else {
          toast.success("Apostila concluída! 🎉");
        }
      }
    },
    [user, completedIds]
  );

  return { isCompleted, toggle, loading, completedIds };
}

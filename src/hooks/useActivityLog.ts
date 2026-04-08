import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async (
    action: "view" | "download" | "screenshot" | "login" | "logout" | "unauthorized_access",
    materialId?: string
  ) => {
    if (!user) return;

    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action,
        material_id: materialId || null,
      });
    } catch (e) {
      console.error("Erro ao registrar atividade:", e);
    }
  };

  return { logActivity };
}

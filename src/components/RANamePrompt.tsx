import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle2 } from "lucide-react";

const DISMISS_KEY = "ra_name_prompt_dismissed_v1";

export function RANamePrompt() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, account_type, full_name, ra")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled || error || !data) return;

      const isRA =
        (data as any).account_type === "ra" ||
        (user.email || "").endsWith("@ra.unip.local");
      const name = ((data as any).full_name || "").trim();
      // Considera "sem nome real" se vazio ou ainda no padrão "Aluno UNIP {RA}"
      const looksDefault =
        !name ||
        /^aluno\s+unip\b/i.test(name) ||
        name.toLowerCase().includes("[teste bot]");

      if (isRA && looksDefault) {
        setProfileId((data as any).id);
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (trimmed.length < 3) {
      toast.error("Digite seu nome completo (mínimo 3 caracteres).");
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    toast.success("Nome atualizado! Bons estudos 🦉");
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const handleLater = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    toast("Tudo bem, você pode editar depois no seu Perfil.", {
      description: "Acesse Perfil → Editar nome.",
    });
  };

  // Se já dispensou nesta sessão, não reabrir
  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleLater()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCircle2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Complete seu perfil</DialogTitle>
          <DialogDescription className="text-center">
            Você entrou com seu RA UNIP. Para personalizar sua experiência e
            aparecer corretamente na comunidade e no ranking, por favor informe
            seu <strong>nome completo</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="ra-fullname">Nome completo</Label>
          <Input
            id="ra-fullname"
            placeholder="Ex.: Maria Silva Santos"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
            disabled={saving}
          />
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleLater}
            disabled={saving}
            className="sm:flex-1"
          >
            Lembrar depois
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || fullName.trim().length < 3}
            className="sm:flex-1"
          >
            {saving ? "Salvando..." : "Salvar nome"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserCircle2 } from "lucide-react";

const DISMISS_KEY = "ra_name_prompt_dismissed_v1";

const COURSES = [
  { value: "CC", label: "Ciência da Computação (CC)" },
  { value: "SI", label: "Sistemas de Informação (SI)" },
  { value: "EC", label: "Engenharia da Computação (EC)" },
];

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);

export function RANamePrompt() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [course, setCourse] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_type, full_name, email, course, semester")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled || error || !data) return;

      const isRA =
        (data as any).account_type === "ra" ||
        (user.email || "").endsWith("@ra.unip.local");
      
      const name = ((data as any).full_name || "").trim();
      const looksDefaultName =
        !name ||
        /^aluno\s+unip\b/i.test(name) ||
        name.toLowerCase().includes("[teste bot]") ||
        name.toLowerCase() === "novo aluno" ||
        name.length < 3;
        
      const missingCourse = !(data as any).course;
      const missingSemester = !(data as any).semester;
      const savedEmail = ((data as any).email || "").trim();
      
      // Para usuários RA, o e-mail @ra.unip.local é considerado "ausente" (precisamos do real)
      const missingContactEmail = !savedEmail || savedEmail.endsWith("@ra.unip.local");

      // O prompt agora é para TODOS os alunos sem nome, não apenas RA.
      // RA apenas tem a verificação de e-mail extra.
      if (looksDefaultName || (isRA && missingContactEmail) || missingCourse || missingSemester) {
        if (!looksDefaultName) setFullName(name);
        if (!missingContactEmail) setContactEmail(savedEmail);
        if ((data as any).course) setCourse((data as any).course);
        if ((data as any).semester)
          setSemester(String((data as any).semester));
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const nameValid = fullName.trim().length >= 3 && fullName.trim().length <= 100;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) && !contactEmail.trim().endsWith('@ra.unip.local');
  const courseValid = COURSES.some((c) => c.value === course);
  const semNum = parseInt(semester, 10);
  const semesterValid = !isNaN(semNum) && semNum >= 1 && semNum <= 12;
  const canSave = nameValid && emailValid && courseValid && semesterValid && !saving;

  const handleSave = async () => {
    if (!user) return;
    if (!nameValid) {
      toast.error("Digite seu nome completo (3 a 100 caracteres).");
      return;
    }
    if (!emailValid) {
      toast.error("Digite um e-mail de contato válido.");
      return;
    }
    if (!courseValid) {
      toast.error("Selecione seu curso.");
      return;
    }
    if (!semesterValid) {
      toast.error("Selecione o semestre atual.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        email: contactEmail.trim().toLowerCase(),
        course,
        semester: semNum,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    toast.success("Perfil completo! Bons estudos.");
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const handleLater = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    toast("Tudo bem, você pode editar depois no seu Perfil.", {
      description: "Acesse Perfil → Editar dados.",
    });
  };

  return (
    <>
      <button data-ra-prompt-trigger className="hidden" onClick={() => setOpen(true)} aria-hidden="true" />
      <Dialog open={open} onOpenChange={(v) => !v && handleLater()}>
      <DialogContent
        className="sm:max-w-md top-4 translate-y-0 sm:top-8 data-[state=open]:slide-in-from-top-2"
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCircle2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Complete seu perfil</DialogTitle>
          <DialogDescription className="text-center">
            Você entrou com seu RA UNIP. Para personalizar a experiência e
            aparecer corretamente na comunidade e no ranking, informe seu
            <strong> nome completo</strong>, <strong>e-mail de contato</strong>,
            <strong> curso</strong> e <strong>semestre atual</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ra-fullname">Nome completo</Label>
            <Input
              id="ra-fullname"
              placeholder="Ex.: Maria Silva Santos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              autoFocus
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ra-contact-email">E-mail de contato</Label>
            <Input
              id="ra-contact-email"
              type="email"
              placeholder="voce@exemplo.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              maxLength={254}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">Usado para contato; o acesso continua sendo pelo RA.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ra-course">Curso</Label>
            <Select value={course} onValueChange={setCourse} disabled={saving}>
              <SelectTrigger id="ra-course">
                <SelectValue placeholder="Selecione seu curso" />
              </SelectTrigger>
              <SelectContent>
                {COURSES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ra-semester">Semestre atual</Label>
            <Select
              value={semester}
              onValueChange={setSemester}
              disabled={saving}
            >
              <SelectTrigger id="ra-semester">
                <SelectValue placeholder="Selecione o semestre" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}º semestre
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            disabled={!canSave}
            className="sm:flex-1"
          >
            {saving ? "Salvando..." : "Salvar perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

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
import { useQueryClient } from "@tanstack/react-query";

const COURSES = [
  { value: "CC", label: "Ciência da Computação (CC)" },
  { value: "SI", label: "Sistemas de Informação (SI)" },
  { value: "EC", label: "Engenharia da Computação (EC)" },
];

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);

function getAuthErrorCode(error: unknown) {
  const value = error as { code?: unknown; status?: unknown; message?: unknown } | null;
  return String(value?.code ?? value?.status ?? "").toLowerCase();
}

function getAuthErrorMessage(error: unknown) {
  const value = error as { message?: unknown } | null;
  return String(value?.message ?? "");
}

function isSessionError(error: unknown) {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error).toLowerCase();
  return code.includes("session")
    || code.includes("token")
    || code === "401"
    || message.includes("jwt")
    || message.includes("session")
    || message.includes("token")
    || message.includes("not authenticated");
}

function isEmailAlreadyRegisteredError(error: unknown) {
  const message = getAuthErrorMessage(error).toLowerCase();
  const code = getAuthErrorCode(error);
  return code.includes("email_exists")
    || code.includes("user_already_exists")
    || message.includes("email already registered")
    || message.includes("already registered")
    || message.includes("already exists")
    || message.includes("user already registered")
    || message.includes("email address is already registered");
}

function isTransientAuthError(error: unknown) {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error).toLowerCase();
  return ["429", "500", "502", "503", "504", "fetch_error", "network_error"].some((value) => code.includes(value))
    || message.includes("network")
    || message.includes("fetch")
    || message.includes("timeout")
    || message.includes("temporarily unavailable")
    || message.includes("connection reset");
}

export function RANamePrompt() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isRAAccount, setIsRAAccount] = useState(false);
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [course, setCourse] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

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
      setIsRAAccount(isRA);
      
      const name = ((data as any).full_name || "").trim();
      const looksDefaultName =
        !name ||
        /^aluno\s+unip\b/i.test(name) ||
        name.toLowerCase().includes("[teste bot]") ||
        name.toLowerCase() === "novo aluno" ||
        name.length < 3;
        
      const savedEmail = ((data as any).email || "").trim();
      const authStillUsesSyntheticEmail = (user.email || "").endsWith("@ra.unip.local");
      const missingContactEmail = !savedEmail || savedEmail.endsWith("@ra.unip.local") || authStillUsesSyntheticEmail;

      if (looksDefaultName || (isRA && missingContactEmail)) {
        if (!looksDefaultName) setFullName(name);
        if (savedEmail && !savedEmail.endsWith("@ra.unip.local")) setContactEmail(savedEmail);
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

  const normalizedName = fullName.trim().replace(/\s+/g, " ");
  const nameValid = normalizedName.length >= 5
    && normalizedName.length <= 100
    && normalizedName.split(" ").length >= 2
    && /^[\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*)+$/u.test(normalizedName);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) && !contactEmail.trim().endsWith('@ra.unip.local');
  const courseValid = COURSES.some((c) => c.value === course);
  const semNum = parseInt(semester, 10);
  const semesterValid = !isNaN(semNum) && semNum >= 1 && semNum <= 12;
  const canSave = nameValid && (!isRAAccount || emailValid) && !saving;

  const handleSave = async () => {
    if (!user) return;
    if (!nameValid) {
      toast.error("Digite seu nome e sobrenome usando apenas letras.");
      return;
    }
    if (isRAAccount && !emailValid) {
      toast.error("Digite um e-mail pessoal válido para recuperação.");
      return;
    }

    setSaving(true);
    const recoveryEmail = contactEmail.trim().toLowerCase();
    const currentAuthEmail = (user.email || "").trim().toLowerCase();
    const updates: Record<string, unknown> = {
      full_name: normalizedName,
    };
    if (isRAAccount) updates.email = recoveryEmail;
    if (courseValid) updates.course = course;
    if (semesterValid) updates.semester = semNum;
    const { error } = await supabase
      .from("profiles")
      .update(updates as any)
      .eq("user_id", user.id);

    if (error) {
      console.error("RANamePrompt: profile update failed", {
        code: error.code,
        status: (error as any).status,
        message: error.message,
      });
      setSaving(false);
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }

    if (isRAAccount) {
      // If Auth already has this exact address, the profile was simply catching up.
      // Do not issue a redundant Auth mutation or report a false failure.
      if (currentAuthEmail === recoveryEmail) {
        const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();
        const confirmed = !currentUserError
          && !((currentUserData.user?.email || "").endsWith("@ra.unip.local"))
          && Boolean(currentUserData.user?.email_confirmed_at);
        if (confirmed) {
          toast.success("E-mail de recuperação já está vinculado e verificado.");
          await queryClient.invalidateQueries({ queryKey: ["profile", "lite", user.id] });
          setSaving(false);
          setOpen(false);
          return;
        }
      }

      // Refresh once before changing Auth data. This also repairs an expired access
      // token without changing the RA/password login flow.
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("RANamePrompt: recovery email session refresh failed", {
          code: refreshError.code,
          status: (refreshError as any).status,
          message: refreshError.message,
        });
      }

      let { data: authUpdate, error: authEmailError } = await supabase.auth.updateUser({ email: recoveryEmail });

      // A stale session can make the first Auth mutation fail even though the
      // profile write succeeded. Refresh and retry once, never silently twice.
      if (authEmailError && isSessionError(authEmailError)) {
        const { error: retryRefreshError } = await supabase.auth.refreshSession();
        if (!retryRefreshError) {
          ({ data: authUpdate, error: authEmailError } = await supabase.auth.updateUser({ email: recoveryEmail }));
        }
      }

      if (authEmailError) {
        console.error("RANamePrompt: recovery email update failed", {
          code: getAuthErrorCode(authEmailError),
          status: (authEmailError as any).status,
          message: getAuthErrorMessage(authEmailError),
          transient: isTransientAuthError(authEmailError),
          duplicate: isEmailAlreadyRegisteredError(authEmailError),
        });
        setSaving(false);

        if (isEmailAlreadyRegisteredError(authEmailError)) {
          toast.error("Este e-mail já está vinculado a outra conta.");
        } else if (isTransientAuthError(authEmailError)) {
          toast.error("O perfil foi salvo, mas o vínculo do e-mail está temporariamente indisponível. Tente novamente.");
        } else {
          toast.error("O perfil foi salvo, mas não foi possível concluir o vínculo do e-mail. Tente novamente.");
        }
        return;
      }

      const confirmedEmail = (authUpdate.user?.email || "").trim().toLowerCase();
      const pendingEmail = ((authUpdate.user as any)?.new_email || "").trim().toLowerCase();
      const confirmed = Boolean(authUpdate.user?.email_confirmed_at) && confirmedEmail === recoveryEmail;
      const alreadyLinked = confirmedEmail === recoveryEmail && !confirmedEmail.endsWith("@ra.unip.local");

      await queryClient.invalidateQueries({ queryKey: ["profile", "lite", user.id] });
      setSaving(false);

      if (confirmed || alreadyLinked) {
        toast.success("E-mail de recuperação já está vinculado e verificado.");
        setOpen(false);
        return;
      }

      setVerificationSent(true);
      toast.success("Enviamos um link de confirmação para seu e-mail.");
      if (pendingEmail && pendingEmail !== recoveryEmail) {
        console.error("RANamePrompt: Auth returned a different pending email", {
          requested: recoveryEmail,
          pending: pendingEmail,
        });
      }
      return;
    }

    toast.success("Perfil atualizado. Bons estudos!");
    await queryClient.invalidateQueries({ queryKey: ["profile", "lite", user.id] });
    setSaving(false);
    setOpen(false);
  };

  const checkEmailVerification = async () => {
    setSaving(true);
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error("RANamePrompt: verification refresh failed", {
        code: refreshError.code,
        status: (refreshError as any).status,
        message: refreshError.message,
      });
    }
    const { data, error } = await supabase.auth.getUser();
    const confirmedEmail = data.user?.email || "";
    const verified = !error && !confirmedEmail.endsWith("@ra.unip.local") && Boolean(data.user?.email_confirmed_at);
    setSaving(false);
    if (error || !verified) {
      toast.error("O e-mail ainda não foi confirmado. Clique no link recebido e tente novamente.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", "lite", user?.id] });
    toast.success("E-mail confirmado. Sua conta agora pode ser recuperada com segurança.");
    setOpen(false);
  };

  return (
    <>
      <button data-ra-prompt-trigger className="hidden" onClick={() => setOpen(true)} aria-hidden="true" />
      <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCircle2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Complete seu perfil</DialogTitle>
          <DialogDescription className="text-center">
            Para continuar, informe seu <strong>nome e sobrenome</strong>
            {isRAAccount ? <> e um <strong>e-mail pessoal válido</strong> para recuperar sua conta caso perca a senha</> : null}.
            Curso e semestre são opcionais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {verificationSent && (
            <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
              <p className="font-semibold">Confirme seu e-mail para continuar</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Enviamos um link para <strong>{contactEmail.trim().toLowerCase()}</strong>. Verifique também a caixa de spam.
              </p>
            </div>
          )}
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
            <p className="text-xs text-muted-foreground">Informe pelo menos nome e sobrenome, usando apenas letras.</p>
          </div>

          {isRAAccount && <div className="space-y-1.5">
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
            <p className="text-xs text-muted-foreground">Você continuará entrando com o RA. Enviaremos uma confirmação para ativar a recuperação por e-mail.</p>
          </div>}

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
            onClick={verificationSent ? checkEmailVerification : handleSave}
            disabled={verificationSent ? saving : !canSave}
            className="w-full"
          >
            {saving ? "Verificando..." : verificationSent ? "Já confirmei meu e-mail" : "Salvar e verificar dados"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';

/**
 * Bloqueia a interface até que o aluno com `must_change_password=true`
 * defina uma nova senha. Cobre estados de loading/erro/sucesso e valida
 * a entrada no cliente (mínimo 8, máximo 72, com dígito e letra).
 */
export function ForcePasswordChangeGate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useUserProfile(user?.id);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user || isLoading || !profile?.must_change_password) return null;

  const validate = (): string | null => {
    if (!pw1 || !pw2) return 'Preencha os dois campos.';
    if (pw1 !== pw2) return 'As senhas não coincidem.';
    if (pw1.length < 8) return 'Use pelo menos 8 caracteres.';
    if (pw1.length > 72) return 'Máximo de 72 caracteres.';
    if (!/[A-Za-z]/.test(pw1) || !/\d/.test(pw1)) return 'Inclua letras e números.';
    if (pw1 === 'Vivi@2026') return 'Escolha uma senha diferente da inicial.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const { error: authErr } = await supabase.auth.updateUser({ password: pw1 });
      if (authErr) throw authErr;
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ must_change_password: false } as any)
        .eq('user_id', user.id);
      if (profErr) throw profErr;
      toast.success('Senha atualizada com sucesso.');
      setPw1(''); setPw2('');
      await qc.invalidateQueries({ queryKey: ['profile', 'lite', user.id] });
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível atualizar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 w-fit">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Defina sua nova senha</DialogTitle>
          <DialogDescription className="text-center">
            Por segurança, altere a senha inicial antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw1">Nova senha</Label>
            <Input
              id="pw1" type="password" autoComplete="new-password"
              value={pw1} onChange={(e) => setPw1(e.target.value)}
              disabled={saving} minLength={8} maxLength={72} required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirme a nova senha</Label>
            <Input
              id="pw2" type="password" autoComplete="new-password"
              value={pw2} onChange={(e) => setPw2(e.target.value)}
              disabled={saving} minLength={8} maxLength={72} required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres, com letras e números.
          </p>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando…</> : 'Salvar nova senha'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

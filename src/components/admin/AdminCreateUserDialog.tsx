import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onCreated?: () => void;
}

const randomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Cadastro manual de alunos pelo administrador.
 * Aceita RA (cria conta interna @ra.unip.local) ou e-mail real.
 * A conta já nasce liberada — sem verificação de e-mail.
 */
export function AdminCreateUserDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState(randomPassword());
  const [enemOnly, setEnemOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setIdentifier('');
    setFullName('');
    setPassword(randomPassword());
    setEnemOnly(false);
  };

  const handleCreate = async () => {
    if (!identifier.trim()) { toast.error('Informe o RA ou e-mail do aluno.'); return; }
    if (password.length < 6) { toast.error('A senha precisa ter ao menos 6 caracteres.'); return; }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        identifier: identifier.trim(),
        password,
        full_name: fullName.trim(),
        content_scope: enemOnly ? 'enem_only' : 'full',
      },
    });
    setSaving(false);

    const errMsg = (data as any)?.error;
    if (error || errMsg) {
      let message = errMsg || 'Não foi possível criar a conta.';
      const res = (error as any)?.context as Response | undefined;
      if (!errMsg && res?.json) {
        try { const b = await res.clone().json(); if (b?.error) message = b.error; } catch { /* noop */ }
      }
      toast.error(message);
      return;
    }

    toast.success('Aluno cadastrado e liberado para acessar.', {
      description: `Senha inicial: ${password}`,
      duration: 10000,
    });
    reset();
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 gradient-primary text-primary-foreground">
          <UserPlus className="h-4 w-4" /> Cadastrar aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" /> Cadastrar novo aluno
          </DialogTitle>
          <DialogDescription className="text-xs">
            A conta é criada já liberada, sem necessidade de confirmar e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label className="text-xs">RA ou e-mail</Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: N1234567 ou aluno@email.com"
              className="mt-1.5"
              autoComplete="off"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Com RA, o aluno entra usando o próprio RA e a senha abaixo.
            </p>
          </div>

          <div>
            <Label className="text-xs">Nome completo (opcional)</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-xs">Senha inicial</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
              <Button type="button" variant="outline" size="icon" onClick={() => setPassword(randomPassword())} title="Gerar nova senha">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-xs font-medium">Acesso apenas ao ENEM</p>
              <p className="text-[10px] text-muted-foreground">Restringe o conteúdo visível ao aluno.</p>
            </div>
            <Switch checked={enemOnly} onCheckedChange={setEnemOnly} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Criando...</> : 'Criar conta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

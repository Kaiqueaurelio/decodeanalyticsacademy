import React, { useState } from 'react';
import { 
  ShieldBan, 
  ShieldCheck, 
  Trash2, 
  Key, 
  ChevronDown,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { AdminCreateUserDialog } from '@/components/admin/AdminCreateUserDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_blocked: boolean;
  created_at: string;
  account_type?: string;
  content_scope?: string;
}

interface UsersTabProps {
  users: User[];
  filteredUsers: User[];
  loadAll: () => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  searchQuery?: string;
}

function AdminPasswordResetMenu({ user }: { user: User }) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setResetting(false);
    if (error) {
      toast.error('Erro ao enviar reset: ' + error.message);
    } else {
      toast.success('E-mail de redefinição enviado para ' + user.email);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5" disabled={resetting}>
          <Key className="h-3.5 w-3.5" /> Senha <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Segurança da Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleReset} className="text-xs">
          Enviar link de redefinição por e-mail
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTab({ users, filteredUsers, loadAll, setUsers }: UsersTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">Alunos</h2>
          <p className="text-[11px] text-muted-foreground">Cadastre, bloqueie ou ajuste o acesso das contas.</p>
        </div>
        <AdminCreateUserDialog onCreated={loadAll} />
      </div>

      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--success))]">{users.filter(u => !u.is_blocked).length}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{users.filter(u => u.is_blocked).length}</p>
            <p className="text-xs text-muted-foreground">Bloqueados</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {filteredUsers.map(u => {
          const isTestBot = (u.full_name || '').toLowerCase().includes('[teste bot]') || (u.email || '').includes('teste.evasive');
          const isRA = u.account_type === 'ra' || (u.email || '').endsWith('@ra.unip.local');
          return (
            <Card key={u.id} className={`hover:shadow-md transition-shadow ${u.is_blocked ? 'border-destructive/30' : ''} ${isTestBot ? 'border-amber-500/40 bg-amber-500/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`rounded-full p-2.5 shrink-0 ${u.is_blocked ? 'bg-destructive/10' : isTestBot ? 'bg-amber-500/15' : 'bg-accent'}`}>
                      {u.is_blocked ? <ShieldBan className="h-5 w-5 text-destructive" /> : <ShieldCheck className={`h-5 w-5 ${isTestBot ? 'text-amber-500' : 'text-primary'}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <p className="text-sm font-medium break-words">{u.full_name || 'Sem nome'}</p>
                        {isTestBot && <Badge className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20">TESTE BOT</Badge>}
                        {u.is_blocked && <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>}
                        {isRA && <Badge variant="outline" className="text-[10px]">RA UNIP</Badge>}
                        {u.content_scope === 'enem_only' && (
                          <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">Apenas ENEM</Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 break-all leading-snug font-mono">{u.email}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 sm:ml-auto items-center justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-9 gap-1.5"
                      onClick={async () => {
                        const next = u.content_scope === 'enem_only' ? 'full' : 'enem_only';
                        const { error } = await supabase.from('profiles').update({ content_scope: next }).eq('user_id', u.user_id);
                        if (error) { toast.error('Erro ao atualizar escopo'); return; }
                        toast.success(next === 'enem_only' ? 'Acesso restrito a ENEM' : 'Acesso completo liberado');
                        loadAll();
                      }}
                    >
                      {u.content_scope === 'enem_only' ? 'Liberar tudo' : 'Restringir a ENEM'}
                    </Button>
                    <Button
                      size="sm"
                      variant={u.is_blocked ? 'outline' : 'destructive'}
                      className="text-xs h-9 gap-1.5"
                      onClick={async () => {
                        const newBlocked = !u.is_blocked;
                        const { error } = await supabase.from('profiles').update({ is_blocked: newBlocked }).eq('user_id', u.user_id);
                        if (error) { toast.error('Erro ao atualizar'); return; }
                        toast.success(newBlocked ? `${u.full_name} foi bloqueado` : `${u.full_name} foi desbloqueado`);
                        loadAll();
                      }}
                    >
                      {u.is_blocked ? <><ShieldCheck className="h-3.5 w-3.5" /> Desbloquear</> : <><ShieldBan className="h-3.5 w-3.5" /> Bloquear</>}
                    </Button>
                    <AdminPasswordResetMenu user={u} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="hidden sm:inline-flex text-xs h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover usuário permanentemente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é <strong>irreversível</strong>. Todos os dados de <strong>{u.full_name || u.email}</strong> serão excluídos permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                              const { error } = await supabase.rpc('delete_user_completely', { _target_user_id: u.user_id });
                              if (error) {
                                toast.error(`Erro ao remover: ${error.message}`);
                                return;
                              }
                              toast.success(`${u.full_name || u.email} foi removido permanentemente`);
                              setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
                            }}
                          >
                            Sim, remover permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum aluno encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

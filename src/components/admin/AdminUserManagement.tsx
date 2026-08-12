import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, ShieldAlert, User, Search, Loader2 } from 'lucide-react';

export function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, ra, is_blocked')
        .order('email');

      if (pError) throw pError;

      const { data: roles, error: rError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rError) throw rError;

      const combined = profiles.map(p => ({
        ...p,
        role: roles.find(r => r.user_id === p.user_id)?.role || 'user'
      }));

      setUsers(combined);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Deletar roles existentes
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Se for admin, inserir
      if (newRole === 'admin') {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }

      // Logar a ação
      await supabase.from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        action: `update_role_${newRole}`,
        target_user_id: userId,
        details: { newRole }
      });
      
      toast.success('Permissão atualizada com sucesso');
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao atualizar permissão: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.ra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="rounded-[2rem] border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Gestão de Usuários & Permissões
            </CardTitle>
            <CardDescription>Gerencie quem tem acesso administrativo ao sistema</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por e-mail, RA ou nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-background/50"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>RA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{u.full_name || 'Sem nome'}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">{u.ra || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.is_blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" /> Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className={u.role === 'admin' ? 'bg-primary' : ''}>
                        {u.role === 'admin' ? 'Administrador' : 'Aluno'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        disabled={updatingId === u.user_id}
                        value={u.role} 
                        onValueChange={(val) => updateRole(u.user_id, val)}
                      >
                        <SelectTrigger className="w-[130px] ml-auto h-8 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Aluno</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

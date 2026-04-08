import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsuarios() {
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");

      return (profiles || []).map((p: any) => ({
        ...p,
        roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
      }));
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isCurrentlyAdmin }: { userId: string; isCurrentlyAdmin: boolean }) => {
      if (isCurrentlyAdmin) {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Permissão atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar permissão."),
  });

  return (
    <div className="space-y-6 px-4 sm:px-8">
      <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u: any) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge className="bg-primary/20 text-primary">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Aluno</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon"
                        onClick={() => toggleAdmin.mutate({ userId: u.user_id, isCurrentlyAdmin: isAdmin })}
                        title={isAdmin ? "Remover admin" : "Tornar admin"}
                      >
                        {isAdmin ? <ShieldOff className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

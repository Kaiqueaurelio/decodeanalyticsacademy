import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAlertas() {
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("security_alerts")
        .select("*, profiles!security_alerts_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("security_alerts").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-alerts"] });
      toast.success("Alerta marcado como resolvido.");
    },
  });

  return (
    <div className="space-y-6 px-4 sm:px-8">
      <h1 className="text-3xl font-bold text-foreground">Alertas de Segurança</h1>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts?.map((alert: any) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.profiles?.full_name || "—"}</TableCell>
                  <TableCell><Badge variant="destructive">{alert.alert_type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">{alert.description || "—"}</TableCell>
                  <TableCell>
                    {alert.resolved ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500">Resolvido</Badge>
                    ) : (
                      <Badge variant="destructive">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(alert.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {!alert.resolved && (
                      <Button variant="ghost" size="icon" onClick={() => resolveAlert.mutate(alert.id)}>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!alerts || alerts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum alerta registrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const actionLabels: Record<string, string> = {
  view: "Visualização", download: "Download", screenshot: "Screenshot",
  login: "Login", logout: "Logout", unauthorized_access: "Acesso não autorizado",
};

const actionColors: Record<string, string> = {
  view: "secondary", download: "default", screenshot: "destructive",
  login: "default", logout: "secondary", unauthorized_access: "destructive",
};

export default function AdminLogs() {
  const [actionFilter, setActionFilter] = useState("");

  const { data: logs } = useQuery({
    queryKey: ["admin-logs", actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*, profiles!activity_logs_user_id_fkey(full_name, email), materials(title)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (actionFilter && actionFilter !== "all") {
        query = query.eq("action", actionFilter as any);
      }

      const { data } = await query;
      return data || [];
    },
  });

  return (
    <div className="space-y-6 px-4 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Logs de Atividade</h1>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(actionLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.profiles?.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{log.profiles?.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={(actionColors[log.action] as any) || "secondary"}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{log.materials?.title || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{log.ip_address || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum log encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

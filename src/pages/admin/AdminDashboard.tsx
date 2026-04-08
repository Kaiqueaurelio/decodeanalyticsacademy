import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Download, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, materials, downloads, alerts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("downloads").select("id", { count: "exact", head: true }),
        supabase.from("security_alerts").select("id", { count: "exact", head: true }).eq("resolved", false),
      ]);
      return {
        students: profiles.count || 0,
        materials: materials.count || 0,
        downloads: downloads.count || 0,
        alerts: alerts.count || 0,
      };
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["admin-recent-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*, profiles!activity_logs_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const statCards = [
    { title: "Total de Alunos", value: stats?.students || 0, icon: Users, color: "text-primary" },
    { title: "Materiais", value: stats?.materials || 0, icon: FileText, color: "text-green-500" },
    { title: "Downloads", value: stats?.downloads || 0, icon: Download, color: "text-yellow-500" },
    { title: "Alertas Ativos", value: stats?.alerts || 0, icon: AlertTriangle, color: "text-destructive" },
  ];

  const actionLabels: Record<string, string> = {
    view: "Visualização", download: "Download", screenshot: "Screenshot",
    login: "Login", logout: "Logout", unauthorized_access: "Acesso não autorizado",
  };

  return (
    <div className="space-y-6 px-4 sm:px-8">
      <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm text-foreground">{log.profiles?.full_name || "Usuário"}</span>
                    <span className="text-xs text-muted-foreground ml-2">{actionLabels[log.action] || log.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhuma atividade recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

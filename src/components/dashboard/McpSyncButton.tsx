import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function McpSyncButton() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);

    try {
      // 1. Obter endpoint do MCP das configurações
      const { data: setting, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'mcp_endpoint_url')
        .maybeSingle();

      if (settingError) throw settingError;

      const endpoint = setting?.value || `${window.location.origin.replace(/\.lovable\.app$/, '.supabase.co')}/functions/v1/mcp`;

      // 2. Chamar o endpoint para sincronização
      // Nota: O MCP responde a JSON-RPC. Aqui simulamos uma chamada de sincronização
      // que o backend deve interpretar para atualizar dados do aluno.
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "sync/student-data",
          params: { userId: user.id }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na sincronização: ${response.status}`);
      }

      // 3. Invalidar queries para atualizar a UI
      await queryClient.invalidateQueries({ queryKey: ['apostilas'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      toast.success('Sincronização concluída!', {
        description: 'Seus dados e apostilas foram atualizados via MCP.',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
    } catch (err) {
      console.error('MCP Sync Error:', err);
      toast.error('Falha na sincronização', {
        description: 'Não foi possível conectar ao endpoint MCP configurado.',
        icon: <AlertCircle className="h-4 w-4 text-destructive" />
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="h-8 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-[10px] font-bold uppercase tracking-wider gap-2 transition-all active:scale-95"
    >
      {syncing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
    </Button>
  );
}

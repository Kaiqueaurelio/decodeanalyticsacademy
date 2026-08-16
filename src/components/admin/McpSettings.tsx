import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link2, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function McpSettings() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'mcp_endpoint_url')
        .maybeSingle();

      if (error) throw error;
      
      const defaultUrl = `${window.location.origin.replace(/\.lovable\.app$/, '.supabase.co')}/functions/v1/mcp`;
      setUrl(String(data?.value || defaultUrl));
    } catch (err) {
      console.error('Error loading MCP settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'mcp_endpoint_url', 
          value: url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('URL do MCP atualizada com sucesso!');
      checkStatus();
    } catch (err) {
      console.error('Error saving MCP settings:', err);
      toast.error('Falha ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  async function checkStatus() {
    setChecking(true);
    setStatus(null);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
          params: {}
        })
      });

      if (response.ok) {
        setStatus({ ok: true, message: 'Endpoint respondendo corretamente.' });
      } else {
        setStatus({ ok: false, message: `Erro HTTP: ${response.status}` });
      }
    } catch (err) {
      setStatus({ ok: false, message: 'Não foi possível conectar ao endpoint.' });
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="rounded-[2rem] border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Integração MCP</CardTitle>
              <CardDescription>
                Configure o endpoint do Model Context Protocol para integrações acadêmicas externas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="mcp-url">URL do Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  id="mcp-url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-background/50 border-primary/10 rounded-xl"
                />
                <Button 
                  onClick={handleSave} 
                  disabled={saving || !url}
                  className="rounded-xl"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                O endpoint padrão costuma ser a Edge Function 'mcp' do projeto.
              </p>
            </div>

            <div className="pt-4 border-t border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">Status do Endpoint</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkStatus} 
                  disabled={checking}
                  className="rounded-lg h-8 gap-2"
                >
                  <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
                  Testar Conexão
                </Button>
              </div>

              {status ? (
                <div className={`flex items-start gap-3 p-4 rounded-2xl border ${status.ok ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                  {status.ok ? <CheckCircle className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium">{status.ok ? 'Conectado' : 'Falha na Conexão'}</p>
                    <p className="text-xs opacity-80">{status.message}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 border-2 border-dashed border-primary/5 rounded-2xl bg-background/20">
                  <p className="text-xs text-muted-foreground">Clique em "Testar Conexão" para verificar o status.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-primary/10 bg-card/30">
        <CardContent className="p-6">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Info</Badge>
            O que é MCP?
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O Model Context Protocol (MCP) é um padrão aberto que permite que assistentes de IA (como a Ella) acessem ferramentas e dados de forma segura. 
            Esta configuração define onde agentes externos podem se conectar para obter dados acadêmicos autorizados do Decode Analytics Academy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

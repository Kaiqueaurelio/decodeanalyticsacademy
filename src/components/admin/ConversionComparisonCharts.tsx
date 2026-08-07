import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Ad } from '@/hooks/useAds';
import { FunnelLead } from './SponsorFunnel';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ComparisonChartsProps {
  ads: Ad[];
  leads: FunnelLead[];
}

export function ConversionComparisonCharts({ ads, leads }: ComparisonChartsProps) {
  const adPerformanceData = useMemo(() => {
    return ads.map(ad => {
      const adLeads = leads.filter(l => l.cta_id === ad.id);
      return {
        name: ad.title.length > 20 ? ad.title.substring(0, 20) + '...' : ad.title,
        views: ad.view_count || 0,
        clicks: ad.click_count || 0,
        leads: adLeads.length,
        ctr: ad.view_count > 0 ? ((ad.click_count / ad.view_count) * 100).toFixed(2) : 0,
        conv: ad.click_count > 0 ? ((adLeads.length / ad.click_count) * 100).toFixed(2) : 0
      };
    }).sort((a, b) => b.views - a.views).slice(0, 8);
  }, [ads, leads]);

  const timeSeriesData = useMemo(() => {
    const days = 14;
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const dayLeads = leads.filter(l => l.created_at.startsWith(dateStr));
      
      data.push({
        date: displayDate,
        leads: dayLeads.length,
      });
    }
    return data;
  }, [leads]);

  const chartConfig = {
    views: { label: "Visualizações", color: "hsl(var(--primary))" },
    clicks: { label: "Cliques", color: "hsl(var(--accent))" },
    leads: { label: "Leads", color: "#10b981" }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Desempenho por Anúncio</CardTitle>
          <CardDescription>Comparação direta de engajamento entre campanhas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="views" name="Visualizações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tendência de Conversão (15 dias)</CardTitle>
          <CardDescription>Volume diário de novos leads comerciais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  name="Leads" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

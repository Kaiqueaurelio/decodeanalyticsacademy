import React, { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen, PenLine, Users, Heart, MessageCircle, Megaphone,
  Eye, Zap, Settings, RefreshCw, Search, Bell, ChevronRight,
  BarChart3, TrendingUp, Activity, DollarSign, Brain, LayoutDashboard,
  Calendar, FileText, Share2, ShieldCheck, ArrowUpRight, ArrowDownRight,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  data: any[];
  color: string;
}

const Sparkline = ({ data, color }: { data: any[], color: string }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        fillOpacity={1}
        fill={`url(#gradient-${color})`}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const MetricCard = ({ title, value, change, icon, data, color }: MetricCardProps) => (
  <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
    <CardContent className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className={`p-2 rounded-xl bg-background shadow-sm border border-border/50 text-primary`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-1 text-xs font-medium">
          {change > 0 ? (
            <span className="text-emerald-500 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{change}%
            </span>
          ) : (
            <span className="text-rose-500 flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-0.5" /> {change}%
            </span>
          )}
          <span className="text-muted-foreground font-normal">vs mês anterior</span>
        </div>
        <div className="flex-1 max-w-[100px]">
          <Sparkline data={data} color={color} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function AdminDashboardUltimate({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalApostillas: 0,
    totalExercises: 0,
    totalUsers: 0,
    totalComments: 0,
    totalLikes: 0,
    totalAds: 0,
    adViews: 0,
    adClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        supabase.from('apostilas').select('id', { count: 'exact', head: true }),
        supabase.from('exercises').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_comments').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_likes').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('ad_views').select('id', { count: 'exact', head: true }),
        supabase.from('ad_clicks').select('id', { count: 'exact', head: true }),
      ]);

      const getCount = (res: any) => (res.status === 'fulfilled' && res.value.count ? res.value.count : 0);

      const [
        apostilas,
        exercises,
        users,
        comments,
        likes,
        ads,
        adViews,
        adClicks
      ] = results.map(getCount);

      setStats({
        totalApostillas: apostilas || 0,
        totalExercises: exercises || 0,
        totalUsers: users || 0,
        totalComments: comments || 0,
        totalLikes: likes || 0,
        totalAds: ads || 0,
        adViews: adViews || 0,
        adClicks: adClicks || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Dados fictícios para sparklines
  const sparkData = [
    { value: 30 }, { value: 45 }, { value: 35 }, { value: 55 }, { value: 40 }, { value: 65 }, { value: 50 }
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-content-show">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/50 p-6 rounded-3xl border border-border/50 backdrop-blur-md">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-muted-foreground">Bem-vindo ao centro de comando da Decode Analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar dados..." className="pl-10 w-[250px] bg-background/50 border-none shadow-inner" />
          </div>
          <Button onClick={loadStats} variant="secondary" size="icon" className="rounded-full shadow-sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="rounded-full shadow-lg shadow-primary/20 gap-2">
            <Plus className="h-4 w-4" />
            Novo Conteúdo
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Alunos"
          value={stats.totalUsers}
          change={12.5}
          icon={<Users className="h-5 w-5" />}
          data={sparkData}
          color="#3b82f6"
        />
        <MetricCard
          title="Apostilas"
          value={stats.totalApostillas}
          change={5.2}
          icon={<BookOpen className="h-5 w-5" />}
          data={sparkData.map(d => ({ value: d.value * 0.8 }))}
          color="#8b5cf6"
        />
        <MetricCard
          title="Engajamento"
          value={stats.totalLikes + stats.totalComments}
          change={24.8}
          icon={<Heart className="h-5 w-5" />}
          data={sparkData.map(d => ({ value: d.value * 1.2 }))}
          color="#ec4899"
        />
        <MetricCard
          title="Cliques em Ads"
          value={stats.adClicks}
          change={-2.4}
          icon={<Zap className="h-5 w-5" />}
          data={sparkData.map(d => ({ value: d.value * 0.5 }))}
          color="#f59e0b"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividade Principal */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Atividade da Plataforma</CardTitle>
              <CardDescription>Acessos e interações nos últimos 7 dias</CardDescription>
            </div>
            <Badge variant="outline" className="font-normal">Última Semana</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={[
                { day: 'Seg', users: 400, interactions: 240 },
                { day: 'Ter', users: 300, interactions: 139 },
                { day: 'Qua', users: 200, interactions: 980 },
                { day: 'Qui', users: 278, interactions: 390 },
                { day: 'Sex', users: 189, interactions: 480 },
                { day: 'Sab', users: 239, interactions: 380 },
                { day: 'Dom', users: 349, interactions: 430 },
              ]}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="interactions" stroke="#8b5cf6" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Conteúdo */}
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição</CardTitle>
            <CardDescription>Tipos de materiais ativos</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Apostilas', value: stats.totalApostillas },
                    { name: 'Exercícios', value: stats.totalExercises },
                    { name: 'Anúncios', value: stats.totalAds },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-4 w-full mt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Apostilas</span>
                </div>
                <span className="font-bold">{stats.totalApostillas}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-muted-foreground">Exercícios</span>
                </div>
                <span className="font-bold">{stats.totalExercises}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Anúncios</span>
                </div>
                <span className="font-bold">{stats.totalAds}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Button
          variant="outline"
          className="h-auto p-6 flex flex-col items-center gap-3 rounded-3xl border-none bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 transition-all group"
          onClick={() => onNavigate('apostilas')}
        >
          <div className="p-3 rounded-2xl bg-blue-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-blue-900 dark:text-blue-100">Apostilas</p>
            <p className="text-xs text-blue-600/70">Gerenciar conteúdo</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 flex flex-col items-center gap-3 rounded-3xl border-none bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 transition-all group"
          onClick={() => onNavigate('users')}
        >
          <div className="p-3 rounded-2xl bg-purple-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-purple-900 dark:text-purple-100">Usuários</p>
            <p className="text-xs text-purple-600/70">Controle de acesso</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 flex flex-col items-center gap-3 rounded-3xl border-none bg-pink-50/50 dark:bg-pink-950/20 hover:bg-pink-100 transition-all group"
          onClick={() => onNavigate('ads')}
        >
          <div className="p-3 rounded-2xl bg-pink-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-pink-900 dark:text-pink-100">Anúncios</p>
            <p className="text-xs text-pink-600/70">Gerenciar ads</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 flex flex-col items-center gap-3 rounded-3xl border-none bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 transition-all group"
          onClick={() => onNavigate('performance')}
        >
          <div className="p-3 rounded-2xl bg-amber-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-amber-900 dark:text-amber-100">Performance</p>
            <p className="text-xs text-amber-600/70">Status do sistema</p>
          </div>
        </Button>
      </div>
    </div>
  );
}

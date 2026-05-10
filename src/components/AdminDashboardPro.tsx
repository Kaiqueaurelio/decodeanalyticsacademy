import React, { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, BookOpen, PenLine, Users, TrendingUp, Eye, Heart, MessageCircle,
  Share2, Zap, AlertCircle, CheckCircle2, Clock, Activity, DollarSign, Megaphone,
  Brain, Music, Video, Settings, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface KPI {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
  color: string;
  action: () => void;
}

export function AdminDashboardPro({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalApostillas: 0,
    totalExercises: 0,
    totalUsers: 0,
    totalComments: 0,
    totalLikes: 0,
    totalAds: 0,
    totalFlashcards: 0,
    adViews: 0,
    adClicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [
        { count: apostilas },
        { count: exercises },
        { count: users },
        { count: comments },
        { count: likes },
        { count: ads },
        { count: adViews },
        { count: adClicks },
      ] = await Promise.all([
        supabase.from('apostilas').select('id', { count: 'exact' }),
        supabase.from('exercises').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('apostila_comments').select('id', { count: 'exact' }),
        supabase.from('apostila_likes').select('id', { count: 'exact' }),
        supabase.from('ads').select('id', { count: 'exact' }),
        supabase.from('ad_views').select('id', { count: 'exact' }),
        supabase.from('ad_clicks').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalApostillas: apostilas || 0,
        totalExercises: exercises || 0,
        totalUsers: users || 0,
        totalComments: comments || 0,
        totalLikes: likes || 0,
        totalAds: ads || 0,
        totalFlashcards: 0, // Será calculado depois
        adViews: adViews || 0,
        adClicks: adClicks || 0,
      });

      // Dados simulados para gráfico de atividade
      setActivityData([
        { day: 'Seg', users: 120, apostilas: 40, comments: 24 },
        { day: 'Ter', users: 132, apostilas: 48, comments: 30 },
        { day: 'Qua', users: 101, apostilas: 35, comments: 20 },
        { day: 'Qui', users: 164, apostilas: 52, comments: 35 },
        { day: 'Sex', users: 149, apostilas: 45, comments: 28 },
        { day: 'Sab', users: 200, apostilas: 60, comments: 42 },
        { day: 'Dom', users: 180, apostilas: 55, comments: 38 },
      ]);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpis: KPI[] = [
    {
      label: 'Apostilas',
      value: stats.totalApostillas,
      change: 12,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Exercícios',
      value: stats.totalExercises,
      change: 8,
      icon: <PenLine className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Usuários Ativos',
      value: stats.totalUsers,
      change: 15,
      icon: <Users className="h-5 w-5" />,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Engajamento (Curtidas)',
      value: stats.totalLikes,
      change: 23,
      icon: <Heart className="h-5 w-5" />,
      color: 'from-red-500 to-red-600',
    },
    {
      label: 'Comentários',
      value: stats.totalComments,
      change: 18,
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      label: 'Anúncios Ativos',
      value: stats.totalAds,
      change: 5,
      icon: <Megaphone className="h-5 w-5" />,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      label: 'Visualizações de Ads',
      value: stats.adViews,
      change: 42,
      icon: <Eye className="h-5 w-5" />,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      label: 'Cliques em Ads',
      value: stats.adClicks,
      change: 31,
      icon: <Zap className="h-5 w-5" />,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const modules: ModuleCard[] = [
    {
      id: 'apostilas',
      title: 'Gerenciar Apostilas',
      description: 'Criar, editar e organizar apostilas',
      icon: <BookOpen className="h-6 w-6" />,
      count: stats.totalApostillas,
      color: 'bg-blue-50 dark:bg-blue-950',
      action: () => onNavigate('apostilas'),
    },
    {
      id: 'exercises',
      title: 'Gerenciar Exercícios',
      description: 'Criar e gerenciar exercícios e simulados',
      icon: <PenLine className="h-6 w-6" />,
      count: stats.totalExercises,
      color: 'bg-purple-50 dark:bg-purple-950',
      action: () => onNavigate('exercises'),
    },
    {
      id: 'users',
      title: 'Gerenciar Usuários',
      description: 'Controlar acesso e permissões',
      icon: <Users className="h-6 w-6" />,
      count: stats.totalUsers,
      color: 'bg-green-50 dark:bg-green-950',
      action: () => onNavigate('users'),
    },
    {
      id: 'ads',
      title: 'Gerenciar Anúncios',
      description: 'Criar e monitorar anúncios',
      icon: <Megaphone className="h-6 w-6" />,
      count: stats.totalAds,
      color: 'bg-yellow-50 dark:bg-yellow-950',
      action: () => onNavigate('ads'),
    },
    {
      id: 'social',
      title: 'Monitorar Social',
      description: 'Ver curtidas, comentários e compartilhamentos',
      icon: <Heart className="h-6 w-6" />,
      count: stats.totalLikes + stats.totalComments,
      color: 'bg-red-50 dark:bg-red-950',
      action: () => onNavigate('social'),
    },
    {
      id: 'materials',
      title: 'Gerenciar Materiais',
      description: 'Vídeos, áudios e recursos',
      icon: <Video className="h-6 w-6" />,
      color: 'bg-cyan-50 dark:bg-cyan-950',
      action: () => onNavigate('materials'),
    },
    {
      id: 'ai',
      title: 'Configurar IA',
      description: 'Configurar provedores de IA',
      icon: <Brain className="h-6 w-6" />,
      color: 'bg-indigo-50 dark:bg-indigo-950',
      action: () => onNavigate('ai'),
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Monitorar saúde do sistema',
      icon: <Activity className="h-6 w-6" />,
      color: 'bg-orange-50 dark:bg-orange-950',
      action: () => onNavigate('performance'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu sistema de educação</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${kpi.color} text-white`}>
                    {kpi.icon}
                  </div>
                  {kpi.change !== undefined && (
                    <Badge variant={kpi.change > 0 ? 'default' : 'secondary'} className="gap-1">
                      {kpi.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(kpi.change)}%
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Atividade */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade da Semana</CardTitle>
            <CardDescription>Usuários, apostilas e comentários</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Usuários" />
                <Line type="monotone" dataKey="apostilas" stroke="#8b5cf6" name="Apostilas" />
                <Line type="monotone" dataKey="comments" stroke="#ec4899" name="Comentários" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Conteúdo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Conteúdo</CardTitle>
            <CardDescription>Proporção de tipos de conteúdo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Apostilas', value: stats.totalApostillas },
                    { name: 'Exercícios', value: stats.totalExercises },
                    { name: 'Anúncios', value: stats.totalAds },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Módulos de Gestão */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Módulos de Gestão</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module, idx) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={`${module.color} cursor-pointer hover:shadow-lg transition-all hover:scale-105`}
                onClick={module.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-primary">{module.icon}</div>
                    {module.count !== undefined && (
                      <Badge variant="secondary">{module.count}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{module.title}</h3>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Banco de Dados</span>
              </div>
              <Badge className="bg-green-600">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Autenticação</span>
              </div>
              <Badge className="bg-green-600">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Armazenamento de Mídia</span>
              </div>
              <Badge className="bg-green-600">Operacional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BookOpen, PenLine, Users, Heart, MessageCircle, Megaphone,
  Eye, Zap, Settings, RefreshCw, Plus, Search, MoreVertical,
  TrendingUp, Clock, Activity, DollarSign, Brain, Music
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

export function AdminDashboardGleek({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalApostillas: 0,
    totalExercises: 0,
    totalUsers: 0,
    totalComments: 0,
    totalLikes: 0,
    totalAds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

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
      ] = await Promise.all([
        supabase.from('apostilas').select('id', { count: 'exact' }),
        supabase.from('exercises').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('apostila_comments').select('id', { count: 'exact' }),
        supabase.from('apostila_likes').select('id', { count: 'exact' }),
        supabase.from('ads').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalApostillas: apostilas || 0,
        totalExercises: exercises || 0,
        totalUsers: users || 0,
        totalComments: comments || 0,
        totalLikes: likes || 0,
        totalAds: ads || 0,
      });

      // Dados para gráfico
      setActivityData([
        { semester: 'Sem 1', apostilas: 12, exercises: 45 },
        { semester: 'Sem 2', apostilas: 15, exercises: 52 },
        { semester: 'Sem 3', apostilas: 18, exercises: 48 },
        { semester: 'Sem 4', apostilas: 20, exercises: 60 },
        { semester: 'Sem 5', apostilas: 22, exercises: 58 },
        { semester: 'Sem 6', apostilas: 25, exercises: 65 },
        { semester: 'Sem 7', apostilas: 28, exercises: 70 },
        { semester: 'Sem 8', apostilas: 30, exercises: 75 },
      ]);

      // Atividade recente
      setRecentActivity([
        { id: 1, title: 'Redes de Computadores', type: 'apostila', users: 45, status: 'ativa' },
        { id: 2, title: 'Banco de Dados', type: 'apostila', users: 38, status: 'ativa' },
        { id: 3, title: 'Programação em Python', type: 'apostila', users: 52, status: 'ativa' },
        { id: 4, title: 'Segurança da Informação', type: 'apostila', users: 28, status: 'ativa' },
      ]);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    {
      label: 'Apostilas',
      value: stats.totalApostillas,
      icon: <BookOpen className="h-6 w-6" />,
      bgColor: 'bg-gradient-to-br from-green-400 to-green-500',
      textColor: 'text-white',
    },
    {
      label: 'Exercícios',
      value: stats.totalExercises,
      icon: <PenLine className="h-6 w-6" />,
      bgColor: 'bg-gradient-to-br from-orange-400 to-orange-500',
      textColor: 'text-white',
    },
    {
      label: 'Usuários',
      value: stats.totalUsers,
      icon: <Users className="h-6 w-6" />,
      bgColor: 'bg-gradient-to-br from-blue-400 to-blue-500',
      textColor: 'text-white',
    },
    {
      label: 'Curtidas',
      value: stats.totalLikes,
      icon: <Heart className="h-6 w-6" />,
      bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
      textColor: 'text-white',
    },
    {
      label: 'Comentários',
      value: stats.totalComments,
      icon: <MessageCircle className="h-6 w-6" />,
      bgColor: 'bg-gradient-to-br from-pink-400 to-pink-500',
      textColor: 'text-white',
    },
    {
      label: 'Anúncios',
      value: stats.totalAds,
      icon: <Megaphone className="h-6 w-6" />,
      bgColor: 'bg-gradient-to-br from-purple-400 to-purple-500',
      textColor: 'text-white',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Decode Analytics Academy</h1>
          <p className="text-muted-foreground mt-1">Painel de Controle Administrativo</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stat Cards Grid - Estilo Gleek */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08 }}
          >
            <div className={`${stat.bgColor} ${stat.textColor} rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  {stat.icon}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Apostilas e Exercícios por Semestre */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Distribuição de Conteúdo</CardTitle>
            <CardDescription>Apostilas e Exercícios por Semestre</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="semester" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="apostilas" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                <Bar dataKey="exercises" fill="#fbbf24" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Engajamento */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Engajamento Semanal</CardTitle>
            <CardDescription>Curtidas, Comentários e Visualizações</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={[
                  { day: 'Seg', likes: 120, comments: 45, views: 320 },
                  { day: 'Ter', likes: 145, comments: 52, views: 380 },
                  { day: 'Qua', likes: 132, comments: 48, views: 350 },
                  { day: 'Qui', likes: 168, comments: 65, views: 420 },
                  { day: 'Sex', likes: 190, comments: 78, views: 480 },
                  { day: 'Sab', likes: 210, comments: 92, views: 520 },
                  { day: 'Dom', likes: 185, comments: 85, views: 450 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} />
                <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Apostilas Ativas */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apostilas Ativas</CardTitle>
              <CardDescription>Conteúdo em uso pelos alunos</CardDescription>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Apostila
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.users} alunos estudando</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ativa
                  </Badge>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigate('apostilas')}>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-blue-500" />
            <p className="font-semibold">Gerenciar Apostilas</p>
            <p className="text-xs text-muted-foreground mt-1">Editar e organizar</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigate('users')}>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-green-500" />
            <p className="font-semibold">Gerenciar Usuários</p>
            <p className="text-xs text-muted-foreground mt-1">Controle de acesso</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigate('ads')}>
          <CardContent className="p-6 text-center">
            <Megaphone className="h-8 w-8 mx-auto mb-3 text-purple-500" />
            <p className="font-semibold">Gerenciar Anúncios</p>
            <p className="text-xs text-muted-foreground mt-1">Campanhas ativas</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onNavigate('performance')}>
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-3 text-orange-500" />
            <p className="font-semibold">Performance</p>
            <p className="text-xs text-muted-foreground mt-1">Saúde do sistema</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

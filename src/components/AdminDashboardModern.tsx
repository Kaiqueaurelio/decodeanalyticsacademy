import React, { useState, useEffect } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen, PenLine, Users, Heart, MessageCircle, Megaphone,
  RefreshCw, Plus, Search, MoreVertical, ChevronRight, Sparkles,
  Activity, GraduationCap, Bell, Mail, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface Props { onNavigate: (tab: string) => void }

export function AdminDashboardModern({ onNavigate }: Props) {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    apostilas: 0, exercises: 0, users: 0, comments: 0, likes: 0, ads: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [a, e, u, c, l, ad, rec] = await Promise.all([
        supabase.from('apostilas').select('id', { count: 'exact', head: true }),
        supabase.from('exercises').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_comments').select('id', { count: 'exact', head: true }),
        supabase.from('apostila_likes').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('apostilas').select('id,title,category,published,created_at').order('created_at', { ascending: false }).limit(6),
      ]);
      setStats({
        apostilas: a.count || 0,
        exercises: e.count || 0,
        users: u.count || 0,
        comments: c.count || 0,
        likes: l.count || 0,
        ads: ad.count || 0,
      });
      setRecent(rec.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const cards = [
    { label: 'Apostilas', value: stats.apostilas, icon: BookOpen, gradient: 'from-blue-500 to-blue-600', tab: 'apostilas' },
    { label: 'Exercícios', value: stats.exercises, icon: PenLine, gradient: 'from-emerald-500 to-green-600', tab: 'exercises' },
    { label: 'Usuários', value: stats.users, icon: Users, gradient: 'from-pink-500 to-rose-600', tab: 'users' },
    { label: 'Anúncios', value: stats.ads, icon: Megaphone, gradient: 'from-amber-500 to-orange-600', tab: 'ads' },
  ];

  const engagement = [
    { day: 'Seg', apostilas: 12, exercises: 24 },
    { day: 'Ter', apostilas: 18, exercises: 32 },
    { day: 'Qua', apostilas: 22, exercises: 28 },
    { day: 'Qui', apostilas: 28, exercises: 42 },
    { day: 'Sex', apostilas: 32, exercises: 50 },
    { day: 'Sab', apostilas: 26, exercises: 38 },
    { day: 'Dom', apostilas: 20, exercises: 30 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar: search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo Decode Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar apostila, aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-muted/50 border-transparent"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full"><Bell className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Welcome banner — gradient roxo */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, hsl(265 85% 35%), hsl(280 80% 50%) 50%, hsl(300 70% 55%))',
        }}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-amber-200 font-semibold text-lg">
            Olá, {user?.email?.split('@')[0] || 'Admin'}
          </p>
          <h2 className="text-white text-2xl sm:text-3xl font-bold mt-2 leading-tight">
            Gerencie a <span className="text-amber-200">academia</span> com
            uma <span className="text-amber-200">experiência</span> intuitiva.
          </h2>
          <Button
            className="mt-5 bg-amber-400 hover:bg-amber-500 text-purple-950 font-semibold rounded-full px-6"
            onClick={() => onNavigate('apostilas')}
          >
            Gerenciar conteúdo <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {/* decorative blobs */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-10 bottom-0 w-40 h-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 opacity-90">
          <div className="relative">
            <GraduationCap className="w-32 h-32 text-white/90" strokeWidth={1.2} />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-200" />
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            type="button"
            onClick={() => onNavigate(c.tab)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="text-left rounded-2xl bg-card border border-border/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{c.label}</p>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-md`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-3">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">Ver detalhes →</p>
          </motion.button>
        ))}
      </div>

      {/* Chart + Side list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Engajamento da semana</CardTitle>
              <CardDescription>Apostilas lidas e exercícios resolvidos</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full">Últimos 7 dias</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={engagement} barGap={6}>
                <defs>
                  <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280 80% 60%)" />
                    <stop offset="100%" stopColor="hsl(265 85% 45%)" />
                  </linearGradient>
                  <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(45 95% 60%)" />
                    <stop offset="100%" stopColor="hsl(30 95% 55%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="apostilas" fill="url(#grad-purple)" radius={[8,8,0,0]} />
                <Bar dataKey="exercises" fill="url(#grad-amber)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Ações rápidas</CardTitle>
              <CardDescription>Atalhos mais usados</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Nova apostila', icon: BookOpen, tab: 'apostilas', color: 'from-blue-500 to-blue-600' },
              { label: 'Novo anúncio', icon: Megaphone, tab: 'ads', color: 'from-purple-500 to-pink-500' },
              { label: 'Gerenciar usuários', icon: Users, tab: 'users', color: 'from-emerald-500 to-green-600' },
              { label: 'Performance', icon: Activity, tab: 'performance', color: 'from-amber-500 to-orange-600' },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.tab)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-white`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-left text-sm font-medium">{a.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent apostilas table */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Apostilas recentes</CardTitle>
            <CardDescription>Últimas adicionadas à plataforma</CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('apostilas')}>
            Ver todas <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma apostila ainda.</p>
            )}
            {recent.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.category || 'Sem categoria'}</p>
                </div>
                <Badge
                  variant="outline"
                  className={item.published
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}
                >
                  {item.published ? 'Publicada' : 'Rascunho'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

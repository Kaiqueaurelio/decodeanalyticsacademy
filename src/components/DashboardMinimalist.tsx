import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen, Clock, TrendingUp, Zap, Heart, MessageCircle,
  ChevronRight, BarChart3, Target, Flame, Award, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface LearningCurveData {
  week: string;
  progress: number;
  target: number;
}

interface TodayLecture {
  id: string;
  title: string;
  category: string;
  duration: string;
  progress: number;
  color: string;
}

interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastActivity: string;
}

export function DashboardMinimalist({
  userName = 'Aluno',
  weeklyGoal = 30,
  weeklyProgress = 18,
  totalXP = 2450,
  level = 8,
  streak = 12,
  todayLectures = [],
  communityMembers = [],
}: {
  userName?: string;
  weeklyGoal?: number;
  weeklyProgress?: number;
  totalXP?: number;
  level?: number;
  streak?: number;
  todayLectures?: TodayLecture[];
  communityMembers?: CommunityMember[];
}) {
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);

  // Dados de exemplo para curva de aprendizado
  const learningData: LearningCurveData[] = [
    { week: 'Sem 1', progress: 20, target: 30 },
    { week: 'Sem 2', progress: 35, target: 30 },
    { week: 'Sem 3', progress: 28, target: 30 },
    { week: 'Sem 4', progress: 42, target: 30 },
    { week: 'Sem 5', progress: 38, target: 30 },
    { week: 'Sem 6', progress: 45, target: 30 },
  ];

  // Dados padrão para aulas de hoje
  const defaultLectures: TodayLecture[] = [
    { id: '1', title: 'Redes de Computadores', category: 'Networking', duration: '45 min', progress: 75, color: 'from-blue-100 to-blue-50' },
    { id: '2', title: 'Banco de Dados', category: 'Database', duration: '60 min', progress: 45, color: 'from-purple-100 to-purple-50' },
    { id: '3', title: 'Segurança da Informação', category: 'Security', duration: '30 min', progress: 20, color: 'from-orange-100 to-orange-50' },
  ];

  // Dados padrão para comunidade
  const defaultMembers: CommunityMember[] = [
    { id: '1', name: 'João Silva', avatar: 'JS', status: 'online', lastActivity: 'Estudando agora' },
    { id: '2', name: 'Maria Santos', avatar: 'MS', status: 'online', lastActivity: 'Há 5 min' },
    { id: '3', name: 'Pedro Costa', avatar: 'PC', status: 'offline', lastActivity: 'Há 2 horas' },
    { id: '4', name: 'Ana Oliveira', avatar: 'AO', status: 'online', lastActivity: 'Há 1 min' },
  ];

  const lectures = todayLectures.length > 0 ? todayLectures : defaultLectures;
  const members = communityMembers.length > 0 ? communityMembers : defaultMembers;

  const progressPercentage = Math.round((weeklyProgress / weeklyGoal) * 100);

  return (
    <div className="space-y-8">
      {/* Header com Saudação */}
      <div className="space-y-2">
        <h1 className="text-4xl font-light tracking-tight">Olá, {userName}! 👋</h1>
        <p className="text-muted-foreground text-lg">Vamos continuar sua jornada de aprendizado</p>
      </div>

      {/* Grid Principal - 3 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Aulas de Hoje */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Aulas de Hoje */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-light">Aulas de Hoje</CardTitle>
                  <CardDescription>Suas matérias recomendadas</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver Tudo <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lectures.map((lecture, idx) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedLecture(lecture.id)}
                  className={`p-4 rounded-lg border border-border/50 cursor-pointer transition-all hover:border-primary/30 hover:bg-muted/50 ${
                    selectedLecture === lecture.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{lecture.title}</p>
                      <p className="text-xs text-muted-foreground">{lecture.category}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {lecture.duration}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={lecture.progress} className="flex-1 h-1.5" />
                    <span className="text-xs font-medium text-muted-foreground">{lecture.progress}%</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Card: Curva de Aprendizado */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-light">Curva de Aprendizado</CardTitle>
              <CardDescription>Seu progresso semanal vs. meta</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={learningData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="week" stroke="#999" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="progress" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="target" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Widgets Laterais */}
        <div className="space-y-6">
          {/* Card: Meta Semanal */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light">Meta Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="8"
                    strokeDasharray={`${(progressPercentage / 100) * 339.29} 339.29`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold">{progressPercentage}%</p>
                  <p className="text-xs text-muted-foreground">{weeklyProgress}/{weeklyGoal}</p>
                </div>
              </div>
              <Button className="w-full" variant="outline" size="sm">
                Estudar Agora
              </Button>
            </CardContent>
          </Card>

          {/* Card: Estatísticas */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">XP</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{totalXP}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Nível</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{level}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Sequência</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{streak} dias</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Comunidade */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light">Comunidade</CardTitle>
              <CardDescription className="text-xs">Seus colegas online</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                        </Avatar>
                        {member.status === 'online' && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.lastActivity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção Inferior: Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <p className="font-medium text-sm">Estudar Agora</p>
            <p className="text-xs text-muted-foreground mt-1">Continue de onde parou</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <p className="font-medium text-sm">Flashcards</p>
            <p className="text-xs text-muted-foreground mt-1">Revisar hoje</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-sm">Simulado</p>
            <p className="text-xs text-muted-foreground mt-1">Testar conhecimento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ícone Brain para importação
function Brain({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

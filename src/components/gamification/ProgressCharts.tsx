import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Award, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useGamification } from '@/hooks/useGamification';

export function ProgressCharts() {
  const { history } = useGamification();

  const temporalData = [...history].reverse().map(h => ({
    date: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    score: h.xp_gained,
    completed: h.chapters_completed + h.exercises_completed
  }));

  const subjectData = [...history].slice(0, 6).reverse().map(h => ({
    subject: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    A: h.chapters_completed + h.exercises_completed,
    fullMark: 10,
  }));

  const emptyState = (label: string) => (
    <div className="h-full w-full flex items-center justify-center text-center px-4">
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Temporal Progress Chart */}
      <Card className="bg-card/50 border-primary/20 p-6 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <TrendingUp className="h-24 w-24 text-primary" />
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Evolução Temporal</h3>
            <p className="text-[10px] text-muted-foreground font-mono">ANALYTICS :: PERFORMANCE_TIMELINE</p>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={temporalData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888888', fontFamily: 'DM Mono' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888888', fontFamily: 'DM Mono' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#050508', 
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'DM Mono'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#a855f7" 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Radar Chart for Subjects */}
      <Card className="bg-card/50 border-primary/20 p-6 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <Award className="h-24 w-24 text-cyan-400" />
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Competências por Área</h3>
            <p className="text-[10px] text-muted-foreground font-mono">SKILLS :: RADAR_SCAN</p>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectData}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 10, fill: '#888888', fontFamily: 'DM Mono' }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 150]} 
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#00f0ff"
                fill="#00f0ff"
                fillOpacity={0.3}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#050508', 
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'DM Mono'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

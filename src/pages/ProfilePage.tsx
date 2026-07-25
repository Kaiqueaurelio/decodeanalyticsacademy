import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { EvolutionChart } from '@/components/EvolutionChart';
import { KawaiiSlider } from '@/components/KawaiiSlider';
import { BiometricToggle } from '@/components/BiometricToggle';
import { TestimonialDialog } from '@/components/TestimonialDialog';
import { NewFeaturesShowcase } from '@/components/NewFeaturesShowcase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen, CheckCircle, XCircle, Camera, Save, ArrowLeft,
  PenLine, Trophy, Target, Flame, Rocket, Settings, AlertCircle, PencilLine, Loader2, ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

async function fileToCompactAvatarDataUrl(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = source;
  });

  const size = 320;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nao foi possivel preparar a imagem');

  const scale = Math.max(size / img.width, size / img.height);
  const width = img.width * scale;
  const height = img.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  ctx.drawImage(img, x, y, width, height);

  return canvas.toDataURL('image/jpeg', 0.78);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profileLite } = useUserProfile(user?.id);
  const scope = profileLite?.content_scope ?? 'full';
  const allowedAreas = scope === 'enem_only'
    ? ['Dashboard', 'Apostilas ENEM', 'Exercícios', 'Revisão', 'Desempenho', 'Perfil', 'Ella (Tutora ENEM)']
    : ['Dashboard', 'Todas as apostilas', 'Exercícios', 'Simulados', 'Flashcards', 'Biblioteca', 'Livros', 'Cursos', 'Calculadora', 'Comunidade', 'Tira-dúvidas', 'Notícias', 'Ella', 'Perfil'];
  const navigate = useNavigate();
  const gamification = useGamification();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalApostilas, setTotalApostilas] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem('weeklyExerciseGoal');
    return saved ? Number(saved) : 30;
  });
  const [pomodoroFocus, setPomodoroFocus] = useState(() => {
    const saved = localStorage.getItem('pomodoroFocusMinutes');
    return saved ? Number(saved) : 25;
  });
  const [pomodoroBreak, setPomodoroBreak] = useState(() => {
    const saved = localStorage.getItem('pomodoroBreakMinutes');
    return saved ? Number(saved) : 5;
  });
  const [flashcardsPerDay, setFlashcardsPerDay] = useState(() => {
    const saved = localStorage.getItem('flashcardsPerDay');
    return saved ? Number(saved) : 10;
  });
  const [stats, setStats] = useState({ total: 0, hits: 0, errors: 0, byApostila: {} as Record<string, { hits: number; errors: number; title: string }> });

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
    if (data) { setFullName(data.full_name || ''); setAvatarUrl(data.avatar_url || ''); }
  };

  const loadStats = async () => {
    const { count } = await supabase.from('apostilas').select('*', { count: 'exact', head: true }).eq('published', true);
    setTotalApostilas(count || 0);
    const { data: answers } = await supabase.from('answers').select('*, exercises(apostila_id, apostilas:apostila_id(title))');
    if (answers) {
      const hits = answers.filter(a => a.is_correct).length;
      const errors = answers.filter(a => !a.is_correct).length;
      const byApostila: Record<string, { hits: number; errors: number; title: string }> = {};
      answers.forEach((a: any) => {
        const apId = a.exercises?.apostila_id;
        const apTitle = a.exercises?.apostilas?.title || 'Sem titulo';
        if (!apId) return;
        if (!byApostila[apId]) byApostila[apId] = { hits: 0, errors: 0, title: apTitle };
        if (a.is_correct) byApostila[apId].hits++; else byApostila[apId].errors++;
      });
      setStats({ total: answers.length, hits, errors, byApostila });
      setTotalExercises(answers.length);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Envie uma imagem valida');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Imagem muito grande. Use uma foto de ate 8MB.');
      return;
    }

    setUploading(true);
    try {
      const compactAvatar = await fileToCompactAvatarDataUrl(file);
      setAvatarUrl(compactAvatar);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: compactAvatar })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Foto atualizada!');
    } catch (err: any) {
      toast.error('Erro ao salvar foto: ' + (err?.message || 'tente novamente'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleWeeklyGoalChange = (val: number) => { setWeeklyGoal(val); localStorage.setItem('weeklyExerciseGoal', String(val)); };
  const handlePomodoroFocusChange = (val: number) => { setPomodoroFocus(val); localStorage.setItem('pomodoroFocusMinutes', String(val)); };
  const handlePomodoroBreakChange = (val: number) => { setPomodoroBreak(val); localStorage.setItem('pomodoroBreakMinutes', String(val)); };
  const handleFlashcardsPerDayChange = (val: number) => { setFlashcardsPerDay(val); localStorage.setItem('flashcardsPerDay', String(val)); };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    localStorage.setItem('weeklyExerciseGoal', String(weeklyGoal));
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success('Perfil atualizado!');
    setSaving(false);
  };

  const pct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const initials = (fullName || user?.email || '?').slice(0, 2).toUpperCase();
  const level = pct >= 90 ? 'Excelente' : pct >= 70 ? 'Bom' : pct >= 50 ? 'Regular' : stats.total > 0 ? 'Iniciante' : 'Sem dados';
  const levelColor = pct >= 90 ? 'text-success' : pct >= 70 ? 'text-primary' : pct >= 50 ? 'text-warning' : 'text-muted-foreground';

  const earnedBadges = gamification.badges.filter(b => gamification.earnedBadgeIds.includes(b.id));

  return (
    <div className="min-h-dvh bg-background selection:bg-primary/20">
      <AppHeader />
      <main className="container py-6 px-4 max-w-2xl animate-content-show">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-all mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {(() => {
          const trimmed = (fullName || '').trim();
          const isDefaultName = !trimmed || /^aluno\s+unip\b/i.test(trimmed);
          if (!isDefaultName) return null;
          return (
            <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-4 animate-content-show">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-warning/20 p-2 shrink-0">
                  <AlertCircle className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Personalize seu perfil</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Seu nome ainda esta como <strong>"{trimmed || 'Aluno UNIP'}"</strong>. Adicione seu nome real
                    para aparecer corretamente na comunidade e no ranking.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 gradient-primary text-primary-foreground gap-1.5"
                    onClick={() => {
                      const el = document.getElementById('profile-fullname-input') as HTMLInputElement | null;
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => { el.focus(); el.select(); }, 350);
                      }
                    }}
                  >
                    <PencilLine className="h-3.5 w-3.5" /> Editar nome agora
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        <Card className="p-6 bg-card border border-border/50 mb-6 animate-content-show">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer smooth-all">
                {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div>
                <Label className="text-xs text-muted-foreground">Nome completo</Label>
                <Input id="profile-fullname-input" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" placeholder="Seu nome" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={user?.email || ''} disabled className="mt-1 opacity-60" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} size="sm" className="gradient-primary text-primary-foreground">
                  <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Salvando...' : 'Salvar'}
                </Button>
                <TestimonialDialog />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card border border-border/50 mb-6 animate-content-show delay-1">
          <div className="flex items-start gap-3 mb-3">
            <div className={`rounded-full p-2.5 shrink-0 ${scope === 'enem_only' ? 'bg-warning/15' : 'bg-primary/10'}`}>
              <ShieldCheck className={`h-5 w-5 ${scope === 'enem_only' ? 'text-warning' : 'text-primary'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">Acesso da conta</p>
                <Badge variant="outline" className="text-[10px] font-mono uppercase">{scope}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {scope === 'enem_only'
                  ? 'Sua conta está configurada para foco no ENEM: você vê apenas conteúdos, exercícios e a tutora Ella voltados para o ENEM.'
                  : 'Você tem acesso completo a todas as disciplinas, ferramentas e módulos do app.'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Áreas disponíveis para você ({allowedAreas.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allowedAreas.map((area) => (
                <Badge key={area} variant="secondary" className="text-[10px] font-normal">{area}</Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card border border-border/50 mb-6 animate-content-show delay-1">
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Configuracoes de Estudo
          </h3>
          <div className="space-y-6">
            <KawaiiSlider value={weeklyGoal} onChange={handleWeeklyGoalChange} min={5} max={100} step={5} label="Meta semanal de exercicios" />
            <div className="border-t border-border/30 pt-4"><KawaiiSlider value={pomodoroFocus} onChange={handlePomodoroFocusChange} min={10} max={60} step={5} label="Pomodoro - foco (min)" unit=" min" /></div>
            <div className="border-t border-border/30 pt-4"><KawaiiSlider value={pomodoroBreak} onChange={handlePomodoroBreakChange} min={1} max={15} step={1} label="Pomodoro - pausa (min)" unit=" min" /></div>
            <div className="border-t border-border/30 pt-4"><KawaiiSlider value={flashcardsPerDay} onChange={handleFlashcardsPerDayChange} min={3} max={50} step={1} label="Flashcards por dia" /></div>
            <div className="border-t border-border/30 pt-4"><BiometricToggle /></div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-6 animate-content-show delay-1">
          <Card className="p-4 bg-card border border-border/50 text-center"><Rocket className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{gamification.xp.xp_points}</p><p className="text-[10px] text-muted-foreground">XP - Nivel {gamification.xp.level}</p></Card>
          <Card className="p-4 bg-card border border-border/50 text-center"><Flame className={`h-5 w-5 mx-auto mb-1 ${gamification.streak.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} /><p className="text-xl font-bold">{gamification.streak.current_streak}</p><p className="text-[10px] text-muted-foreground">Streak - Recorde: {gamification.streak.longest_streak}</p></Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-content-show delay-1">
          {[
            { icon: BookOpen, label: 'Apostilas', value: totalApostilas, color: 'text-primary' },
            { icon: PenLine, label: 'Questoes', value: totalExercises, color: 'text-primary' },
            { icon: CheckCircle, label: 'Acertos', value: stats.hits, color: 'text-success' },
            { icon: Target, label: 'Aproveit.', value: `${pct}%`, color: levelColor },
          ].map(s => (
            <Card key={s.label} className="p-4 bg-card border border-border/50 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {earnedBadges.length > 0 && (
          <Card className="p-5 bg-card border border-border/50 mb-6 animate-content-show delay-2">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Conquistas ({earnedBadges.length}/{gamification.badges.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {gamification.badges.map(b => {
                const earned = gamification.earnedBadgeIds.includes(b.id);
                return <div key={b.id} className={`p-2.5 rounded-lg border text-center ${earned ? 'border-primary/30 bg-primary/5' : 'border-border/30 opacity-40'}`}><span className="text-lg">{b.icon}</span><p className="text-[10px] font-medium mt-0.5">{b.name}</p><p className="text-[9px] text-muted-foreground">{b.description}</p></div>;
              })}
            </div>
          </Card>
        )}

        <Card className="p-5 bg-card border border-border/50 mb-6 animate-content-show delay-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-primary/10 p-2.5"><Trophy className={`h-5 w-5 ${levelColor}`} /></div>
            <div><p className="text-sm font-semibold">Nivel de Desempenho</p><p className={`text-lg font-bold ${levelColor}`}>{level}</p></div>
          </div>
          <Progress value={pct} className="h-2.5 mb-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Iniciante</span><span>Regular</span><span>Bom</span><span>Excelente</span></div>
        </Card>

        <div className="mb-6 animate-content-show delay-3"><EvolutionChart /></div>

        {Object.keys(stats.byApostila).length > 0 && (
          <Card className="p-5 bg-card border border-border/50 animate-content-show delay-3">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Desempenho por Apostila</h3>
            <div className="space-y-4">
              {Object.entries(stats.byApostila).map(([id, s]) => {
                const total = s.hits + s.errors;
                const p = total > 0 ? Math.round((s.hits / total) * 100) : 0;
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between mb-1"><p className="text-xs font-medium truncate flex-1">{s.title}</p><div className="flex items-center gap-2 ml-2"><span className="text-[10px] text-muted-foreground">{total} questoes</span><span className="text-xs font-bold">{p}%</span></div></div>
                    <Progress value={p} className="h-1.5" />
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground"><span className="flex items-center gap-0.5"><CheckCircle className="h-3 w-3 text-success" /> {s.hits}</span><span className="flex items-center gap-0.5"><XCircle className="h-3 w-3 text-destructive" /> {s.errors}</span></div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="mt-12 pt-8 border-t border-border/50"><NewFeaturesShowcase /></div>
      </main>
    </div>
  );
}

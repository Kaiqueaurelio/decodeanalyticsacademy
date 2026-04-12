import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen, BarChart3, Shield } from 'lucide-react';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.jpeg';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success(isSignUp ? 'Conta criada com sucesso!' : 'Login realizado!'); navigate('/dashboard'); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Digite seu email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success('Email de recuperação enviado!'); setIsReset(false); }
  };

  const highlights = [
    { icon: BookOpen, text: 'Apostilas estruturadas por IA' },
    { icon: BarChart3, text: 'Dashboard de desempenho' },
    { icon: Shield, text: 'Conteúdo protegido' },
  ];

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Left side - Editorial Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center grid-lines-bg">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="relative z-10 max-w-md px-8 space-y-8 animate-page-in">
          <div className="space-y-5">
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary inline-flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10" style={{ border: '1px solid hsl(68 100% 64% / 0.2)' }}>
              Plataforma de Estudos
            </span>
            <h1 className="font-display text-4xl xl:text-5xl leading-tight">
              Bem-vindo à{' '}
              <span className="text-gradient-animated">Decode Analytics</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Sua plataforma completa de estudos para Ciência da Computação com IA, gamificação e conteúdo protegido.
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card animate-fade-up" style={{ border: '1px solid hsl(0 0% 100% / 0.06)', animationDelay: `${300 + i * 150}ms`, animationFillMode: 'both' }}>
                <div className="rounded bg-primary/10 p-2.5">
                  <h.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{h.text}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-mono-label text-muted-foreground uppercase tracking-wider">
            Desenvolvido por Kaique Aurélio
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col">
        <div className="px-4 sm:px-6 pt-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-all">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 pb-8">
          <div className="w-full max-w-sm animate-card-enter">
            <div className="bg-card rounded-lg p-6 sm:p-8 space-y-5 relative overflow-hidden" style={{ border: '1px solid hsl(0 0% 100% / 0.08)' }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-primary" />

              <div className="text-center space-y-2">
                <img src={logoDark} alt="Decode Analytics" className="mx-auto h-12 w-12 rounded object-cover animate-scale-in" />
                <h1 className="text-xl font-bold animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  {isReset ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Entrar'}
                </h1>
                <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  {isReset ? 'Digite seu email para recuperação' : isSignUp ? 'Crie sua conta para começar' : 'Acesse sua conta Decode Analytics'}
                </p>
              </div>

              {isReset ? (
                <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="resetEmail" className="text-xs text-muted-foreground">Email</Label>
                    <Input id="resetEmail" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Link
                  </Button>
                  <button type="button" onClick={() => setIsReset(false)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground smooth-all">
                    Voltar ao login
                  </button>
                </form>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                      <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="--------" className="pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-all">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSignUp ? 'Criar conta' : 'Entrar'}
                    </Button>
                    {!isSignUp && (
                      <button type="button" onClick={() => setIsReset(true)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground smooth-all">
                        Esqueceu a senha?
                      </button>
                    )}
                  </form>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full" style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)' }} /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-mono-label text-[10px] tracking-widest">ou</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full font-sans normal-case tracking-normal text-sm" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? 'Já tenho conta' : 'Criar conta'}
                  </Button>
                </>
              )}
            </div>
            <p className="text-center text-[11px] font-mono-label text-muted-foreground mt-4 uppercase tracking-wider">
              Decode Analytics · Kaique Aurélio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

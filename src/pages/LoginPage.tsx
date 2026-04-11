import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen, BarChart3, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.jpeg';
import { FloatingParticles } from '@/components/FloatingParticles';

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
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isSignUp ? 'Conta criada com sucesso!' : 'Login realizado!');
      navigate('/dashboard');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Digite seu email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email de recuperacao enviado!');
      setIsReset(false);
    }
  };

  const highlights = [
    { icon: BookOpen, text: 'Apostilas estruturadas por IA' },
    { icon: BarChart3, text: 'Dashboard de desempenho' },
    { icon: Shield, text: 'Conteudo protegido' },
  ];

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center gradient-hero grid-lines-bg">
        <FloatingParticles count={15} />
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float-particle" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-primary/8 blur-3xl animate-float-particle" style={{ animationDuration: '15s', animationDelay: '3s' }} />

        <div className="relative z-10 max-w-md px-8 space-y-8 animate-page-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary animate-pulse-glow">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma de Estudos
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
              Bem-vindo a{' '}
              <span className="text-gradient-animated">Decode Analytics</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Sua plataforma completa de estudos para Ciencia da Computacao com IA, gamificacao e conteudo protegido.
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 animate-fade-up"
                style={{ animationDelay: `${300 + i * 150}ms`, animationFillMode: 'both' }}
              >
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <h.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{h.text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Desenvolvido por Kaique Aurelio
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col">
        <div className="px-4 sm:px-6 pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-all"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 pb-8">
          <div className="w-full max-w-sm animate-card-enter">
            <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6 sm:p-8 space-y-5 relative overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />

              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <img src={logoDark} alt="Decode Analytics" className="mx-auto h-14 w-14 rounded-xl object-cover shadow-md animate-scale-in" />
                  <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md -z-10 animate-pulse-glow" />
                </div>
                <h1 className="text-xl font-bold animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  {isReset ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Entrar'}
                </h1>
                <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  {isReset
                    ? 'Digite seu email para recuperacao'
                    : isSignUp
                    ? 'Crie sua conta para comecar'
                    : 'Acesse sua conta Decode Analytics'}
                </p>
              </div>

              {isReset ? (
                <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="resetEmail" className="text-sm">Email</Label>
                    <Input id="resetEmail" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="transition-all focus:shadow-md focus:shadow-primary/10" />
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.99] transition-transform" disabled={loading}>
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
                    <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="transition-all focus:shadow-md focus:shadow-primary/10" />
                    </div>
                    <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                      <Label htmlFor="password" className="text-sm">Senha</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="--------" className="pr-10 transition-all focus:shadow-md focus:shadow-primary/10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-all">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                      <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignUp ? 'Criar conta' : 'Entrar'}
                      </Button>
                    </div>
                    {!isSignUp && (
                      <button type="button" onClick={() => setIsReset(true)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground smooth-all">
                        Esqueceu a senha?
                      </button>
                    )}
                  </form>
                  <div className="relative animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
                  </div>
                  <div className="animate-fade-in" style={{ animationDelay: '550ms', animationFillMode: 'both' }}>
                    <Button type="button" variant="outline" className="w-full hover:border-primary/30 hover:bg-primary/5 transition-all" onClick={() => setIsSignUp(!isSignUp)}>
                      {isSignUp ? 'Ja tenho conta' : 'Criar conta'}
                    </Button>
                  </div>
                </>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
              Decode Analytics &mdash; Desenvolvido por Kaique Aurelio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

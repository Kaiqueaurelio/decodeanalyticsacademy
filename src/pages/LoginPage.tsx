import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EvasiveButton } from '@/components/EvasiveButton';
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen, BarChart3, Shield, AlertTriangle, Lock, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.jpeg';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const savedEmail = localStorage.getItem('decode_remember_email') || '';
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);
  const passwordRef = useRef<HTMLInputElement>(null);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setShowLockModal(true);
      return;
    }
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Conta criada! Verifique seu e-mail para ativar.');
        setUnverifiedEmail(true);
        setIsSignUp(false);
      }
      return;
    }

    // Login flow
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      // Check if it's an unverified email error
      if (error.message?.includes('Email not confirmed')) {
        setUnverifiedEmail(true);
        toast.error('Verifique seu e-mail antes de acessar.');
        return;
      }

      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      triggerShake();

      if (newAttempts >= 3) {
        // Lock the account
        setIsLocked(true);
        setShowLockModal(true);
        // Update profile in DB
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email)
            .maybeSingle();
          if (profileData) {
            await supabase.from('profiles').update({
              is_blocked: true,
              login_attempts: newAttempts,
              locked_at: new Date().toISOString(),
            } as any).eq('user_id', profileData.user_id);
          }
        } catch {}
        toast.error('Conta bloqueada após 3 tentativas incorretas.');
      } else {
        toast.error(
          `Senha incorreta. Tentativa ${newAttempts} de 3. Após 3 erros, sua conta será bloqueada.`,
          {
            icon: <AlertTriangle className="h-4 w-4 text-warning" />,
            duration: 5000,
          }
        );
      }
    } else {
      setLoginAttempts(0);
      if (rememberMe) localStorage.setItem('decode_remember_email', email);
      else localStorage.removeItem('decode_remember_email');
      toast.success('Login realizado!');
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
    if (error) { toast.error(error.message); }
    else {
      toast.success('Email de recuperação enviado!');
      setIsReset(false);
      setIsLocked(false);
      setLoginAttempts(0);
      setShowLockModal(false);
    }
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-card"
                style={{ border: '1px solid hsl(0 0% 100% / 0.06)' }}
              >
                <div className="rounded bg-primary/10 p-2.5">
                  <h.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{h.text}</span>
              </motion.div>
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
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div className="bg-card rounded-lg p-6 sm:p-8 space-y-5 relative overflow-hidden" style={{ border: '1px solid hsl(0 0% 100% / 0.08)' }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-primary" />

              <div className="text-center space-y-2">
                <motion.img
                  src={logoDark}
                  alt="Decode Analytics"
                  className="mx-auto h-12 w-12 rounded object-cover"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                />
                <h1 className="text-xl font-bold">
                  {isReset ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : isLocked ? 'Conta Bloqueada' : 'Entrar'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isReset
                    ? 'Digite seu email para recuperação'
                    : isSignUp
                    ? 'Crie sua conta para começar'
                    : isLocked
                    ? 'Redefina sua senha para desbloquear'
                    : 'Acesse sua conta Decode Analytics'}
                </p>
              </div>

              {isReset ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
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
                      <div className={`relative ${shaking ? 'animate-shake' : ''}`}>
                        <Input
                          ref={passwordRef}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="--------"
                          className={`pr-10 ${loginAttempts > 0 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-all">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Attempt counter */}
                      <AnimatePresence>
                        {loginAttempts > 0 && !isLocked && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[11px] text-destructive flex items-center gap-1 mt-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Tentativa {loginAttempts} de 3
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Evasive button for unverified emails, normal otherwise */}
                    {unverifiedEmail && !isSignUp ? (
                      <EvasiveButton email={email} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                      </EvasiveButton>
                    ) : (
                      <Button type="submit" className="w-full" disabled={loading || isLocked}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLocked ? (
                          <><Lock className="mr-2 h-4 w-4" /> Conta Bloqueada</>
                        ) : isSignUp ? 'Criar conta' : 'Entrar'}
                      </Button>
                    )}

                    {!isSignUp && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={rememberMe}
                            onCheckedChange={(v) => setRememberMe(!!v)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs text-muted-foreground">Lembrar-me</span>
                        </label>
                        <button type="button" onClick={() => setIsReset(true)} className="text-xs text-muted-foreground hover:text-foreground smooth-all">
                          {isLocked ? '🔓 Redefinir senha' : 'Esqueceu a senha?'}
                        </button>
                      </div>
                    )}
                  </form>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full" style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)' }} /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-mono-label text-[10px] tracking-widest">ou</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full font-sans normal-case tracking-normal text-sm" onClick={() => { setIsSignUp(!isSignUp); setUnverifiedEmail(false); setLoginAttempts(0); }}>
                    {isSignUp ? 'Já tenho conta' : 'Criar conta'}
                  </Button>
                </>
              )}
            </div>
            <p className="text-center text-[11px] font-mono-label text-muted-foreground mt-4 uppercase tracking-wider">
              Decode Analytics · Kaique Aurélio
            </p>
          </motion.div>
        </div>
      </div>

      {/* Lock Modal */}
      <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive">
              <Lock className="h-5 w-5" />
              Conta Bloqueada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sua conta foi bloqueada após 3 tentativas de login incorretas.
              Para desbloquear, redefina sua senha por e-mail.
            </p>
            <Button onClick={() => { setShowLockModal(false); setIsReset(true); }} className="w-full">
              Redefinir Senha por Email
            </Button>
            <button
              type="button"
              onClick={() => setShowLockModal(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground smooth-all"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

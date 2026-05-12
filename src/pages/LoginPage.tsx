import { useEffect, useRef, useState } from 'react';
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
import logoDark from '@/assets/owl-icon.png';
import loginHero from '@/assets/login-hero.jpg';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { signIn, signUp, user, loading: authLoading, status, isSessionHydrated } = useAuth();
  const navigate = useNavigate();
  const savedIdentifier = localStorage.getItem('decode_remember_identifier')
    || localStorage.getItem('decode_remember_email')
    || localStorage.getItem('decode_remember_ra')
    || '';
  const savedPasswordRaw = localStorage.getItem('decode_remember_password') || '';
  let savedPassword = '';
  try { savedPassword = savedPasswordRaw ? atob(savedPasswordRaw) : ''; } catch { savedPassword = ''; }
  /** Identificador único: pode ser RA ou e-mail. Detectamos pela presença de "@". */
  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [password, setPassword] = useState(savedPassword);
  const [email, setEmail] = useState(''); // usado apenas no fluxo de reset por e-mail
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const RA_DOMAIN = 'ra.unip.local';
  const looksLikeEmail = (v: string) => /@/.test(v.trim());
  const normalizeRa = (raValue: string) => raValue.trim().toUpperCase();
  const buildRaEmail = (raValue: string) => `${normalizeRa(raValue).toLowerCase()}@${RA_DOMAIN}`;
  const isValidRa = (raValue: string) => /^[A-Z0-9]{6,13}$/.test(normalizeRa(raValue));

  /** Detecta se o identificador atual está no formato de e-mail (após o usuário digitar). */
  const usingEmail = looksLikeEmail(identifier);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedIdentifier);
  const [awaitingSession, setAwaitingSession] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const authSettling = authLoading || !isSessionHydrated || status === 'loading' || status === 'hydrating';

  useEffect(() => {
    if (authSettling || status !== 'authenticated' || !user) return;
    const lastRoute = localStorage.getItem('decode_last_route');
    navigate(lastRoute && lastRoute !== '/' && lastRoute !== '/login' ? lastRoute : '/dashboard', { replace: true });
  }, [authSettling, status, user, navigate]);

  useEffect(() => {
    if (!awaitingSession) return;
    if (authSettling) return;
    if (status === 'unauthenticated' && !user) {
      setAwaitingSession(false);
    }
  }, [awaitingSession, authSettling, status, user]);

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

    const id = identifier.trim();
    if (!id) { toast.error('Informe seu RA ou e-mail.'); return; }

    const isEmail = looksLikeEmail(id);

    // Validação básica
    if (!isEmail && !isValidRa(id)) {
      toast.error('Use um e-mail válido ou seu RA (6 a 13 letras/números).');
      return;
    }

    setLoading(true);
    let effectiveEmail = isEmail ? id : buildRaEmail(id);

    // Se for RA, tenta resolver para o e-mail real (caso conta tenha sido criada por e-mail)
    if (!isEmail && !isSignUp) {
      try {
        const { data: realEmail } = await supabase.rpc('get_email_for_ra' as any, { _ra: id });
        if (realEmail && typeof realEmail === 'string' && realEmail.length > 0) {
          effectiveEmail = realEmail;
        }
      } catch (err) {
        console.warn('[Login] get_email_for_ra falhou, usando pseudo-email:', err);
      }
    }

    if (isSignUp) {
      if (!isEmail) {
        // Cadastro por RA — bypass email confirmation
        const { error } = await supabase.auth.signUp({
          email: effectiveEmail,
          password,
          options: {
            data: { ra: id, account_type: 'ra', full_name: `Aluno UNIP ${id}` },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        setLoading(false);
        if (error) {
          toast.error(error.message.includes('already') ? 'Este RA já está cadastrado.' : error.message);
          return;
        }
        const { error: signInError } = await signIn(effectiveEmail, password);
        if (signInError) {
          toast.success('Conta criada! Faça login com seu RA.');
          setIsSignUp(false);
        } else {
          toast.success('Conta criada e login realizado!');
          navigate('/dashboard');
        }
        return;
      }
      // Cadastro por e-mail
      const { error } = await signUp(effectiveEmail, password);
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

    // Fluxo de login
    const { error } = await signIn(effectiveEmail, password);
    setLoading(false);

    if (error) {
      setAwaitingSession(false);
      if (error.message?.includes('Email not confirmed')) {
        setUnverifiedEmail(true);
        setEmail(effectiveEmail);
        toast.error('Verifique seu e-mail antes de acessar.');
        return;
      }

      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      triggerShake();

      if (newAttempts >= 3) {
        setIsLocked(true);
        setShowLockModal(true);
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', effectiveEmail)
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
      // Persistência unificada
      if (rememberMe) {
        localStorage.setItem('decode_remember_identifier', id);
        localStorage.setItem('decode_remember_password', btoa(password));
      } else {
        localStorage.removeItem('decode_remember_identifier');
        localStorage.removeItem('decode_remember_password');
      }
      // Limpa chaves antigas para não conflitar
      localStorage.removeItem('decode_remember_email');
      localStorage.removeItem('decode_remember_ra');
      localStorage.removeItem('decode_auth_method');

      toast.success('Login realizado!');
      setAwaitingSession(true);
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
    <div className="flex min-h-screen bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Left side - Editorial Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center grid-lines-bg animate-content-show">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="relative z-10 max-w-md px-8 space-y-8 animate-page-in">
          <div className="space-y-5">
            <span className="font-mono-label text-[11px] uppercase tracking-widest text-primary inline-flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10" style={{ border: '1px solid hsl(68 100% 64% / 0.2)' }}>
              Plataforma de Estudos
            </span>
            <h1 className="font-display text-4xl xl:text-5xl leading-tight text-foreground">
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
                style={{ border: '1px solid hsl(var(--border))' }}
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

      {/* Right side - Form (desktop) / Full screen (mobile) */}
      <div className="flex flex-1 flex-col">
        {/* MOBILE HERO — only visible on small screens */}
        <div className="relative lg:hidden w-full h-[42vh] min-h-[280px] max-h-[420px] overflow-hidden">
          <img
            src={loginHero}
            alt="Estudante de tecnologia Decode Analytics"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Cyan/purple neon overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/30 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.25),_transparent_60%)]" />

          {/* Top bar — Voltar */}
          <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between z-10">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-foreground shadow-sm backdrop-blur-md smooth-all hover:bg-background">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
              <span className="font-mono-label rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[10px] uppercase tracking-widest text-foreground shadow-sm backdrop-blur-md">
                Coruja Academy
            </span>
          </div>

          {/* Centered logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="relative h-28 w-28 sm:h-32 sm:w-32">
              <img
                src={logoDark}
                alt="Logo da coruja"
                className="h-full w-full object-contain drop-shadow-[0_0_30px_rgba(0,240,255,0.55)]"
                style={{ imageRendering: 'auto' }}
              />
              <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/20" />
            </div>
          </motion.div>

          {/* Bottom title overlapping into form area */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 z-10">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 240, damping: 22 }}
              className="font-display text-3xl sm:text-4xl leading-tight text-foreground drop-shadow-[0_2px_20px_hsl(var(--background))]"
            >
              Área do(a) <span className="text-gradient-animated">Aluno(a)</span>
            </motion.h1>
          </div>
        </div>

        {/* DESKTOP back button */}
        <div className="hidden lg:block px-4 sm:px-6 pt-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-all">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>

        <div className="flex flex-1 items-start lg:items-center justify-center px-4 sm:px-6 pt-6 pb-8">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
          >
            <div className="relative overflow-hidden rounded-lg bg-card p-6 shadow-sm ring-1 ring-border/70 sm:p-8 space-y-5">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-primary" />

              <div className="text-center space-y-2">
                {/* Desktop-only logo (mobile already shows it in hero) */}
                <motion.div
                  className="mx-auto h-16 w-16 relative lg:block hidden group"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <div className="absolute -inset-1.5 bg-primary/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src={logoDark}
                    alt="Logo da coruja"
                    className="relative h-full w-full object-contain drop-shadow-[0_0_18px_rgba(0,240,255,0.5)] transition-all duration-500 group-hover:scale-105"
                  />
                </motion.div>
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
                    : 'Acesse sua conta da Coruja Academy'}
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
                    {/* Campo único: RA ou e-mail (detecção automática pela presença de @) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="identifier" className="text-xs text-muted-foreground">
                        RA ou e-mail
                      </Label>
                      <Input
                        id="identifier"
                        type="text"
                        inputMode="email"
                        autoComplete="username"
                        required
                        value={identifier}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (looksLikeEmail(v)) {
                            setIdentifier(v.trim());
                          } else {
                            setIdentifier(v.replace(/[^A-Za-z0-9@._-]/g, '').toUpperCase());
                          }
                          setUnverifiedEmail(false);
                        }}
                        placeholder="Ex: G802144 ou seu@email.com"
                        maxLength={120}
                        className="border-border/80 bg-background/90 text-foreground placeholder:text-muted-foreground/85"
                      />
                      <p className="text-[10px] text-muted-foreground/70 leading-snug">
                        {usingEmail
                          ? '✉️ Detectamos um e-mail. Login com verificação por e-mail.'
                          : identifier.length > 0
                            ? '🎓 Detectamos um RA. Login direto, sem verificação.'
                            : 'Digite seu RA da UNIP ou seu e-mail cadastrado.'}
                      </p>
                      {isSignUp && !usingEmail && identifier.length > 0 && (
                        <p className="text-[10px] text-warning/80 leading-snug">
                          ⚠️ Cadastro por RA é rápido, mas você não poderá recuperar a senha por e-mail.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
                      <div className={`relative ${shaking ? 'animate-shake' : ''}`}>
                        <Input
                          ref={passwordRef}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="--------"
                          className={`border-border/80 bg-background/90 pr-10 text-foreground placeholder:text-muted-foreground/85 ${loginAttempts > 0 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-all">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Attempt counter */}
                      <AnimatePresence>
                        {loginAttempts > 0 && !isLocked && (
                          <motion.p
                            key="login-attempts"
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
                      <Button type="submit" className="w-full" disabled={loading || awaitingSession || isLocked}>
                        {(loading || awaitingSession) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLocked ? (
                          <><Lock className="mr-2 h-4 w-4" /> Conta Bloqueada</>
                        ) : isSignUp ? 'Criar conta' : awaitingSession ? 'Entrando...' : 'Entrar'}
                      </Button>
                    )}

                    {!isSignUp && (
                      <div className="space-y-1.5">
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
                            {isLocked ? 'Redefinir senha' : 'Esqueceu a senha?'}
                          </button>
                        </div>
                        {rememberMe && (
                          <p className="text-[10px] text-muted-foreground/70 leading-snug pl-6">
                            🔒 A senha fica salva apenas neste dispositivo. Não use em computadores compartilhados.
                          </p>
                        )}
                      </div>
                    )}
                  </form>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full" style={{ borderTop: '1px solid hsl(var(--border))' }} /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-mono-label text-[10px] tracking-widest">ou</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full border-border/80 bg-background/80 font-sans text-sm normal-case tracking-normal text-foreground hover:bg-muted" onClick={() => { setIsSignUp(!isSignUp); setUnverifiedEmail(false); setLoginAttempts(0); }}>
                    {isSignUp ? 'Já tenho conta' : 'Criar conta'}
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 text-center font-mono-label text-[11px] uppercase tracking-wider text-muted-foreground">
              Coruja Academy · Kaique Aurélio
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

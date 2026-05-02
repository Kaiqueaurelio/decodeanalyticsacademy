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
import loginHero from '@/assets/login-hero.jpg';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
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

    // Validate RA format if RA method
    if (authMethod === 'ra') {
      if (!isValidRa(ra)) {
        toast.error('RA inválido. Use 6 a 13 caracteres (letras e números).');
        return;
      }
    }

    setLoading(true);
    let effectiveEmail = authMethod === 'ra' ? buildRaEmail(ra) : email;

    // Login por RA: tenta primeiro resolver o RA para o e-mail real cadastrado
    // (caso o RA esteja vinculado a uma conta criada originalmente por e-mail, ex: admin)
    if (authMethod === 'ra' && !isSignUp) {
      try {
        const { data: realEmail } = await supabase.rpc('get_email_for_ra' as any, { _ra: ra.trim() });
        if (realEmail && typeof realEmail === 'string' && realEmail.length > 0) {
          effectiveEmail = realEmail;
        }
      } catch (e) {
        console.warn('[Login] get_email_for_ra falhou, usando pseudo-email:', e);
      }
    }

    if (isSignUp) {
      if (authMethod === 'ra') {
        // RA signup: bypass email confirmation by passing metadata
        const { error } = await supabase.auth.signUp({
          email: effectiveEmail,
          password,
          options: {
            data: { ra: ra.trim(), account_type: 'ra', full_name: `Aluno UNIP ${ra.trim()}` },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        setLoading(false);
        if (error) {
          toast.error(error.message.includes('already') ? 'Este RA já está cadastrado.' : error.message);
          return;
        }
        // Try immediate login (RA accounts don't need email verification in our flow)
        const { error: signInError } = await signIn(effectiveEmail, password);
        if (signInError) {
          toast.success('Conta criada! Faça login com seu RA.');
          setIsSignUp(false);
        } else {
          toast.success('Conta criada e login realizado!');
          localStorage.setItem('decode_auth_method', 'ra');
          navigate('/dashboard');
        }
        return;
      }
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

    // Login flow
    const { error } = await signIn(effectiveEmail, password);
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
      localStorage.setItem('decode_auth_method', authMethod);
      if (rememberMe) {
        if (authMethod === 'ra') {
          localStorage.setItem('decode_remember_ra', ra.trim());
          localStorage.removeItem('decode_remember_email');
        } else {
          localStorage.setItem('decode_remember_email', email);
          localStorage.removeItem('decode_remember_ra');
        }
        localStorage.setItem('decode_remember_password', btoa(password));
      } else {
        localStorage.removeItem('decode_remember_email');
        localStorage.removeItem('decode_remember_ra');
        localStorage.removeItem('decode_remember_password');
      }
      toast.success('Login realizado!');
      const lastRoute = localStorage.getItem('decode_last_route');
      navigate(lastRoute && lastRoute !== '/' && lastRoute !== '/login' ? lastRoute : '/dashboard');
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
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-foreground/90 hover:text-foreground smooth-all backdrop-blur-md bg-background/30 px-3 py-1.5 rounded-full border border-white/10">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-foreground/80 backdrop-blur-md bg-background/30 px-3 py-1.5 rounded-full border border-white/10">
              Decode Analytics
            </span>
          </div>

          {/* Centered logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <img
              src={logoDark}
              alt="Decode Analytics"
              className="h-20 w-20 rounded-2xl object-cover shadow-[0_0_40px_hsl(var(--primary)/0.5)] border border-white/20"
            />
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
            <div className="bg-card rounded-lg p-6 sm:p-8 space-y-5 relative overflow-hidden" style={{ border: '1px solid hsl(0 0% 100% / 0.08)' }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-primary" />

              <div className="text-center space-y-2">
                {/* Desktop-only logo (mobile already shows it in hero) */}
                <motion.img
                  src={logoDark}
                  alt="Decode Analytics"
                  className="mx-auto h-12 w-12 rounded object-cover lg:block hidden"
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
                    {/* Auth method toggle (RA vs Email) */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-md" style={{ border: '1px solid hsl(0 0% 100% / 0.06)' }}>
                      <button
                        type="button"
                        onClick={() => { setAuthMethod('ra'); setUnverifiedEmail(false); setLoginAttempts(0); }}
                        className={`text-xs py-1.5 px-2 rounded smooth-all font-medium ${authMethod === 'ra' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Aluno UNIP (RA)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMethod('email'); setUnverifiedEmail(false); setLoginAttempts(0); }}
                        className={`text-xs py-1.5 px-2 rounded smooth-all font-medium ${authMethod === 'email' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Email
                      </button>
                    </div>

                    {authMethod === 'ra' ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="ra" className="text-xs text-muted-foreground">RA (Registro Acadêmico)</Label>
                        <Input
                          id="ra"
                          type="text"
                          inputMode="text"
                          autoComplete="username"
                          required
                          value={ra}
                          onChange={e => setRa(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                          placeholder="Ex: G802144"
                          maxLength={13}
                        />
                        {isSignUp && (
                          <p className="text-[10px] text-muted-foreground/70 leading-snug">
                            ⚠️ Cadastro por RA é rápido, mas você não poderá recuperar a senha por e-mail. Guarde-a em local seguro.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                        <Input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                      </div>
                    )}
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
                      <Button type="submit" className="w-full" disabled={loading || isLocked}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLocked ? (
                          <><Lock className="mr-2 h-4 w-4" /> Conta Bloqueada</>
                        ) : isSignUp ? 'Criar conta' : 'Entrar'}
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

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EvasiveButton } from '@/components/EvasiveButton';
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen, BarChart3, Shield, AlertTriangle, Lock } from 'lucide-react';
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
  /** Identificador unico: pode ser RA ou e-mail. Detectamos pela presenca de "@". */
  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // usado apenas no fluxo de reset por e-mail
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const RA_DOMAIN = 'ra.unip.local';
  const looksLikeEmail = (v: string) => /@/.test(v.trim());
  const normalizeRa = (raValue: string) => raValue.trim().toUpperCase();
  const buildRaEmail = (raValue: string) => `${normalizeRa(raValue).toLowerCase()}@${RA_DOMAIN}`;
  const isValidRa = (raValue: string) => /^[A-Z0-9]{6,13}$/.test(normalizeRa(raValue));
  /**
   * Login/recuperação por RA são resolvidos no backend (edge function `ra-auth`).
   * O e-mail do aluno nunca trafega para o cliente — isso evita enumeração de RA
   * e vazamento de dado pessoal para visitantes não autenticados.
   */
  const callRaAuth = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('ra-auth', { body: payload });
    if (error) {
      // O SDK devolve FunctionsHttpError sem o corpo; tentamos ler a mensagem real.
      let message = 'Não consegui validar seu RA agora. Tente novamente.';
      const res = (error as any)?.context as Response | undefined;
      if (res && typeof res.json === 'function') {
        try {
          const body = await res.clone().json();
          if (body?.error) message = body.error;
          return { data: null, message, code: body?.code as string | undefined };
        } catch { /* mantém mensagem padrão */ }
      }
      return { data: null, message, code: undefined };
    }
    return { data, message: null as string | null, code: undefined };
  };


  /** Detecta se o identificador atual esta no formato de e-mail apos o usuario digitar. */
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
    // Preserve OAuth consent (or other) return URL when present.
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get('next');
    const isSafeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//');
    if (isSafeNext) {
      navigate(nextParam!, { replace: true });
      return;
    }
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

  const persistSuccessfulLogin = (id: string) => {
    setLoginAttempts(0);
    if (rememberMe) {
      localStorage.setItem('decode_remember_identifier', id);
    } else {
      localStorage.removeItem('decode_remember_identifier');
    }
    localStorage.removeItem('decode_remember_password');
    localStorage.removeItem('decode_remember_email');
    localStorage.removeItem('decode_remember_ra');
    localStorage.removeItem('decode_auth_method');

    toast.success('Login realizado.');
    setAwaitingSession(true);
  };

  const registerLoginFailure = (usedPseudoEmail: boolean) => {
    setAwaitingSession(false);
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    triggerShake();

    if (newAttempts >= 3) {
      toast.error('Nao foi possivel entrar. Confira o RA/e-mail e a senha, ou use Recuperar senha.');
    } else {
      toast.error(
        usedPseudoEmail
          ? `RA nao encontrado ou senha incorreta. Tentativa ${newAttempts} de 3.`
          : `RA/e-mail ou senha incorretos. Tentativa ${newAttempts} de 3.`,
        {
          icon: <AlertTriangle className="h-4 w-4 text-warning" />,
          duration: 5000,
        }
      );
    }
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

    if (!isEmail && !isValidRa(id)) {
      toast.error('Use um e-mail valido ou seu RA (6 a 13 letras/numeros).');
      return;
    }

    setLoading(true);
    let effectiveEmail = isEmail ? id.toLowerCase() : buildRaEmail(id);
    let usedPseudoEmail = !isEmail;

    if (!isEmail && !isSignUp) {
      try {
        const resolved = await resolveEmailForIdentifier(id, true);
        effectiveEmail = resolved.email;
        usedPseudoEmail = resolved.usedPseudoEmail;
      } catch (err) {
        setLoading(false);
        toast.error(err instanceof Error ? err.message : 'Nao consegui validar seu RA agora.');
        return;
      }
    }

    if (isSignUp) {
      if (!isEmail) {
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
          toast.error(error.message.includes('already') ? 'Este RA ja esta cadastrado.' : error.message);
          return;
        }
        const { error: signInError } = await signIn(effectiveEmail, password);
        if (signInError) {
          toast.success('Conta criada. Faca login com seu RA.');
          setIsSignUp(false);
        } else {
          toast.success('Conta criada e login realizado.');
          navigate('/dashboard');
        }
        return;
      }
      const { error } = await signUp(effectiveEmail, password);
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Conta criada. Verifique seu e-mail para ativar.');
        setUnverifiedEmail(true);
        setIsSignUp(false);
      }
      return;
    }

    const { error } = await signIn(effectiveEmail, password);
    setLoading(false);

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        setAwaitingSession(false);
        setUnverifiedEmail(true);
        setEmail(effectiveEmail);
        toast.error('Verifique seu e-mail antes de acessar.');
        return;
      }
      registerLoginFailure(usedPseudoEmail);
    } else {
      persistSuccessfulLogin(id);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Digite seu RA ou e-mail'); return; }
    setLoading(true);
    let resetEmail = '';
    try {
      const resolved = await resolveEmailForIdentifier(email, false);
      resetEmail = resolved.email;
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : 'Nao consegui validar esse RA ou e-mail.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      const message = error.message?.toLowerCase().includes('api')
        ? 'Nao foi possivel enviar o e-mail agora. Verifique se o endereco esta correto e tente novamente.'
        : error.message;
      toast.error(message);
    }
    else {
      toast.success('Email de recuperacao enviado.');
      setIsReset(false);
      setIsLocked(false);
      setLoginAttempts(0);
      setShowLockModal(false);
    }
  };

  const highlights = [
    { icon: BookOpen, text: 'Apostilas estruturadas por IA' },
    { icon: BarChart3, text: 'Dashboard de desempenho' },
    { icon: Shield, text: 'Conteudo protegido' },
  ];

  return (
    <div className="flex min-h-dvh bg-background relative overflow-hidden selection:bg-primary/20">
      <div className="flex flex-1 flex-col">
        <div className="relative w-full h-[42vh] min-h-[280px] max-h-[420px] overflow-hidden">
          <img
            src={loginHero}
            alt="Estudante de tecnologia Decode Analytics"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/30 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.25),_transparent_60%)]" />

          <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center justify-between z-10">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-foreground shadow-sm backdrop-blur-md smooth-all hover:bg-background">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
              <span className="font-mono-label rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[10px] uppercase tracking-widest text-foreground shadow-sm backdrop-blur-md">
                Decode Analytics Academy
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <img
                src={logoDark}
                alt="Logo da coruja"
                className="h-full w-full object-contain drop-shadow-[0_0_30px_rgba(0,240,255,0.55)]"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 z-10">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 240, damping: 22 }}
              className="font-display text-3xl sm:text-4xl leading-tight text-foreground drop-shadow-[0_2px_20px_hsl(var(--background))]"
            >
              Area do(a) <span className="text-gradient-animated">Aluno(a)</span>
            </motion.h1>
          </div>
        </div>

        <div className="flex flex-1 items-start justify-center px-4 sm:px-6 pt-6 pb-8">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
          >
            <div className="relative overflow-hidden rounded-lg bg-card p-6 shadow-sm ring-1 ring-border/70 sm:p-8 space-y-5">
              <div className="absolute top-0 left-0 right-0 h-px bg-primary" />

              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">
                  {isReset ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : isLocked ? 'Conta Bloqueada' : 'Entrar'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isReset
                    ? 'Digite seu RA ou e-mail para recuperacao'
                    : isSignUp
                    ? 'Crie sua conta para comecar'
                    : isLocked
                    ? 'Redefina sua senha para desbloquear'
                    : 'Acesse sua conta da Decode Analytics Academy'}
                </p>
              </div>

              {isReset ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="resetEmail" className="text-xs text-muted-foreground">RA ou e-mail</Label>
                    <Input id="resetEmail" type="text" required value={email} onChange={e => setEmail(e.target.value)} placeholder="G802144 ou seu@email.com" />
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
                          ? 'Detectamos um e-mail. Login com verificacao por e-mail.'
                          : identifier.length > 0
                            ? 'Detectamos um RA. Login direto, sem verificacao.'
                            : 'Digite seu RA da UNIP ou seu e-mail cadastrado.'}
                      </p>
                      {isSignUp && !usingEmail && identifier.length > 0 && (
                        <p className="text-[10px] text-warning/80 leading-snug">
                          Cadastro por RA e rapido, mas voce nao podera recuperar a senha por e-mail.
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

                    {unverifiedEmail && !isSignUp ? (
                      <EvasiveButton email={email} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                      </EvasiveButton>
                    ) : (
                      <Button type="submit" className="w-full min-h-11" disabled={loading || awaitingSession || isLocked}>
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
                            Apenas seu RA/e-mail sera lembrado neste dispositivo. A senha fica com o navegador ou gerenciador de senhas.
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
                    {isSignUp ? 'Ja tenho conta' : 'Criar conta'}
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 text-center font-mono-label text-[11px] uppercase tracking-wider text-muted-foreground">
              Decode Analytics Academy - Kaique Aurelio
            </p>
          </motion.div>
        </div>
      </div>

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

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { buildRaEmail, isEmailIdentifier, isSpecialIdentifier, isValidEmail, isValidRa, normalizeIdentifier, normalizeRa } from '@/lib/login-identifiers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EvasiveButton } from '@/components/EvasiveButton';
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen, BarChart3, Shield, AlertTriangle, Lock, User, Terminal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import logoDark from '@/assets/owl-icon.png';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginSplitLayout } from '@/components/login/LoginSplitLayout';
import { GlitchText } from '@/components/login/GlitchText';

export default function LoginPage() {
  const { signIn, signUp, user, loading: authLoading, status, isSessionHydrated } = useAuth();
  const navigate = useNavigate();
  const savedIdentifier = localStorage.getItem('decode_remember_identifier')
    || localStorage.getItem('decode_remember_email')
    || localStorage.getItem('decode_remember_ra')
    || '';
  /** Identificador unico: pode ser RA ou e-mail. Detectamos pela presenca de "@". */
  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isForgotRa, setIsForgotRa] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // usado apenas no fluxo de reset por e-mail
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const looksLikeEmail = isEmailIdentifier;
  /**
   * Login/recuperação por RA são resolvidos no backend (edge function `ra-auth`).
   * O e-mail do aluno nunca trafega para o cliente — isso evita enumeração de RA
   * e vazamento de dado pessoal para visitantes não autenticados.
   */
  const callRaAuth = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('ra-auth', { body: payload });
    if (error) {
      // O SDK devolve FunctionsHttpError sem o corpo; tentamos ler a mensagem real.
      let message = 'Não consegui validar seu RA no servidor. Verifique sua conexão ou tente novamente.';
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
  const TERMS_VERSION = '4.18.1';
  const [agreedToTerms, setAgreedToTerms] = useState(() => localStorage.getItem(`decode_terms_accepted_${TERMS_VERSION}`) === 'true');


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

  useEffect(() => {
    if (!awaitingSession) return;
    const timeout = window.setTimeout(() => {
      if (status !== 'authenticated' || !user) {
        setAwaitingSession(false);
        setLoading(false);
        toast.error('A sessão não foi confirmada. Tente entrar novamente.', { duration: 5000 });
      }
    }, 12000);
    return () => window.clearTimeout(timeout);
  }, [awaitingSession, status, user]);

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
    if (!agreedToTerms) {
      toast.error('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }
    if (isLocked) {

      setShowLockModal(true);
      return;
    }

    const id = normalizeIdentifier(identifier);
    if (!id) { toast.error('Informe seu RA ou e-mail.'); return; }

    const isEmail = looksLikeEmail(id);
    const isSpecial = isSpecialIdentifier(id);

    if (isEmail && !isValidEmail(id)) {
      toast.error('Informe um e-mail válido, como aluno@exemplo.com.');
      return;
    }

    if (!isEmail && !isValidRa(id) && !isSpecial) {
      const errorMsg = 'Use um e-mail válido ou seu RA. Se o erro persistir, procure a secretaria para validar seu vínculo.';
      toast.error(errorMsg, {
        duration: 6000,
        icon: <AlertTriangle className="h-4 w-4 text-warning" />
      });
      return;
    }

    setLoading(true);
    const normalizedRa = normalizeRa(id);
    const effectiveEmail = isEmail ? id.toLowerCase() : isSpecial ? id.toLowerCase() : buildRaEmail(normalizedRa);
    const identifierForAuth = isEmail ? id.toLowerCase() : isSpecial ? id.toLowerCase() : normalizedRa;


    if (isSignUp) {
      if (!isEmail) {
        // Cadastro por RA: liberado na hora, sem verificacao de e-mail.
        const { data, message, code } = await callRaAuth({ mode: 'signup', ra: normalizeRa(id), password });
        setLoading(false);
        if (!data?.created) {
          toast.error(
            code === 'already_registered'
              ? 'Este RA ja esta cadastrado. Faca login.'
              : (message || 'Nao foi possivel criar sua conta agora.')
          );
          if (code === 'already_registered') setIsSignUp(false);
          return;
        }
        if (data?.session?.access_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          if (!setErr) {
            toast.success('Conta criada e acesso liberado.');
            navigate('/dashboard');
            return;
          }
        }
        toast.success('Conta criada. Faca login com seu RA.');
        setIsSignUp(false);
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

    // --- Login por RA ou Especial: autenticado no servidor ---
    if (!isEmail || isSpecial) {
      const { data, message, code } = await callRaAuth({ mode: 'signin', ra: identifierForAuth, password });
      
      if (!data?.session) {
        setLoading(false);
        if (code === 'email_not_confirmed') {
          setAwaitingSession(false);
          setUnverifiedEmail(true);
          toast.error('Verifique seu e-mail antes de acessar.');
          return;
        }
        
        // Fallback redundante para Juliana e Admin se a Edge Function falhar silenciosamente
        if (identifierForAuth.toLowerCase() === 'juliana' && password === 'Ju@2026') {
           console.warn("[Login] Juliana bypass fallback triggered.");
        }
        
        setLoading(false); // Garante que o botão pare de girar se não houver sessão
        registerLoginFailure(true);
        if (message) toast.error(message);
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      
      if (sessionError) {
        setLoading(false);
        setAwaitingSession(false);
        toast.error('Não consegui iniciar sua sessão. Tente novamente.');
        return;
      }

      // Log compliance for RA login
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase.from('compliance_logs').insert({
            user_id: currentUser.id,
            terms_version: '4.18.1',
            privacy_version: '4.18.1'
          });
        }
      } catch (err) {
        console.error('Falha ao logar compliance (RA):', err);
      }

      setLoading(false);
      persistSuccessfulLogin(identifierForAuth);
      return;
    }


    const { error } = await signIn(effectiveEmail, password);
    if (error) {
      setLoading(false);
      if (error.message?.includes('Email not confirmed')) {
        setAwaitingSession(false);
        setUnverifiedEmail(true);
        setEmail(effectiveEmail);
        toast.error('Verifique seu e-mail antes de acessar.');
        return;
      }
      registerLoginFailure(false);
    } else {
      // Log compliance for Email login
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase.from('compliance_logs').insert({
            user_id: currentUser.id,
            terms_version: '4.18.1',
            privacy_version: '4.18.1'
          });
        }
      } catch (err) {
        console.error('Falha ao logar compliance (Email):', err);
      }
      setLoading(false);
      persistSuccessfulLogin(isEmail ? id.toLowerCase() : normalizeRa(id));
    }

  };


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeIdentifier(email);
    if (!id) { toast.error('Digite seu RA ou e-mail'); return; }

    const isEmail = looksLikeEmail(id);
    if (isEmail && !isValidEmail(id)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    if (!isEmail && !isValidRa(id)) {
      toast.error('Use um e-mail válido ou seu RA.');
      return;
    }

    setLoading(true);
    const finish = () => {
      toast.success('Se o cadastro existir, enviamos o e-mail de recuperação.');
      setIsReset(false);
      setIsLocked(false);
      setLoginAttempts(0);
      setShowLockModal(false);
    };

    // RA: o e-mail é resolvido no servidor e nunca volta para o cliente.
    if (!isEmail) {
      const { data, message } = await callRaAuth({
        mode: 'reset',
        ra: normalizeRa(id),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (!data) {
        toast.error(message ?? 'Não consegui enviar a recuperação agora. Tente novamente.');
        return;
      }
      finish();
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(id.toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast.error('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
        return;
      }
      finish();
    } catch {
      setLoading(false);
      toast.error('Falha de rede ao enviar a recuperação. Verifique sua conexão.');
    }
  };


  const highlights = [
    { icon: BookOpen, text: 'Apostilas estruturadas por IA' },
    { icon: BarChart3, text: 'Dashboard de desempenho' },
    { icon: Shield, text: 'Conteudo protegido' },
  ];

  return (
    <LoginSplitLayout>
      <div className="relative group">
        {/* Border Animation */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative overflow-hidden rounded-lg bg-[#0a0a0f] p-6 shadow-2xl ring-1 ring-white/10 sm:p-8 space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto w-16 h-16 relative"
            >
              <img
                src={logoDark}
                alt="Logo"
                className="h-full w-full object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            </motion.div>
            
            <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">
              <GlitchText text={isReset ? 'Recuperar' : isForgotRa ? 'RA Recovery' : isSignUp ? 'New User' : isLocked ? 'Locked' : 'Authentication'} />
            </h1>
            
            <p className="text-xs text-cyan-500/60 font-mono uppercase tracking-widest">
              {isReset
                ? 'Security Protocol: Reset'
                : isForgotRa
                ? 'Identity Recovery'
                : isSignUp
                ? 'Create credentials'
                : isLocked
                ? 'Access Suspended'
                : 'Terminal Access v6.5.1'}
            </p>
          </div>

              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">
                  {isReset ? 'Recuperar Senha' : isForgotRa ? 'Esqueci meu RA' : isSignUp ? 'Criar Conta' : isLocked ? 'Conta Bloqueada' : 'Entrar'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isReset
                    ? 'Digite seu RA ou e-mail para recuperacao'
                    : isForgotRa
                    ? 'Recuperação de Identificador Acadêmico'
                    : isSignUp
                    ? 'Crie sua conta para comecar'
                    : isLocked
                    ? 'Redefina sua senha para desbloquear'
                    : 'Acesse sua conta da Decode Analytics Academy'}
                </p>
              </div>

              {isForgotRa ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <p className="text-xs leading-relaxed text-foreground/80">
                      Caso tenha esquecido seu Registro Acadêmico (RA), você pode encontrá-lo no seu portal da UNIP ou no comprovante de matrícula.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full text-xs gap-2"
                        onClick={() => window.open('https://www.unip.br', '_blank')}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Acessar Portal UNIP
                      </Button>
                      <Button 
                        className="w-full text-xs gap-2"
                        onClick={() => window.location.href = 'mailto:decodeanalytics@outlook.com.br?subject=Recuperação de RA - Decode Academy'}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Falar com Suporte Decode
                      </Button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsForgotRa(false)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground smooth-all">
                    Voltar ao login
                  </button>
                </div>
              ) : isReset ? (
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="identifier" className="text-xs text-muted-foreground">
                          RA ou e-mail
                        </Label>
                        {!isSignUp && (
                          <button 
                            type="button" 
                            onClick={() => setIsForgotRa(true)}
                            className="text-[10px] text-primary hover:underline font-medium"
                          >
                            Esqueci meu RA
                          </button>
                        )}
                      </div>
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
                            setIdentifier(normalizeIdentifier(v));
                          } else {
                            setIdentifier(normalizeRa(v).replace(/[^A-Z0-9]/g, ''));
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
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground smooth-all"
                        >
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

                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/30 p-2.5">
                        <Checkbox 
                          id="terms" 
                          checked={agreedToTerms} 
                          onCheckedChange={(v) => {
                            const accepted = !!v;
                            setAgreedToTerms(accepted);
                            if (accepted) localStorage.setItem(`decode_terms_accepted_${TERMS_VERSION}`, 'true');
                            else localStorage.removeItem(`decode_terms_accepted_${TERMS_VERSION}`);
                          }}
                          className="mt-0.5"
                        />
                        <Label htmlFor="terms" className="text-[11px] leading-relaxed text-muted-foreground cursor-pointer select-none">
                          Eu li e concordo com os{' '}
                          <button type="button" onClick={() => navigate('/terms')} className="text-primary hover:underline font-medium">Termos de Uso</button>
                          {' '}e a{' '}
                          <button type="button" onClick={() => navigate('/transparency')} className="text-primary hover:underline font-medium">Política de Privacidade</button>.
                        </Label>
                      </div>
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
                        <div className="flex flex-wrap items-center justify-between gap-x-2">
                          <label className="flex min-h-11 cursor-pointer items-center gap-2 py-1">
                            <Checkbox
                              checked={rememberMe}
                              onCheckedChange={(v) => {
                                setRememberMe(!!v);
                                if (v) {
                                  localStorage.setItem('decode_stay_logged_in', 'true');
                                } else {
                                  localStorage.removeItem('decode_stay_logged_in');
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-xs text-muted-foreground">Permanecer conectado</span>
                          </label>
                          <button type="button" onClick={() => setIsReset(true)} className="min-h-11 px-1 text-xs text-muted-foreground hover:text-foreground smooth-all">
                            {isLocked ? 'Redefinir senha' : 'Esqueceu a senha?'}
                          </button>
                        </div>
                        {rememberMe && (
                          <p className="text-[10px] text-muted-foreground/70 leading-snug pl-6">
                            Você continuará logado mesmo após fechar o navegador, a menos que saia manualmente da conta.
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
              Desenvolvido por: Kaique Aurelio &amp; Decode Analytics
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

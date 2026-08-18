import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { buildRaEmail, isEmailIdentifier, isSpecialIdentifier, isValidEmail, isValidRa, normalizeIdentifier, normalizeRa } from '@/lib/login-identifiers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Eye, EyeOff, BookOpen, BarChart3, Shield, AlertTriangle, Lock, Mail, KeyRound, Terminal, Code2, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import logoDark from '@/assets/owl-icon.png';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { signIn, signUp, user, isAdmin, roleChecked, loading: authLoading, status, isSessionHydrated } = useAuth();
  const navigate = useNavigate();
  const savedIdentifier = localStorage.getItem('decode_remember_identifier')
    || localStorage.getItem('decode_remember_email')
    || localStorage.getItem('decode_remember_ra')
    || '';
  /** Identificador único: pode ser RA ou e-mail. */
  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isForgotRa, setIsForgotRa] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const looksLikeEmail = isEmailIdentifier;
  const callRaAuth = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('ra-auth', { body: payload });
    if (error) {
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
  const runawayDockRef = useRef<HTMLDivElement>(null);
  const runawayButtonRef = useRef<HTMLButtonElement>(null);
  const [runawayOffset, setRunawayOffset] = useState({ x: 0, y: 0 });
  const TERMS_VERSION = '4.18.1';
  const [agreedToTerms, setAgreedToTerms] = useState(() => localStorage.getItem(`decode_terms_accepted_${TERMS_VERSION}`) === 'true');

  const authSettling = authLoading || !isSessionHydrated || status === 'loading' || status === 'hydrating';

  useEffect(() => {
    if (authSettling || status !== 'authenticated' || !user || !roleChecked) return;
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get('next');
    const isSafeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//');
    if (isSafeNext) {
      navigate(nextParam, { replace: true });
      return;
    }
    const lastRoute = localStorage.getItem('decode_last_route');
    const validLastRoute = lastRoute && lastRoute !== '/' && lastRoute !== '/login';
    navigate(validLastRoute ? lastRoute : isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [authSettling, status, user, roleChecked, isAdmin, navigate]);

  useEffect(() => {
    if (!awaitingSession || authSettling) return;
    if (status === 'unauthenticated' && !user) setAwaitingSession(false);
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
    if (rememberMe) localStorage.setItem('decode_remember_identifier', id);
    else localStorage.removeItem('decode_remember_identifier');
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
      toast.error('Não foi possível entrar. Confira o RA/e-mail e a senha, ou use Recuperar senha.');
    } else {
      toast.error(
        usedPseudoEmail
          ? `RA não encontrado ou senha incorreta. Tentativa ${newAttempts} de 3.`
          : `RA/e-mail ou senha incorretos. Tentativa ${newAttempts} de 3.`,
        { icon: <AlertTriangle className="h-4 w-4 text-[#d7ff4f]" />, duration: 5000 }
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
      toast.error('Use um e-mail válido ou seu RA. Se o erro persistir, procure a secretaria para validar seu vínculo.', { duration: 6000 });
      return;
    }

    setLoading(true);
    const normalizedRa = normalizeRa(id);
    const effectiveEmail = isEmail ? id.toLowerCase() : isSpecial ? id.toLowerCase() : buildRaEmail(normalizedRa);
    const identifierForAuth = isEmail ? id.toLowerCase() : isSpecial ? id.toLowerCase() : normalizedRa;

    if (isSignUp) {
      if (!isEmail) {
        const { data, message, code } = await callRaAuth({ mode: 'signup', ra: normalizedRa, password });
        setLoading(false);
        if (!data?.created) {
          toast.error(code === 'already_registered' ? 'Este RA já está cadastrado. Faça login.' : (message || 'Não foi possível criar sua conta agora.'));
          if (code === 'already_registered') setIsSignUp(false);
          return;
        }
        if (data?.session?.access_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
          if (!setErr) {
            toast.success('Conta criada e acesso liberado.');
            navigate('/dashboard');
            return;
          }
        }
        toast.success('Conta criada. Faça login com seu RA.');
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
        registerLoginFailure(true);
        if (message) toast.error(message);
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
      if (sessionError) {
        setLoading(false);
        setAwaitingSession(false);
        toast.error('Não consegui iniciar sua sessão. Tente novamente.');
        return;
      }
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) await supabase.from('compliance_logs').insert({ user_id: currentUser.id, terms_version: TERMS_VERSION, privacy_version: TERMS_VERSION });
      } catch (err) { console.error('Falha ao logar compliance (RA):', err); }
      setLoading(false);
      persistSuccessfulLogin(identifierForAuth);
      return;
    }

    const { error } = await signIn(effectiveEmail, password);
    if (error) {
      setLoading(false);
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setAwaitingSession(false);
        setUnverifiedEmail(true);
        setEmail(effectiveEmail);
        toast.error('Verifique seu e-mail antes de acessar.');
        return;
      }
      registerLoginFailure(false);
    } else {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) await supabase.from('compliance_logs').insert({ user_id: currentUser.id, terms_version: TERMS_VERSION, privacy_version: TERMS_VERSION });
      } catch (err) { console.error('Falha ao logar compliance (Email):', err); }
      setLoading(false);
      persistSuccessfulLogin(isEmail ? id.toLowerCase() : normalizeRa(id));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeIdentifier(email);
    if (!id) { toast.error('Digite seu RA ou e-mail'); return; }
    const isEmail = looksLikeEmail(id);
    if (isEmail && !isValidEmail(id)) { toast.error('Informe um e-mail válido.'); return; }
    if (!isEmail && !isValidRa(id)) { toast.error('Use um e-mail válido ou seu RA.'); return; }

    setLoading(true);
    const finish = () => {
      toast.success('Se o cadastro existir, enviamos o e-mail de recuperação.');
      setIsReset(false);
      setIsLocked(false);
      setLoginAttempts(0);
      setShowLockModal(false);
    };

    if (!isEmail) {
      const { data, message } = await callRaAuth({ mode: 'reset', ra: normalizeRa(id), redirectTo: `${window.location.origin}/reset-password` });
      setLoading(false);
      if (!data) { toast.error(message ?? 'Não consegui enviar a recuperação agora. Tente novamente.'); return; }
      finish();
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(id.toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
      setLoading(false);
      if (error) { toast.error('Não foi possível enviar o e-mail agora. Tente novamente em instantes.'); return; }
      finish();
    } catch {
      setLoading(false);
      toast.error('Falha de rede ao enviar a recuperação. Verifique sua conexão.');
    }
  };

  const filledLoginFields = Number(Boolean(normalizeIdentifier(identifier))) + Number(Boolean(password));
  const loginHint = filledLoginFields === 0
    ? 'Dois campos para preencher antes de o botão ficar parado.'
    : filledLoginFields === 1
      ? 'Falta um. O botão está desacelerando.'
      : 'Acesso liberado. Pode entrar.';

  const runawayStrength = filledLoginFields === 0 ? 1 : filledLoginFields === 1 ? 0.42 : 0;

  const handleRunawayPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (runawayStrength === 0 || event.pointerType === 'touch') return;
    const dock = runawayDockRef.current;
    const button = runawayButtonRef.current;
    if (!dock || !button) return;

    const dockRect = dock.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const cursorX = event.clientX - dockRect.left;
    const cursorY = event.clientY - dockRect.top;
    const buttonCenterX = buttonRect.left - dockRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top - dockRect.top + buttonRect.height / 2;
    const distanceX = cursorX - buttonCenterX;
    const distanceY = cursorY - buttonCenterY;
    const distance = Math.hypot(distanceX, distanceY);
    const triggerDistance = Math.max(105, buttonRect.width * 0.9);

    if (distance > triggerDistance) return;

    const directionX = distanceX === 0 ? (Math.random() > 0.5 ? 1 : -1) : -distanceX / distance;
    const directionY = distanceY === 0 ? -1 : -distanceY / distance;
    const maxX = Math.max(0, (dockRect.width - buttonRect.width) / 2 - 8);
    const maxY = Math.max(0, (dockRect.height - buttonRect.height) / 2 - 6);
    const push = Math.min(92, Math.max(42, triggerDistance - distance + 28)) * runawayStrength;

    setRunawayOffset({
      x: Math.max(-maxX, Math.min(maxX, directionX * push)),
      y: Math.max(-maxY, Math.min(maxY, directionY * push * 0.72)),
    });
  };

  const resetRunawayOffset = () => {
    if (runawayStrength === 0) setRunawayOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (runawayStrength === 0) setRunawayOffset({ x: 0, y: 0 });
  }, [runawayStrength]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#0b0f0d] text-[#effff2] selection:bg-[#d7ff4f]/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(215,255,79,0.12),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(79,255,177,0.09),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:36px_36px]" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-white/70 transition hover:border-[#d7ff4f]/50 hover:text-[#d7ff4f]">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Voltar
            </button>
            <span className="hidden sm:inline">DECODE / AUTH</span>
          </div>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d7ff4f] shadow-[0_0_10px_#d7ff4f]" /> SUPABASE AUTH / ONLINE</span>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,470px)] lg:gap-16 lg:py-12">
          <section className="hidden max-w-2xl lg:block">
            <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#d7ff4f]">
              <Terminal className="h-4 w-4" aria-hidden="true" /> COMPONENT / 01
            </div>
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#d7ff4f]/30 bg-[#d7ff4f]/10 shadow-[0_0_35px_rgba(215,255,79,0.12)]">
                <img src={logoDark} alt="Logo Decode Analytics Academy" className="h-11 w-11 object-contain" />
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-white/45">Decode Analytics Academy</p>
                <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.05em] text-white xl:text-7xl">Run your<br /><span className="text-[#d7ff4f] [text-shadow:0_0_26px_rgba(215,255,79,0.25)]">learning.</span></h1>
              </div>
            </div>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/55">Acesse suas apostilas, exercícios, simulados e o acompanhamento de desempenho em um ambiente feito para estudantes de tecnologia.</p>

            <div className="mt-12 grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, label: 'Conteúdo', value: 'Apostilas IA' },
                { icon: BarChart3, label: 'Progresso', value: 'Dashboard' },
                { icon: Shield, label: 'Acesso', value: 'Protegido' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <Icon className="mb-6 h-4 w-4 text-[#d7ff4f]" aria-hidden="true" />
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white/80">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full">
            <div className="overflow-hidden rounded-[26px] border border-white/12 bg-[#121815]/95 shadow-[0_24px_100px_rgba(0,0,0,0.45),0_0_70px_rgba(215,255,79,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40"><Code2 className="h-3.5 w-3.5 text-[#d7ff4f]" aria-hidden="true" /> DECODE_LOGIN</div>
                <div className="flex gap-1.5" aria-hidden="true"><span className="h-2 w-2 rounded-full bg-white/15" /><span className="h-2 w-2 rounded-full bg-white/15" /><span className="h-2 w-2 rounded-full bg-[#d7ff4f]/80" /></div>
              </div>

              <div className="space-y-6 p-5 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d7ff4f]/25 bg-[#d7ff4f]/10"><img src={logoDark} alt="" className="h-8 w-8 object-contain" /></div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d7ff4f]">Área segura</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{isReset ? 'Recuperar acesso' : isForgotRa ? 'Encontrar meu RA' : isSignUp ? 'Criar conta' : isLocked ? 'Conta bloqueada' : 'Sign in'}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-white/45">
                      {isReset ? 'Informe seu RA ou e-mail para receber as instruções.' : isForgotRa ? 'Consulte o portal acadêmico ou fale com o suporte.' : isSignUp ? 'Crie seu acesso para começar a estudar.' : isLocked ? 'Redefina sua senha para desbloquear o acesso.' : 'Bem-vindo(a) de volta. Seus estudos continuam aqui.'}
                    </p>
                  </div>
                </div>

                {isForgotRa ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#d7ff4f]/20 bg-[#d7ff4f]/[0.06] p-4 text-sm leading-relaxed text-white/65">Caso tenha esquecido seu Registro Acadêmico (RA), consulte o portal da UNIP ou o comprovante de matrícula.</div>
                    <Button variant="outline" className="min-h-11 w-full gap-2 border-white/15 bg-white/[0.03] text-white hover:border-[#d7ff4f]/50 hover:bg-[#d7ff4f]/10 hover:text-[#d7ff4f]" onClick={() => window.open('https://www.unip.br', '_blank')}><BookOpen className="h-4 w-4" aria-hidden="true" /> Acessar Portal UNIP</Button>
                    <Button className="min-h-11 w-full gap-2 bg-[#d7ff4f] text-[#10150f] hover:bg-[#e5ff8b]" onClick={() => window.location.href = 'mailto:decodeanalytics@outlook.com.br?subject=Recuperação de RA - Decode Academy'}><Shield className="h-4 w-4" aria-hidden="true" /> Falar com Suporte Decode</Button>
                    <button type="button" onClick={() => setIsForgotRa(false)} className="min-h-11 w-full text-center text-sm text-white/45 transition hover:text-[#d7ff4f]">Voltar ao login</button>
                  </div>
                ) : isReset ? (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2"><Label htmlFor="resetEmail" className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">RA ou e-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" /><Input id="resetEmail" type="text" required value={email} onChange={e => setEmail(e.target.value)} placeholder="G802144 ou seu@email.com" className="min-h-12 border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/25 focus-visible:border-[#d7ff4f] focus-visible:ring-[#d7ff4f]/25" /></div></div>
                    <Button type="submit" className="min-h-12 w-full rounded-full bg-[#d7ff4f] font-semibold text-[#10150f] hover:bg-[#e5ff8b]" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar link</Button>
                    <button type="button" onClick={() => setIsReset(false)} className="min-h-10 w-full text-center text-sm text-white/45 transition hover:text-[#d7ff4f]">Voltar ao login</button>
                  </form>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="identifier" className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">RA ou e-mail</Label>{!isSignUp && <button type="button" onClick={() => setIsForgotRa(true)} className="min-h-9 text-[10px] font-medium text-[#d7ff4f] transition hover:text-white">Esqueci meu RA</button>}</div><div className="relative"><Mail className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${usingEmail ? 'text-[#d7ff4f]' : 'text-white/35'}`} aria-hidden="true" /><Input id="identifier" type="text" inputMode="email" autoComplete="username" required value={identifier} onChange={(e) => { const v = e.target.value; setIdentifier(looksLikeEmail(v) ? normalizeIdentifier(v) : normalizeRa(v).replace(/[^A-Z0-9]/g, '')); setUnverifiedEmail(false); }} placeholder="G802144 ou seu@email.com" maxLength={120} className="min-h-12 border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/25 focus-visible:border-[#d7ff4f] focus-visible:ring-[#d7ff4f]/25" /></div><p className="text-[10px] text-white/35">{usingEmail ? 'E-mail detectado. Login com verificação por e-mail.' : identifier.length > 0 ? 'RA detectado. Login direto.' : 'Digite seu RA da UNIP ou seu e-mail cadastrado.'}</p></div>
                      <div className="space-y-2"><Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Senha</Label><div className={`relative ${shaking ? 'animate-shake' : ''}`}><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" /><Input ref={passwordRef} id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`min-h-12 border-white/10 bg-black/20 pl-11 pr-12 text-white placeholder:text-white/25 focus-visible:border-[#d7ff4f] focus-visible:ring-[#d7ff4f]/25 ${loginAttempts > 0 ? 'border-red-400/70 focus-visible:ring-red-400/25' : ''}`} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-white/35 transition hover:text-[#d7ff4f]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><AnimatePresence>{loginAttempts > 0 && !isLocked && <motion.p key="login-attempts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 text-[11px] text-red-300"><AlertTriangle className="h-3 w-3" aria-hidden="true" /> Tentativa {loginAttempts} de 3</motion.p>}</AnimatePresence></div>

                      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3"><Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => { const accepted = !!v; setAgreedToTerms(accepted); if (accepted) localStorage.setItem(`decode_terms_accepted_${TERMS_VERSION}`, 'true'); else localStorage.removeItem(`decode_terms_accepted_${TERMS_VERSION}`); }} className="mt-0.5 border-white/25 data-[state=checked]:border-[#d7ff4f] data-[state=checked]:bg-[#d7ff4f] data-[state=checked]:text-[#10150f]" /><Label htmlFor="terms" className="cursor-pointer select-none text-[11px] leading-relaxed text-white/45">Eu li e concordo com os <button type="button" onClick={() => navigate('/terms')} className="text-[#d7ff4f] hover:underline">Termos de Uso</button> e a <button type="button" onClick={() => navigate('/transparency')} className="text-[#d7ff4f] hover:underline">Política de Privacidade</button>.</Label></div>

                      <div className="space-y-3"><div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-white/35"><span>{loginHint}</span><span className="text-[#d7ff4f]">{filledLoginFields}/2</span></div><div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d7ff4f] shadow-[0_0_14px_#d7ff4f] transition-all duration-500" style={{ width: `${filledLoginFields * 50}%` }} /></div></div>

                      {unverifiedEmail && !isSignUp ? <Button type="submit" disabled={loading} className="min-h-12 w-full rounded-full bg-[#d7ff4f] font-semibold text-[#10150f] hover:bg-[#e5ff8b]">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar</Button> : (
                        <div ref={runawayDockRef} onPointerMove={handleRunawayPointerMove} onPointerLeave={resetRunawayOffset} className="relative flex min-h-[84px] items-center justify-center overflow-hidden rounded-full border border-white/[0.06] bg-black/[0.22] px-3">
                          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#d7ff4f]/20 to-transparent" />
                          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-[7.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d7ff4f]/25" />
                          <Button ref={runawayButtonRef} type="submit" style={{ transform: `translate3d(${runawayOffset.x}px, ${runawayOffset.y}px, 0)` }} className="relative z-10 min-h-12 w-[7.5rem] shrink-0 rounded-full border border-[#d7ff4f]/70 bg-[#d7ff4f] px-4 font-semibold text-[#10150f] shadow-[0_0_25px_rgba(215,255,79,0.16)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:bg-[#e5ff8b] hover:shadow-[0_0_35px_rgba(215,255,79,0.28)] disabled:cursor-not-allowed disabled:opacity-70" disabled={loading || awaitingSession || isLocked} aria-label="Entrar no Decode Analytics Academy">{(loading || awaitingSession) && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{isLocked ? <><Lock className="mr-1 h-4 w-4" /> Bloqueada</> : isSignUp ? 'Criar conta' : awaitingSession ? 'Entrando...' : 'Log in'}</Button>
                        </div>
                      )}

                      {!isSignUp && <div className="flex flex-wrap items-center justify-between gap-2"><label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-white/45"><Checkbox checked={rememberMe} onCheckedChange={(v) => { setRememberMe(!!v); if (v) localStorage.setItem('decode_stay_logged_in', 'true'); else localStorage.removeItem('decode_stay_logged_in'); }} className="h-4 w-4 border-white/25 data-[state=checked]:border-[#d7ff4f] data-[state=checked]:bg-[#d7ff4f]" /> Permanecer conectado</label><button type="button" onClick={() => setIsReset(true)} className="min-h-10 px-1 text-xs text-white/45 transition hover:text-[#d7ff4f]">{isLocked ? 'Redefinir senha' : 'Esqueceu a senha?'}</button></div>}
                    </form>

                    <div className="relative my-5"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center"><span className="bg-[#121815] px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">ou</span></div></div>
                    <Button type="button" variant="outline" className="min-h-11 w-full rounded-full border-white/15 bg-white/[0.025] font-mono text-[10px] uppercase tracking-[0.16em] text-white/65 hover:border-[#d7ff4f]/50 hover:bg-[#d7ff4f]/10 hover:text-[#d7ff4f]" onClick={() => { setIsSignUp(!isSignUp); setUnverifiedEmail(false); setLoginAttempts(0); }}>{isSignUp ? 'Já tenho conta' : 'Criar conta'}</Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30"><div className="rounded-lg border border-white/10 bg-white/[0.025] p-2"><span className="text-[#d7ff4f]/70">01</span> identifier</div><div className="rounded-lg border border-white/10 bg-white/[0.025] p-2"><span className="text-[#d7ff4f]/70">02</span> auth-flow</div><div className="rounded-lg border border-white/10 bg-white/[0.025] p-2"><span className="text-[#d7ff4f]/70">03</span> session</div></div>
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">TAB · ENTER · RA / E-MAIL · SECURE ACCESS</p>
          </motion.section>
        </div>
      </main>

      <Dialog open={showLockModal} onOpenChange={setShowLockModal}><DialogContent className="max-w-sm border-white/10 bg-[#121815] text-white"><DialogHeader><DialogTitle className="flex items-center gap-2 text-base text-red-300"><Lock className="h-5 w-5" /> Conta bloqueada</DialogTitle></DialogHeader><div className="space-y-4"><p className="text-sm text-white/55">Para desbloquear, redefina sua senha por e-mail.</p><Button onClick={() => { setShowLockModal(false); setIsReset(true); }} className="w-full bg-[#d7ff4f] text-[#10150f] hover:bg-[#e5ff8b]">Redefinir senha por e-mail</Button><button type="button" onClick={() => setShowLockModal(false)} className="min-h-10 w-full text-center text-sm text-white/45 hover:text-white">Fechar</button></div></DialogContent></Dialog>
    </div>
  );
}

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
        } catch { }
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
  const TERMS_VERSION = '4.18.1';
  const [agreedToTerms, setAgreedToTerms] = useState(() => localStorage.getItem(`decode_terms_accepted_${TERMS_VERSION}`) === 'true');

  const authSettling = authLoading || !isSessionHydrated || status === 'loading' || status === 'hydrating';

  useEffect(() => {
    if (authSettling || status !== 'authenticated' || !user) return;
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
        
        setLoading(false); 
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

  return (
    <LoginSplitLayout>
      <div className="relative group w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        
        <div className={`relative overflow-hidden rounded-lg bg-[#0a0a0f] p-6 shadow-2xl ring-1 ring-white/10 sm:p-8 space-y-6 ${shaking ? 'animate-shake' : ''}`}>
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

          <div className="space-y-4">
            {isForgotRa ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                  <p className="text-xs leading-relaxed text-gray-400">
                    Caso tenha esquecido seu Registro Acadêmico (RA), você pode encontrá-lo no seu portal da UNIP ou no comprovante de matrícula.
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs gap-2 border-white/10 text-white hover:bg-white/5"
                      onClick={() => window.open('https://www.unip.br', '_blank')}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Acessar Portal UNIP
                    </Button>
                    <Button 
                      className="w-full text-xs gap-2 bg-cyan-600 hover:bg-cyan-500 text-white"
                      onClick={() => window.location.href = 'mailto:decodeanalytics@outlook.com.br?subject=Recuperação de RA - Decode Academy'}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Falar com Suporte Decode
                    </Button>
                  </div>
                </div>
                <button type="button" onClick={() => setIsForgotRa(false)} className="w-full text-center text-sm text-gray-500 hover:text-white smooth-all uppercase tracking-tighter font-mono">
                  &lt; Back to Terminal
                </button>
              </div>
            ) : isReset ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Identity Identifier</Label>
                  <Input 
                    id="resetEmail" 
                    type="text" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="G802144 ou seu@email.com"
                    className="bg-black/40 border-white/10 text-white font-mono"
                  />
                </div>
                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Protocol Link
                </Button>
                <button type="button" onClick={() => setIsReset(false)} className="w-full text-center text-sm text-gray-500 hover:text-white smooth-all uppercase tracking-tighter font-mono">
                  &lt; Cancel Access
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="identifier" className="text-xs font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3 h-3" /> User Identity (RA/Email)
                    </Label>
                    {!isSignUp && (
                      <button 
                        type="button" 
                        onClick={() => setIsForgotRa(true)}
                        className="text-[10px] text-cyan-400 hover:underline font-mono uppercase"
                      >
                        Recovery?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="G000000 ou aluno@decode.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:ring-cyan-500/20 font-mono transition-all pr-10 h-11"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/30">
                      <Terminal className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Access Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:ring-cyan-500/20 font-mono transition-all pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {loginAttempts > 0 && !isLocked && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[11px] text-red-500 font-mono mt-1"
                      >
                        [ERR] Attempt {loginAttempts}/3 failed
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2 rounded-md border border-white/5 bg-white/5 p-2.5">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms} 
                      onCheckedChange={(v) => {
                        const accepted = !!v;
                        setAgreedToTerms(accepted);
                        if (accepted) localStorage.setItem(`decode_terms_accepted_${TERMS_VERSION}`, 'true');
                        else localStorage.removeItem(`decode_terms_accepted_${TERMS_VERSION}`);
                      }}
                      className="mt-0.5 border-white/20 data-[state=checked]:bg-cyan-500"
                    />
                    <Label htmlFor="terms" className="text-[11px] leading-relaxed text-gray-500 cursor-pointer select-none">
                      Concordo com os <button type="button" onClick={() => navigate('/terms')} className="text-cyan-400 hover:underline">Termos</button> e a <button type="button" onClick={() => navigate('/transparency')} className="text-cyan-400 hover:underline">Privacidade</button>.
                    </Label>
                  </div>
                </div>

                {unverifiedEmail && !isSignUp ? (
                  <EvasiveButton email={email} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 h-11 uppercase font-mono tracking-widest">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Identity
                  </EvasiveButton>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || authSettling || isLocked}
                    className="w-full relative group overflow-hidden bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-widest h-11 border-none transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-mono">Processing...</span>
                      </div>
                    ) : (
                      <span className="font-mono">{isSignUp ? 'Initialize' : 'Authorize'}</span>
                    )}
                  </Button>
                )}

                <div className="flex items-center justify-between gap-x-2 pt-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(v) => setRememberMe(!!v)}
                      className="h-3 w-3 border-white/20 data-[state=checked]:bg-cyan-500"
                    />
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Stay session</span>
                  </label>
                  <button type="button" onClick={() => setIsReset(true)} className="text-[10px] text-gray-500 hover:text-cyan-400 font-mono uppercase">
                    Lost Key?
                  </button>
                </div>
              </form>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#0a0a0f] px-2 text-gray-600 font-mono tracking-widest">System Link</span></div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-white/10 bg-white/5 text-xs font-mono uppercase tracking-wider text-white hover:bg-white/10" 
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Back to Terminal' : 'Request Enrollment'}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-gray-600">
          Developed by: Kaique Aurelio & Decode Analytics
        </p>
      </div>

      <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
        <DialogContent className="max-w-sm bg-[#0a0a0f] border-red-900/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-red-500 uppercase font-mono tracking-tighter">
              <Lock className="h-5 w-5" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-400 font-mono">
              Identity suspended due to too many failed protocol attempts. Manual override required.
            </p>
            <Button onClick={() => { setShowLockModal(false); setIsReset(true); }} className="w-full bg-red-600 hover:bg-red-500">
              Protocol Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LoginSplitLayout>
  );
}

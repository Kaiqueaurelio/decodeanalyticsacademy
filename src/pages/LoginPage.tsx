import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
      toast.success('Email de recuperação enviado!');
      setIsReset(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container pt-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-all"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm animate-card-enter">
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <img src={logoDark} alt="Decode Analytics" className="mx-auto h-12 w-12 rounded-xl object-cover" />
              <h1 className="text-xl font-bold">
                {isReset ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Entrar'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isReset
                  ? 'Digite seu email para recuperação'
                  : isSignUp
                  ? 'Crie sua conta para começar'
                  : 'Acesse sua conta Decode Analytics'}
              </p>
            </div>

            {isReset ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="resetEmail" className="text-sm">Email</Label>
                  <Input id="resetEmail" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
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
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">Senha</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-all">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
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
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? 'Já tenho conta' : 'Criar conta'}
                </Button>
              </>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Decode Analytics — por Kaique Aurelio
          </p>
        </div>
      </div>
    </div>
  );
}

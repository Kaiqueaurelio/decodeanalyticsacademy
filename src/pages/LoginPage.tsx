import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Back button */}
      <div className="container pt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-6 animate-scale-in">
          <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Logo and welcome */}
            <div className="text-center space-y-3">
              <img src={logoDark} alt="Decode Analytics" className="mx-auto h-14 w-14 rounded-xl object-cover" />
              <div>
                <h1 className="text-2xl font-bold">{isSignUp ? 'Criar Conta' : 'Bem-vindo'}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSignUp ? 'Crie sua conta Decode Analytics' : 'Entre na sua conta Decode Analytics'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Criar conta' : 'Entrar'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OU</span>
              </div>
            </div>

            {/* Toggle button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Decode Analytics — por Kaique Aurelio
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.jpeg';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8 animate-scale-in">
        <div className="text-center space-y-4">
          <img src={logoDark} alt="Decode Analytics" className="mx-auto h-16 w-16 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold">Decode Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Plataforma de revisão para provas e certificações</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </form>
        <p className="text-center text-xs text-muted-foreground">Criado por Kaique Aurelio</p>
      </div>
    </div>
  );
}

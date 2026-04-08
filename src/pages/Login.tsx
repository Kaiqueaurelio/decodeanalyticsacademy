import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Credenciais inválidas. Verifique seu e-mail e senha."
        : error.message
      );
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
      setIsSignUp(false);
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado!");
      setIsReset(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="absolute top-6 left-6 sm:left-10 z-20">
        <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">DECODE</h1>
      </div>

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-background/75 backdrop-blur-sm rounded-sm p-8 sm:p-12 space-y-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isReset ? "Recuperar Senha" : isSignUp ? "Criar Conta" : "Entrar"}
          </h2>

          {isReset ? (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail" required
                className="h-12 bg-muted border-0 rounded-sm text-foreground placeholder:text-muted-foreground text-sm"
              />
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm text-sm" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link"}
              </Button>
              <button type="button" onClick={() => setIsReset(false)} className="text-muted-foreground hover:text-foreground text-sm w-full text-center">
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              {isSignUp && (
                <Input
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome Completo" required
                  className="h-12 bg-muted border-0 rounded-sm text-foreground placeholder:text-muted-foreground text-sm"
                />
              )}
              <Input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail" required
                className="h-12 bg-muted border-0 rounded-sm text-foreground placeholder:text-muted-foreground text-sm"
              />
              <Input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha" required minLength={6}
                className="h-12 bg-muted border-0 rounded-sm text-foreground placeholder:text-muted-foreground text-sm"
              />
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm text-sm" disabled={loading}>
                {loading ? "Carregando..." : isSignUp ? "Cadastrar" : "Entrar"}
              </Button>

              {!isSignUp && (
                <button type="button" onClick={() => setIsReset(true)} className="text-muted-foreground hover:text-foreground text-sm w-full text-center">
                  Esqueceu a senha?
                </button>
              )}
            </form>
          )}

          {!isReset && (
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Já tem conta? " : "Novo por aqui? "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-foreground hover:underline font-medium">
                {isSignUp ? "Faça login" : "Cadastre-se agora"}
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 text-center w-full">
        <p className="text-[11px] text-muted-foreground">Decode Analytics Academy © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ra-auth', {
        body: {
          mode: 'reset',
          ra: email.trim().toLowerCase(),
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (error || data?.code === 'email_rate_limit_exceeded') {
        const message = data?.error || error?.message || 'Não foi possível enviar o link agora.';
        toast.error(message.includes('rate limit') || message.includes('limite')
          ? 'Limite de envio atingido. Aguarde alguns minutos antes de solicitar outro link.'
          : message);
      } else {
        setSuccess(true);
        toast.success('Link de recuperação enviado com sucesso!');
      }
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#0b0f0d] text-[#effff2] selection:bg-[#d7ff4f]/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(215,255,79,0.12),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(79,255,177,0.09),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:36px_36px]" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/login')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-white/70 transition hover:border-[#d7ff4f]/50 hover:text-[#d7ff4f]">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Voltar
            </button>
            <span className="hidden sm:inline">DECODE / RECOVERY</span>
          </div>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d7ff4f] shadow-[0_0_10px_#d7ff4f]" /> SECURITY_NODE / ACTIVE</span>
        </header>

        <div className="flex flex-1 items-center justify-center py-8 lg:py-12">
          <motion.section 
            initial={{ opacity: 0, y: 18 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/12 bg-[#121815]/95 shadow-[0_24px_100px_rgba(0,0,0,0.45),0_0_70px_rgba(215,255,79,0.06)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                <Shield className="h-3.5 w-3.5 text-[#d7ff4f]" /> PASS_RECOVERY
              </div>
              <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d7ff4f]/80" /></div>
            </div>

            <div className="space-y-6 p-5 sm:p-8">
              {!success ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d7ff4f]/25 bg-[#d7ff4f]/10">
                      <Lock className="h-6 w-6 text-[#d7ff4f]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">Recuperar Acesso</h2>
                      <p className="mt-1 text-sm leading-relaxed text-white/45">
                        Informe seu e-mail cadastrado para enviarmos as instruções de redefinição.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Endereço de E-mail</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <Input 
                          id="email" 
                          type="email" 
                          required 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="seu@email.com" 
                          className="min-h-12 border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/25 focus-visible:border-[#d7ff4f] focus-visible:ring-[#d7ff4f]/25"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="min-h-12 w-full rounded-full bg-[#d7ff4f] font-semibold text-[#10150f] hover:bg-[#e5ff8b] transition-all"
                    >
                      {loading ? 'Processando...' : 'Enviar Link de Redefinição'}
                    </Button>
                    
                    <button 
                      type="button" 
                      onClick={() => navigate('/login')} 
                      className="min-h-10 w-full text-center text-sm text-white/45 transition hover:text-[#d7ff4f]"
                    >
                      Voltar ao Login
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d7ff4f]/30 bg-[#d7ff4f]/10 shadow-[0_0_25px_rgba(215,255,79,0.15)]">
                    <CheckCircle2 className="h-8 w-8 text-[#d7ff4f]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Verifique seu e-mail</h3>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">
                      Se o e-mail informado estiver cadastrado em nossa base, você receberá um link para criar uma nova senha em instantes.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="min-h-11 w-full rounded-full bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08]"
                  >
                    Voltar para o Login
                  </Button>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { Heart, Coffee, QrCode, ArrowLeft, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Watermark } from '@/components/Watermark';
import { AppHeader } from '@/components/AppHeader';

export default function DonationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Watermark />
      <AppHeader />

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Transparência Total
            </div>
          </div>

          <section className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20">
              <HeartHandshake className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Apoie o Projeto</h1>
            <p className="text-muted-foreground leading-relaxed">
              A Decode Analytics Academy sempre foi e <span className="text-primary font-bold">sempre será gratuita</span>.
              Nosso compromisso é com a educação acessível para todos os alunos.
            </p>
          </section>

          <div className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8 space-y-6 backdrop-blur-sm">
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive fill-destructive" />
                Por que apoiar?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Manter servidores, APIs de IA, segurança e atualizações constantes exige investimento.
                Se este aplicativo te ajudou nos estudos e você quer fortalecer sua evolução, qualquer contribuição simbólica faz a diferença.
              </p>
              <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
                <p className="text-xs font-medium italic text-muted-foreground">
                  "O app continuará funcionando sempre de graça, com tudo que ele sempre teve e com atualizações futuras, mesmo que você não possa ou não queira contribuir. Apoiar é um ato voluntário."
                </p>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-border">
              <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-4 w-full">
                  <p className="text-sm font-medium text-muted-foreground">Escolha como deseja apoiar:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button 
                      className="w-full h-14 text-lg font-bold gap-2 shadow-lg shadow-primary/20"
                      onClick={() => window.open('https://pay.sumup.com/b2c/QQ9V46MZ', '_blank')}
                    >
                      Apoiar via Cartão/Link
                    </Button>

                    <div className="relative group">
                      <div className="flex flex-col items-center p-4 rounded-xl border border-border bg-muted/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pix (E-mail)</p>
                        <p className="text-sm font-mono font-bold text-foreground mb-3">
                          decoanalytics@outlook.com.br
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] h-8 w-full"
                          onClick={() => {
                            navigator.clipboard.writeText('decoanalytics@outlook.com.br');
                          }}
                        >
                          Copiar Chave Pix
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center">
                    <div className="relative group cursor-help" title="Escaneie para apoiar via PIX">
                      <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative rounded-2xl bg-white p-3 shadow-md">
                        <QrCode className="h-32 w-32 text-black" />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-tighter">QR Code de Apoio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-accent/5 p-4 border border-accent/10">
              <Coffee className="h-5 w-5 text-accent" />
              <p className="text-xs text-muted-foreground">
                Qualquer valor simbólico ajuda a manter a cafeína dos desenvolvedores e o poder de processamento da Ella. ☕
              </p>
            </div>
          </div>

          <footer className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Desenvolvido com dedicação por Kaique Aurelio
            </p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Check, Cookie, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const COOKIE_CONSENT_KEY = 'decode-analytics-cookie-consent';

type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
};

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: true,
    marketing: false,
    performance: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      performance: true,
    };
    saveConsent(allAccepted);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowSettings(false);
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-4xl"
          >
            <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md md:p-6">
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
                <div className="flex items-start gap-4">
                  <div className="hidden rounded-full bg-primary/10 p-3 text-primary md:block">
                    <Cookie className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary md:hidden" />
                      Privacidade e Cookies
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:max-w-xl">
                      Utilizamos cookies para melhorar sua experiência acadêmica, analisar o tráfego e personalizar o conteúdo. Ao clicar em "Aceitar Todos", você concorda com o uso de cookies.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="order-2 gap-2 text-xs md:order-1"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Preferências
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="order-1 gap-2 text-xs font-bold md:order-2"
                  >
                    Aceitar Todos
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Configurações de Cookies
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Personalize como seus dados são coletados e utilizados na plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/5">
              <div className="space-y-0.5">
                <label className="text-sm font-bold">Essenciais</label>
                <p className="text-[11px] text-muted-foreground">Obrigatórios para o login e segurança.</p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/5">
              <div className="space-y-0.5">
                <label className="text-sm font-bold">Analíticos</label>
                <p className="text-[11px] text-muted-foreground">Melhoram nossa compreensão do seu aprendizado.</p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(val) => setPreferences({ ...preferences, analytics: val })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/5">
              <div className="space-y-0.5">
                <label className="text-sm font-bold">Desempenho</label>
                <p className="text-[11px] text-muted-foreground">Otimizam a velocidade de carregamento PWA.</p>
              </div>
              <Switch
                checked={preferences.performance}
                onCheckedChange={(val) => setPreferences({ ...preferences, performance: val })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/5">
              <div className="space-y-0.5">
                <label className="text-sm font-bold">Marketing</label>
                <p className="text-[11px] text-muted-foreground">Ofertas e conteúdos patrocinados relevantes.</p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(val) => setPreferences({ ...preferences, marketing: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSettings(false)} className="text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSavePreferences} className="text-xs font-bold">
              Salvar Preferências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

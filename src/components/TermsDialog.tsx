import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface TermsDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  materialTitle?: string;
}

export function TermsDialog({ open, onAccept, onDecline, materialTitle }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDecline()}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Termo de Responsabilidade
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed space-y-3">
            {materialTitle && (
              <p className="text-foreground font-medium">
                Você está prestes a acessar: <span className="text-primary">{materialTitle}</span>
              </p>
            )}
            <p>
              Este conteúdo é <strong className="text-foreground">exclusivo para membros</strong> da 
              Decode Analytics Academy e protegido por direitos autorais.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-destructive font-semibold text-sm">Atenção</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O compartilhamento, distribuição ou vazamento deste material é 
                  <strong className="text-foreground"> estritamente proibido</strong> e será de total 
                  responsabilidade do usuário. Todas as ações são monitoradas e registradas com 
                  identificação do usuário.
                </p>
              </div>
            </div>
            <p className="text-xs">
              Ao clicar em "Aceitar e Continuar", você concorda com os termos de uso e se 
              compromete a não compartilhar este conteúdo com terceiros.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onDecline}
            className="sm:flex-1 border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={onAccept}
            className="sm:flex-1 bg-primary hover:bg-primary/90"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

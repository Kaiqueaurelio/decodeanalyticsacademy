import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import { FilePlus2, Loader2, Sparkles, Layout, FileCode } from 'lucide-react';

interface QuickAddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, type: 'section' | 'subsection' | 'blank' | 'template') => void;
  suggestedTitle?: string;
}

export function QuickAddSectionDialog({
  open,
  onOpenChange,
  onConfirm,
  suggestedTitle = ''
}: QuickAddSectionDialogProps) {
  const [title, setTitle] = useState(suggestedTitle);
  const [type, setType] = useState<'section' | 'subsection' | 'blank' | 'template'>('section');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(suggestedTitle);
      setType('section');
      setLoading(false);
    }
  }, [open, suggestedTitle]);

  const handleConfirm = () => {
    if (!title.trim()) return;
    setLoading(true);
    onConfirm(title.trim(), type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-emerald-500" />
            Nova Página / Seção
          </DialogTitle>
          <DialogDescription>
            Adicione rapidamente uma nova divisão ao seu caderno.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sec-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Título
            </Label>
            <Input
              id="sec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: 1.2 Conceitos Avançados"
              className="bg-background/50 border-primary/20 focus:border-primary transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>

          <div className="grid gap-2 pt-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Conteúdo</Label>
            <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-1 gap-2">
              <div 
                className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => setType('section')}
              >
                <RadioGroupItem value="section" id="type-section" />
                <div className="flex-1 cursor-pointer">
                  <Label htmlFor="type-section" className="cursor-pointer text-sm font-bold flex items-center gap-2">
                    <Layout className="h-3.5 w-3.5 text-primary" /> Seção Principal
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Cria um H1 estruturado</p>
                </div>
              </div>

              <div 
                className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setType('subsection')}
              >
                <RadioGroupItem value="subsection" id="type-sub" />
                <div className="flex-1 cursor-pointer">
                  <Label htmlFor="type-sub" className="cursor-pointer text-sm font-bold flex items-center gap-2">
                    <FileCode className="h-3.5 w-3.5 text-blue-500" /> Subseção
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Cria um H2 dentro da atual</p>
                </div>
              </div>

              <div 
                className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setType('template')}
              >
                <RadioGroupItem value="template" id="type-template" />
                <div className="flex-1 cursor-pointer">
                  <Label htmlFor="type-template" className="cursor-pointer text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Estrutura Padrão
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Introdução + Desenvolvimento + Exercícios</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !title.trim()} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FilePlus2 className="h-4 w-4 mr-2" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

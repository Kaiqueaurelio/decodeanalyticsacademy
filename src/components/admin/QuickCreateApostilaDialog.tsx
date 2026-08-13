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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, BookPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEMESTER_OPTIONS } from '@/lib/subject-semester-map';

interface QuickCreateApostilaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCreateApostilaDialog({ open, onOpenChange }: QuickCreateApostilaDialogProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState<string>('1');
  const [category, setCategory] = useState('Computação');
  const [template, setTemplate] = useState<'blank' | 'template' | 'import'>('blank');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setSemester('1');
    setCategory('Computação');
    setTemplate('blank');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Informe o nome do caderno.');
      return;
    }

    if (title.length > 100) {
      toast.error('O nome deve ter no máximo 100 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apostilas')
        .insert({
          title: title.trim(),
          category: category.trim(),
          semester: semester === 'none' ? null : parseInt(semester),
          published: false,
          status: 'bloqueada',
          content: template === 'template' 
            ? '# ' + title.trim() + '\n\nComece a escrever aqui...' 
            : '',
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('✓ Caderno criado com sucesso');
      onOpenChange(false);
      reset();
      
      // Pequeno delay para o modal fechar suavemente
      setTimeout(() => {
        navigate(`/admin/apostilas/${data.id}`);
      }, 100);
      
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao criar caderno: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookPlus className="h-5 w-5 text-emerald-500" />
            Novo Caderno
          </DialogTitle>
          <DialogDescription>
            Crie um novo material acadêmico rapidamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Métodos Numéricos"
              className="bg-background/50 border-primary/20 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição (opcional)</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do conteúdo"
              className="bg-background/50 border-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Semestre</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Grade Livre</SelectItem>
                  {SEMESTER_OPTIONS.map(s => (
                    <SelectItem key={s} value={s.toString()}>
                      {s === 0 ? 'ENEM' : `${s}º Semestre`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computação">Computação</SelectItem>
                  <SelectItem value="ENEM">ENEM</SelectItem>
                  <SelectItem value="Matemática">Matemática</SelectItem>
                  <SelectItem value="Sistemas">Sistemas</SelectItem>
                  <SelectItem value="Geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 pt-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Template</Label>
            <RadioGroup value={template} onValueChange={(v: any) => setTemplate(v)} className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setTemplate('blank')}>
                <RadioGroupItem value="blank" id="blank" />
                <Label htmlFor="blank" className="flex-1 cursor-pointer text-sm font-medium">Em branco</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setTemplate('template')}>
                <RadioGroupItem value="template" id="template" />
                <Label htmlFor="template" className="flex-1 cursor-pointer text-sm font-medium">Usar template padrão</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-border p-3 opacity-50 cursor-not-allowed">
                <RadioGroupItem value="import" id="import" disabled />
                <Label htmlFor="import" className="flex-1 text-sm font-medium">Importar conteúdo (breve)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookPlus className="h-4 w-4 mr-2" />}
            Criar Caderno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

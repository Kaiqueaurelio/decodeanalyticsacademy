import React from 'react';
import { Settings, Target, Clock, Filter, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner';

export function StudyGoalsConfig() {
  const [target, setTarget] = React.useState(5);
  const [frequency, setFrequency] = React.useState('daily');
  const [metric, setMetric] = React.useState('chapters');

  const handleSave = () => {
    toast.success('Configurações de estudo salvas com sucesso!');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-background/50 border-primary/20 hover:bg-primary/10 group">
          <Settings className="h-3 w-3 mr-2 group-hover:rotate-90 transition-transform" />
          Configurar Metas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#050508] border-primary/20 text-foreground backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <Target className="h-4 w-4 text-primary" />
            Configurações de Estudo
          </DialogTitle>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            OBJECTIVES_SETUP :: CONFIG_V1
          </p>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="metric" className="text-[10px] font-bold uppercase text-muted-foreground">O que você quer focar?</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="bg-card/50 border-primary/10">
                <SelectValue placeholder="Selecione o foco" />
              </SelectTrigger>
              <SelectContent className="bg-[#050508] border-primary/20">
                <SelectItem value="chapters">Capítulos de Apostilas</SelectItem>
                <SelectItem value="exercises">Exercícios Resolvidos</SelectItem>
                <SelectItem value="hours">Horas de Estudo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="frequency" className="text-[10px] font-bold uppercase text-muted-foreground">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-card/50 border-primary/10">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent className="bg-[#050508] border-primary/20">
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 mt-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Meta de {metric === 'chapters' ? 'Capítulos' : metric === 'exercises' ? 'Exercícios' : 'Horas'}</Label>
              <span className="text-xs font-mono font-bold text-primary">{target}</span>
            </div>
            <Slider
              value={[target]}
              max={metric === 'exercises' ? 100 : 20}
              step={1}
              onValueChange={(val) => setTarget(val[0])}
              className="py-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/80 text-white font-bold uppercase tracking-widest text-[10px] h-9">
            <Save className="h-3 w-3 mr-2" />
            Salvar Objetivos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from 'react';
import { 
  User, 
  Clock, 
  Layers, 
  Map as MapIcon, 
  GraduationCap, 
  CheckCircle2, 
  Circle,
  PlayCircle,
  ArrowLeft,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotionPropertyGrid } from './NotionPropertyGrid';
import { NotionTopicAccordion } from './NotionTopicAccordion';
import { Badge } from '@/components/ui/badge';
import { getSubjectColor } from '@/lib/subject-colors';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentNode {
  id: string;
  title: string;
  type: 'note' | 'summary' | 'exam_review' | 'calendar';
  onClick?: () => void;
}

interface TopicSection {
  id: string;
  title: string;
  documents: DocumentNode[];
}

interface SubjectData {
  id: string;
  title: string;
  coverImage: string | null;
  classType: string;
  workloadHours: number;
  thematicAxis: string;
  formationAxis: string;
  professor: string;
  semester: string;
  status: 'A cursar' | 'Em progresso' | 'Concluído';
  progressValue: number;
  onOpenNotebook?: () => void;
  contentSections: TopicSection[];
}

interface Props {
  subject: SubjectData;
}

export function NotionSubjectDetail({ subject }: Props) {
  const color = getSubjectColor(subject.title);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const properties = useMemo(() => [
    { icon: PlayCircle, label: 'Tipo de Aula', value: <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{subject.classType}</Badge> },
    { icon: Clock, label: 'Carga Horária', value: `${subject.workloadHours} horas` },
    { icon: Layers, label: 'Eixo Temático', value: subject.thematicAxis },
    { icon: MapIcon, label: 'Eixo de Formação', value: subject.formationAxis },
    { icon: User, label: 'Professor', value: subject.professor },
    { icon: GraduationCap, label: 'Semestre', value: subject.semester },
    { 
      icon: subject.status === 'Concluído' ? CheckCircle2 : Circle, 
      label: 'Status', 
      value: (
        <span className={cn(
          "inline-flex items-center gap-1.5 font-bold",
          subject.status === 'Concluído' ? 'text-emerald-500' : 'text-amber-500'
        )}>
          <span className={cn(
            "h-2 w-2 rounded-full",
            subject.status === 'Concluído' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          )} />
          {subject.status}
        </span>
      )
    },
  ], [subject]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Notion-style Header Bar */}
      <div className="flex items-center justify-between py-2 border-b border-border/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-accent/10 rounded-lg text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground overflow-hidden">
            <span className="hover:text-foreground cursor-pointer transition-colors whitespace-nowrap" onClick={() => navigate('/dashboard')}>Dashboard</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground truncate font-bold capitalize">{subject.title.replace(/_/g, ' ').toLowerCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={subject.onOpenNotebook}
            variant="ghost"
            size="sm"
            className="hidden sm:flex gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all rounded-lg"
          >
            <BookOpen className="h-4 w-4" /> Caderno
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground rounded-lg"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cover Header - Pure Notion Style */}
      <div className="relative w-full group overflow-hidden">
        <div className="h-48 sm:h-64 w-full overflow-hidden rounded-xl border border-border/20 shadow-lg">
          {subject.coverImage ? (
            <img 
              src={subject.coverImage} 
              alt={subject.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
          ) : (
            <div 
              className="w-full h-full opacity-60" 
              style={{ background: `linear-gradient(135deg, ${color}44 0%, ${color}22 100%)` }}
            />
          )}
        </div>
        
        {/* Subject Icon/Emoji Place - Overlapping cover */}
        <div className="absolute -bottom-10 left-8 h-20 w-20 sm:h-24 sm:w-24 bg-card rounded-2xl border-4 border-background shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
           <div 
            className="text-4xl sm:text-5xl drop-shadow-sm"
            style={{ color }}
           >
             {subject.title.replace(/_/g, ' ').charAt(0)}
           </div>
        </div>
      </div>

      <div className="pt-10 px-2 space-y-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter text-foreground mb-4 capitalize">
            {subject.title.replace(/_/g, ' ').toLowerCase()}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold px-3">
              {subject.semester}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border/40 font-bold px-3">
              {subject.formationAxis}
            </Badge>
          </div>
        </div>

        {/* Callout Section (Notion Style) */}
        <div 
          className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-accent/5"
          style={{ borderLeftColor: color, borderLeftWidth: '4px', boxShadow: `inset 4px 0 0 0 ${color}22` }}
        >
          <div className="mt-1 h-8 w-8 rounded-lg flex items-center justify-center bg-card shadow-sm shrink-0">
            <Info className="h-4 w-4" style={{ color }} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Visão Geral da Disciplina</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bem-vindo ao módulo de <span className="capitalize">{subject.title.replace(/_/g, ' ').toLowerCase()}</span>. Aqui você encontrará todos os materiais, 
              resumos e exercícios estruturados para o seu melhor aproveitamento acadêmico.
            </p>
          </div>
        </div>

        {/* Properties Table */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-2">Propriedades</h3>
          <NotionPropertyGrid 
            properties={properties} 
            progressValue={subject.progressValue} 
          />
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/10 pb-2 px-2">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Conteúdo Programático
            </h2>
            <Badge variant="secondary" className="text-[10px] font-bold text-muted-foreground/60 bg-transparent border-transparent">
              {subject.contentSections.length} módulos
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {subject.contentSections.map((section, idx) => (
              <NotionTopicAccordion
                key={section.id}
                id={section.id}
                title={section.title}
                isExpandedByDefault={idx === 0}
                documents={section.documents}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overlay Sidebar Menu (Retrátil) */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />
      
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] bg-card border-r border-border/40 z-[101] shadow-2xl transition-transform duration-300 ease-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black">
                D
              </div>
              <span className="text-sm font-black tracking-tight">Decode Academy</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 rounded-lg">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 px-2 py-4">
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="px-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Navegação</h4>
                <Button 
                    variant="secondary" 

                  className="w-full justify-start gap-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-lg"
                  onClick={() => navigate('/dashboard')}
                >
                  <MapIcon className="h-4 w-4" /> Painel Geral
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-sm font-bold text-foreground bg-accent/10 rounded-lg"
                >
                  <BookOpen className="h-4 w-4 text-primary" /> Esta Matéria
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-lg"
                  onClick={() => navigate('/horarios')}
                >
                  <Clock className="h-4 w-4" /> Minha Grade
                </Button>
              </div>

              <div className="space-y-1">
                <h4 className="px-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Favoritos</h4>
                <div className="px-3 py-2 text-xs text-muted-foreground/50 italic">
                  Nenhum item fixado.
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="px-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Módulos</h4>
                {subject.contentSections.map(section => (
                  <Button 
                    key={section.id}
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-lg truncate"
                    onClick={() => {
                      toggleSidebar();
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                    {section.title}
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border/10 bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black">
                {subject.professor.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate">{subject.professor}</span>
                <span className="text-[10px] text-muted-foreground">Responsável</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

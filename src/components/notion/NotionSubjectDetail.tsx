import { useMemo } from 'react';
import { 
  User, 
  Clock, 
  Layers, 
  Map as MapIcon, 
  GraduationCap, 
  CheckCircle2, 
  Circle,
  PlayCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotionPropertyGrid } from './NotionPropertyGrid';
import { NotionTopicAccordion } from './NotionTopicAccordion';
import { Badge } from '@/components/ui/badge';
import { getSubjectColor } from '@/lib/subject-colors';

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
  contentSections: TopicSection[];
}

interface Props {
  subject: SubjectData;
}

export function NotionSubjectDetail({ subject }: Props) {
  const color = getSubjectColor(subject.title);
  const navigate = useNavigate();

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
        <span className={`inline-flex items-center gap-1.5 ${subject.status === 'Concluído' ? 'text-emerald-500' : 'text-amber-500'}`}>
          <span className={`h-2 w-2 rounded-full ${subject.status === 'Concluído' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          {subject.status}
        </span>
      )
    },
  ], [subject]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="gap-1.5 text-xs hover:bg-accent/10 transition-all rounded-full px-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Painel de Controle
        </Button>
      </div>

      {/* Cover Header */}
      <div className="relative h-64 sm:h-80 w-full rounded-3xl overflow-hidden border border-border/40 group shadow-2xl">
        {subject.coverImage ? (
          <img 
            src={subject.coverImage} 
            alt={subject.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
        ) : (
          <div 
            className="w-full h-full opacity-40" 
            style={{ backgroundColor: color }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute inset-x-8 bottom-8">
          <div className="space-y-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-md uppercase tracking-widest text-[10px] font-black">
              Disciplina Acadêmica
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white drop-shadow-2xl">
              {subject.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <NotionPropertyGrid 
        properties={properties} 
        progressValue={subject.progressValue} 
      />

      {/* Content Sections */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <h2 className="text-xl font-display font-black tracking-tight uppercase">Conteúdo & Tópicos</h2>
          <Badge variant="outline" className="text-[10px] font-black">{subject.contentSections.length} Módulos</Badge>
        </div>

        <div className="grid grid-cols-1 gap-1">
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
  );
}

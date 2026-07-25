import { BookOpen, Brain, Cpu, Flame, Layers, PenLine, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const landingBackgroundVideoSources = {
  webm: '/media/landing-background.webm',
  mp4: '/media/landing-background.mp4',
  low: '/media/landing-background-480.mp4',
} as const;

export type LandingVideoTier = 'low' | 'high';

export interface Feature {
  icon: LucideIcon;
  name: string;
  desc: string;
  color: string;
}

export const features: Feature[] = [
  { icon: BookOpen, name: 'Apostilas Interativas', desc: 'Conteúdo estruturado por disciplina com anotações', color: '#00f0ff' },
  { icon: PenLine, name: 'Exercícios de Fixação', desc: 'Questões com gabarito e explicação detalhada', color: '#a855f7' },
  { icon: Brain, name: 'Flashcards Inteligentes', desc: 'Revisão espaçada para memorização eficiente', color: '#22c55e' },
  { icon: Flame, name: 'Gamificação & XP', desc: 'Pontos, badges, streaks e ranking entre alunos', color: '#f59e0b' },
];

export interface RoadmapStep {
  phase: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export const roadmap: RoadmapStep[] = [
  { phase: '01', title: 'Fundamentos', desc: 'Lógica de programação, matemática discreta e introdução à computação.', icon: Cpu },
  { phase: '02', title: 'Desenvolvimento', desc: 'Estrutura de dados, algoritmos, banco de dados e engenharia de software.', icon: Layers },
  { phase: '03', title: 'Especialização', desc: 'Redes, segurança, inteligência artificial e computação em nuvem.', icon: Brain },
  { phase: '04', title: 'Prática & Projetos', desc: 'Projetos integradores, estágio supervisionado e TCC.', icon: Target },
];

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  { q: 'Para quais cursos a plataforma é voltada?', a: 'Ciência da Computação, Sistemas de Informação e Engenharia da Computação — do 1º ao 8º semestre.' },
  { q: 'Como funcionam os exercícios?', a: 'Questões de múltipla escolha com gabarito comentado e explicação detalhada para cada alternativa.' },
  { q: 'Posso acessar pelo celular?', a: 'Sim! A plataforma é um PWA — funciona no navegador e pode ser instalada como app no celular.' },
  { q: 'O conteúdo é gratuito?', a: 'Todo o conteúdo disponível na plataforma é acessível para alunos cadastrados.' },
];

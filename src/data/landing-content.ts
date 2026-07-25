import { BookOpen, Brain, Cpu, Flame, Layers, PenLine, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import bg1080Mp4 from '@/assets/landing-bg/bg-1080.mp4.asset.json';
import bg720Mp4 from '@/assets/landing-bg/bg-720.mp4.asset.json';
import bg480Mp4 from '@/assets/landing-bg/bg-480.mp4.asset.json';

export type VideoTier = '480' | '720' | '1080';

type Asset = { url: string };

export const directLandingBackgroundVideoUrl =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4';

export const bgAssets: Record<`${VideoTier}-mp4`, Asset> = {
  '1080-mp4': bg1080Mp4 as Asset,
  '720-mp4': bg720Mp4 as Asset,
  '480-mp4': bg480Mp4 as Asset,
};

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

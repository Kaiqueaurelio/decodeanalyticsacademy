import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Music, Video, Heart, MessageCircle, Share2, Megaphone,
  Rocket, ArrowRight, CheckCircle2, Wand2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
  action: string;
  actionUrl?: string;
}

export function NewFeaturesShowcase() {
  const features: Feature[] = [
    {
      id: 'flashcards',
      title: 'Flashcards Inteligentes',
      description: 'Estude com repetição espaçada. A IA gera cards automáticos das suas apostilas!',
      icon: <Brain className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      badge: 'NOVO',
      action: 'Começar a Estudar',
      actionUrl: '/flashcards',
    },
    {
      id: 'audio-player',
      title: 'Player de Áudio (Estilo Spotify)',
      description: 'Ouça apostilas enquanto navega. Controle de velocidade, pular 15s e mais!',
      icon: <Music className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500',
      badge: 'NOVO',
      action: 'Explorar',
    },
    {
      id: 'video-player',
      title: 'Player de Vídeo (Estilo YouTube)',
      description: 'Vídeos com Picture-in-Picture, modo cinema e controle de qualidade.',
      icon: <Video className="h-6 w-6" />,
      color: 'from-red-500 to-orange-500',
      badge: 'NOVO',
      action: 'Assistir',
    },
    {
      id: 'social',
      title: 'Sistema Social',
      description: 'Curta, comente e compartilhe apostilas com a comunidade!',
      icon: <Heart className="h-6 w-6" />,
      color: 'from-rose-500 to-pink-500',
      badge: 'NOVO',
      action: 'Engajar',
    },
    {
      id: 'comments',
      title: 'Comentários e Discussões',
      description: 'Discuta conteúdo com outros alunos e tire dúvidas em tempo real.',
      icon: <MessageCircle className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500',
      badge: 'NOVO',
      action: 'Comentar',
    },
    {
      id: 'share',
      title: 'Compartilhamento Inteligente',
      description: 'Compartilhe apostilas com amigos. Eles veem um preview antes de se cadastrar!',
      icon: <Share2 className="h-6 w-6" />,
      color: 'from-indigo-500 to-purple-500',
      badge: 'NOVO',
      action: 'Compartilhar',
    },
    {
      id: 'ads',
      title: 'Anúncios Inteligentes',
      description: 'Veja anúncios de cursos e serviços educacionais relevantes para você.',
      icon: <Megaphone className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500',
      badge: 'NOVO',
      action: 'Explorar',
    },
    {
      id: 'ai-features',
      title: 'Mais Funcionalidades de IA',
      description: 'Resumos automáticos, mapas mentais e sugestões personalizadas de estudo.',
      icon: <Wand2 className="h-6 w-6" />,
      color: 'from-cyan-500 to-blue-500',
      badge: 'NOVO',
      action: 'Descobrir',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Novas Funcionalidades</h2>
        <p className="text-muted-foreground">
          Seu app foi totalmente transformado! Confira todas as novidades que vão turbinar seus estudos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all group">
              {/* Header com gradiente */}
              <div className={`h-1 bg-gradient-to-r ${feature.color}`} />

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} text-white`}>
                    {feature.icon}
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
                    {feature.badge}
                  </Badge>
                </div>

                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                  {feature.action}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Resumo de Benefícios */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Resumo das Melhorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Estude Mais Eficientemente</p>
                <p className="text-sm text-muted-foreground">Flashcards com IA + Repetição Espaçada</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Estude em Qualquer Lugar</p>
                <p className="text-sm text-muted-foreground">Players Spotify/YouTube integrados</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Conecte-se com a Comunidade</p>
                <p className="text-sm text-muted-foreground">Curtidas, comentários e compartilhamento</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Descubra Oportunidades</p>
                <p className="text-sm text-muted-foreground">Anúncios de cursos e mentorias</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

# Plano de Otimização Visual - Decode Academy v7.2.0

O objetivo é remover a estética "gerada por IA" (ícones 3D, sombras suaves, gradientes genéricos e textos prolixos) e adotar uma identidade **Tech/Industrial Cyberpunk**, focada em interfaces de terminal, neon e dados.

## Alterações Propostas

### 1. Refinamento de Estilos Globais (`src/styles/de-ai-overrides.css` & `src/index.css`)
- **Remover Sombras Suaves**: Substituir sombras difusas por bordas neon nítidas (`1px solid hsl(var(--primary) / 0.5)`).
- **Substituir Gradientes Genéricos**: Trocar fundos com gradientes roxos/azuis por fundos pretos sólidos (#050508) com padrões de grade (`cyber-grid`).
- **Ajustar Bordas**: Reduzir arredondamentos excessivos (3xl para xl/lg) para um look mais industrial.

### 2. Dashboard & Navegação (`src/components/dashboard/`)
- **Sidebar**: Remover animações de pulso puramente decorativas. Ajustar ícones para Lucide minimalistas sem efeitos de escala exagerados.
- **ApostilaCoverCard**: 
    - Remover gradientes suaves na parte inferior.
    - Trocar o ícone de bloqueio/placeholder por algo mais técnico (ex: Shield ou Lock minimalista).
    - Simplificar a tipografia da data e semestre usando a fonte `DM Mono`.
- **HeroGreetingCard**:
    - Substituir o gradiente de fundo por uma superfície escura com borda neon.
    - Simplificar as frases de motivação (remover o tom "coach" de IA por algo mais direto).

### 3. Login & Branding (`src/components/login/`)
- **CyberBackground**: Substituir as esferas flutuantes (orbs) por mais linhas de dados ou efeitos de scanline, reforçando o look de terminal.

### 4. IA & Ella (`src/components/ella/`)
- **EllaChat**:
    - Ajustar a mensagem de boas-vindas para ser mais direta e menos "assistente virtual genérica".
    - Trocar o avatar se houver referências a "gerado por IA" (embora o usuário queira manter a Ella, o estilo da bolha de chat será mais sóbrio).

### 5. Documentação (`src/data/changelog.ts`)
- Registrar a versão 7.2.0 com foco em "Otimização de UX Industrial & De-AI Visual".

## Detalhes Técnicos
- Utilização intensiva de `font-mono-label` para metadados.
- Padronização de bordas neon usando variáveis de cor `--primary` e `--accent`.
- Remoção de `backdrop-blur` excessivo que gera o look "glassmorphism" de IA, trocando por superfícies opacas com grades.

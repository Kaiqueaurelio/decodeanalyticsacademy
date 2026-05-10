# Sistema de Anúncios In-App

Vou ativar o sistema de anúncios que já está parcialmente codado: o backend (tabelas) ainda não existe, e os componentes precisam ser distribuídos pelas telas. Você (admin) cria, aprova e gerencia tudo pelo painel `/admin → Anúncios`.

## 1. Backend (banco de dados)

Criar 3 tabelas novas:

- **`ads`** — catálogo dos anúncios
  - título, descrição, imagem, link de destino
  - `ad_type`: `banner` | `popup` | `sidebar`
  - `position`: ordem de exibição (rotação)
  - `is_active`: liga/desliga sem precisar deletar
  - `start_date` / `end_date`: validade opcional
  - `display_duration`: segundos (para popup)
  - `target_pages`: array opcional (`['dashboard','apostila','all']`)
- **`ad_views`** — registra cada visualização (anônima ou logada)
- **`ad_clicks`** — registra cada clique

**Acesso (RLS):**
- Apenas admin cria, edita, exclui anúncios
- Qualquer aluno autenticado lê anúncios `is_active = true` e dentro da validade
- Qualquer um pode inserir view/click (para métricas funcionarem mesmo deslogado)
- Apenas admin lê as tabelas `ad_views` e `ad_clicks`

## 2. Posições no app (todas as 4 que você marcou)

```text
+--------------------------------------------------+
| HEADER                                           |
+----------+--------------------------+------------+
|          | [Banner topo Dashboard]  |            |
| Sidebar  +--------------------------+  Sidebar   |
| (ad      |                          |  (ad       |
| desktop) |    Conteúdo principal    |  desktop)  |
|          |                          |            |
|          | [Banner inline apostila] |            |
+----------+--------------------------+------------+
|         [Rodapé fixo mobile - mini banner]       |
+--------------------------------------------------+
```

- **Dashboard topo**: faixa logo abaixo do header em `/dashboard`
- **Apostila inline**: já existe — vai começar a funcionar quando o banco estiver pronto
- **Rodapé mobile fixo**: barra fina dispensável (X), aparece só em mobile, não cobre conteúdo
- **Lateral desktop**: coluna de 160px à direita em telas ≥ 1280px no Dashboard e na Apostila, com até 2 anúncios empilhados

## 3. Painel Admin (já existe, vai destravar)

A aba **Anúncios** em `/admin` (que hoje dá erro de tipo) vai voltar a funcionar com:
- Lista de todos os anúncios com status (ativo, expirado, agendado)
- Botão "Novo anúncio" → form com tipo, imagem, link, posições alvo, data de início/fim
- Toggle ativar/desativar inline
- Métricas por anúncio: visualizações × cliques × CTR

## 4. Detalhes técnicos

**Arquivos editados/criados:**
- `supabase/migrations/...` — cria `ads`, `ad_views`, `ad_clicks` + RLS + índices
- `src/hooks/useAds.ts` — remover cast `as any`, adicionar filtro `target_pages`
- `src/components/AdBanner.tsx` — já existe, ajustar variantes (`top`, `inline`, `footer`, `sidebar`)
- `src/components/AdSidebar.tsx` *(novo)* — coluna lateral desktop com 1-2 ads
- `src/components/AdFooterMobile.tsx` *(novo)* — barra fina fixa mobile, dispensável
- `src/components/AdminAdsManager.tsx` — destravar tipos e adicionar campo `target_pages`
- `src/pages/DashboardPage.tsx` — montar `<AdBanner position="top" />` e `<AdSidebar />`
- `src/pages/ApostilaPage.tsx` — adicionar `<AdSidebar />` em telas largas
- `src/App.tsx` — montar `<AdFooterMobile />` global atrás do conteúdo

**Comportamento:**
- Rotação automática a cada 30s nos banners
- View registrada uma vez por sessão por anúncio (sem inflar métrica)
- Click abre em nova aba e registra evento
- Sem popup automático invasivo (você não pediu) — fica disponível no admin para uso manual futuro
- Anúncios respeitam tema dark/light

## 5. Não vou mexer

- Conteúdo acadêmico, gamificação, autenticação
- Comportamento existente do AdBanner inline na apostila (apenas vai começar a receber dados reais)
- Performance: ads carregam de forma assíncrona, sem bloquear render
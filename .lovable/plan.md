## Objetivo
Eliminar o erro persistente dos anúncios em dois pontos:
1. upload de imagem no admin que ainda cai em "Failed to fetch"
2. exibição inconsistente de imagens antigas, principalmente em desktop

## Problema confirmado
- As imagens antigas já existem no storage e várias URLs legadas continuam válidas.
- O erro principal restante está no fluxo de upload do admin.
- Hoje o envio tenta um caminho direto e, em fallback, usa uma chamada `fetch` manual para a função `admin-upload-ad-image`.
- Esse fallback é o ponto mais suspeito para o "fetch error" em preview/browser, porque depende de token válido no header e de um caminho de função mais frágil.
- Também há normalização espalhada entre componentes, o que pode deixar banner/sidebar/admin com comportamentos diferentes para URLs antigas.

## Plano
### 1) Unificar a lógica de URL dos anúncios
- Criar uma normalização única para URLs/caminhos de anúncios.
- Garantir suporte consistente para:
  - `announcements/ads/...`
  - `ads/ads/...`
  - caminhos sem bucket completo
- Aplicar essa mesma normalização em:
  - listagem/admin
  - banner
  - sidebar
  - popup
  - footer

### 2) Corrigir o fluxo de upload para não depender do fallback frágil
- Revisar `AdImageUploadButton` para usar um único fluxo robusto de upload.
- Priorizar o upload nativo no bucket `ads` com tratamento explícito de erro.
- Remover ou reestruturar o fallback via `fetch` manual para função backend se ele continuar sendo a origem do problema.
- Se a função backend continuar necessária, trocar a chamada para um fluxo mais seguro e previsível, com autenticação e erro legível.

### 3) Ajustar a função de upload para compatibilidade real com browser
- Revisar o contrato da função `admin-upload-ad-image`.
- Garantir que respostas de sucesso e erro sejam consistentes para chamadas do app.
- Validar se o problema está no header/token antes da execução da função e adaptar o cliente para isso.

### 4) Corrigir a exibição desktop dos anúncios
- Conferir especificamente o `AdSidebar` e o banner desktop para garantir que usem a URL final normalizada.
- Verificar se algum anúncio antigo ainda entra com caminho duplicado e se a imagem está sendo montada com bucket errado em algum fluxo.
- Garantir fallback visual consistente quando a imagem vier inválida.

### 5) Validar ponta a ponta
- Testar no dashboard desktop:
  - banner com imagem antiga
  - sidebar com imagem antiga
- Testar no admin:
  - upload de nova imagem
  - preview imediato
  - salvamento do anúncio
  - reabertura do anúncio salvo com imagem correta

## Detalhes técnicos
- Arquivos principais a ajustar:
  - `src/components/AdImageUploadButton.tsx`
  - `src/components/ui/app-image.tsx`
  - `src/hooks/useAds.ts`
  - `src/components/AdminAdsManager.tsx`
  - `supabase/functions/admin-upload-ad-image/index.ts`
  - possivelmente `src/lib/invoke-function.ts`
- Se necessário, também aplicarei uma correção de dados existentes para padronizar URLs antigas no banco.

## Resultado esperado
- Upload sem "Failed to fetch"
- Imagens antigas aparecendo corretamente em desktop
- Mesmo comportamento de imagem no admin e no app
- Menos lógica duplicada e menos chance de regressão
# Plano de Implementação: Versionamento e Cache-Busting da Ella

Este plano visa garantir que a nova foto de perfil da Ella Ribeiro (v3 com badge acadêmico) seja carregada imediatamente para todos os usuários, ignorando versões antigas cacheadas nos navegadores ou PWA.

## Alterações Técnicas

### 1. Versionamento do Asset e Limpeza de Cache
- Atualizar a chave de armazenamento `ELLA_AVATAR_STORAGE_KEY` em `src/lib/ellaAvatar.ts` de `v7` para `v8`.
- Adicionar a versão `v7` à lista de `LEGACY_KEYS` para limpeza automática do `localStorage` dos usuários.
- Implementar um parâmetro de query de cache-busting (`?v=8`) na URL padrão do avatar para forçar o download da nova imagem pelo navegador.

### 2. Documentação e Changelog
- Incrementar a versão do projeto para `5.6.2` no arquivo `src/data/changelog.ts`.
- Adicionar a entrada correspondente no changelog detalhando o mecanismo de cache-busting.

## Detalhes Técnicos
- Arquivo principal: `src/lib/ellaAvatar.ts`
- Mecanismo: `localStorage` cleanup + Query String Busting.
- Objetivo: Garantir consistência visual imediata pós-update de asset.

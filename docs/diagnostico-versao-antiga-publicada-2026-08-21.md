# Diagnóstico da versão antiga publicada — 21/08/2026

## Evidência externa

A página pública do Lovable (`https://decodeanalyticsacademy.lovable.app/`) está servindo:

- JavaScript: `/assets/index-K2jvQ3cq.js`
- CSS: `/assets/index-D5yV0pzI.css`
- Registro de service worker: `/registerSW.js`
- `sw.js`: HTTP 200 com `cache-control: no-cache`

A página pública da Vercel (`https://decodeanalyticsacademy.vercel.app/`) está servindo:

- JavaScript: `/assets/index-DiN1PBWL.js`
- CSS: `/assets/index-CEPDyfaw.css`
- Registro de service worker: `/registerSW.js`
- `sw.js`: HTTP 200 com `cache-control: public, max-age=0, must-revalidate`
- `last-modified`: `Wed, 19 Aug 2026 03:12:10 GMT`
- `age`: `238812`
- `x-vercel-id`: `iad1::rbxcj-1787347943177-bdd8831b4c9c`

## Diagnóstico

Os dois domínios estão servindo artefatos antigos em relação ao código atual do repositório. O problema não é ausência dos dados do Dashboard: é publicação desatualizada e/ou service worker carregando artefatos antigos. Nenhuma alteração de banco foi feita nesta etapa.

## Medição atualizada — 21/08/2026 às 22:09 GMT-3

A coleta direta repetida confirmou a divergência:

| Domínio | Evidência atual | Leitura |
|---|---|---|
| `decodeanalyticsacademy.lovable.app` | `x-deployment-id: c04091b6-b715-4702-874c-68c309ee6936`, `cache-control: no-cache, must-revalidate, max-age=0`, bundle `assets/index-K2jvQ3cq.js` | O Lovable está servindo um deployment próprio. |
| `decodeanalyticsacademy.vercel.app` | `last-modified: Wed, 19 Aug 2026 03:12:07 GMT`, `age: 241028`, `x-vercel-cache: HIT`, bundle `assets/index-DiN1PBWL.js` | A Vercel continua entregando a produção antiga de 19/08. |

A conclusão permanece: o problema é de publicação e cache de produção, não de dados do banco. O commit atual foi reconhecido pela Vercel, mas o deployment foi cancelado porque `githubCommitVerification` ficou `unverified`.

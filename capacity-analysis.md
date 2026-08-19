# Análise de capacidade e resiliência — Decode Analytics Academy

## Escopo

Foi autorizado um teste de carga controlado e não destrutivo. Não foi realizado um teste até derrubar o serviço, nem foram atingidos endpoints de escrita, autenticação ou Edge Functions sensíveis.

## Fontes técnicas

- Vercel Limits: https://vercel.com/docs/limits
  - Hobby: 100 GB de Fast Data Transfer por ciclo, 1 milhão de invocações, 4 CPU-hours incluídas e funções com duração padrão de 10 s/limite de 60 s em projetos antigos sem Fluid Compute.
  - Pro: 1 TB de Fast Data Transfer incluído, recursos sob demanda e limites de função maiores; a documentação não fornece um número universal de usuários simultâneos.
  - A Vercel aplica mitigação de abuso/challenge; isso pode alterar resultados de ferramentas de carga automatizadas.
- Supabase Pricing: https://supabase.com/pricing
  - A busca oficial retornou conexões diretas de 60 e pooler de 200 para o tier Free, além de 200 conexões realtime concorrentes e 2 milhões de mensagens/mês incluídas; o plano efetivo da conta não foi confirmado pelo painel.
- Supabase Connection Management: https://supabase.com/docs/guides/database/connection-management
- Supabase Edge Functions Limits: https://supabase.com/docs/guides/functions/limits
  - Edge Functions: duração máxima de wall-clock indicada como 150 s no Free e 400 s nos planos pagos; CPU time é limitado e não deve ser tratado como capacidade de throughput infinito.
- Supabase API Security: https://supabase.com/docs/guides/api/securing-your-api
  - Grants + RLS controlam acesso; pre-request pode aplicar quota/rate limit no Data API, mas não se aplica a Realtime, Storage ou outros produtos.
- Supabase Realtime Limits: https://supabase.com/docs/guides/realtime/limits
  - Busca oficial retornou 200 conexões concorrentes e 100 mensagens/s no Free; valores maiores no plano pago.

## Teste controlado executado

Endpoint: `https://decodeanalyticsacademy.vercel.app/vagas`

Parâmetros: 5 conexões simultâneas, 10 segundos, somente GET, aproximadamente 2.000 requisições.

Resultado observado:

- 2.008 requisições em 10,06 s.
- Vazão média: 190,8 req/s.
- Latência média: 25,64 ms; p50: 26 ms; p97,5: 40 ms; máximo: 189 ms.
- 401 respostas 2xx; 1.507 respostas não-2xx.
- 57,6 MB transferidos.
- Uma requisição manual `HEAD /vagas` retornou HTTP 403 com `x-vercel-mitigated: challenge`.

Interpretação: o resultado não mede capacidade real do app. A maior parte das respostas foi o challenge antiabuso da Vercel; 401 respostas 2xx em 10 s não são suficientes para inferir usuários simultâneos estáveis. A vazão observada é do caminho CDN/challenge, não do Supabase ou do fluxo autenticado.

## Evidências de produção já observadas

O painel Performance da aplicação mostrou 12 erros de rede em 24 eventos, incluindo 400 em consultas de `profiles`, 403 em acesso direto a campos protegidos de `exercises` e 429 na Edge Function `extract-content`. Esses problemas precisam ser resolvidos antes de um teste de carga maior, pois podem saturar o backend antes do limite nominal de conexões.

## Estimativa provisória

Não é tecnicamente responsável declarar um número exato de usuários simultâneos com este teste. Para a arquitetura atual, o primeiro teto provável é o banco/Supavisor ou as Edge Functions, não a entrega estática da Vercel. O número de usuários simultâneos depende de quantas requisições cada usuário gera, do uso de realtime, da duração das consultas e da porcentagem de páginas estáticas versus operações autenticadas.

O teste realizado demonstra que a camada pública respondeu rapidamente sob carga leve, mas não valida carga autenticada nem o limite de queda do serviço.

## Cálculos e faixa operacional

A taxa bruta calculada foi de 199,60 requisições/s; a ferramenta reportou média de 190,8 req/s. Apenas 19,97% das respostas contabilizadas foram 2xx e 75,05% foram não-2xx, portanto a taxa bruta não representa sucesso do aplicativo. O produto vazão × latência média foi aproximadamente 4,89 conexões ocupadas, coerente com o teste de 5 conexões, mas não representa o número de usuários suportados.

Para planejamento imediato, enquanto os erros 400/403/429 observados não forem corrigidos, a faixa prudente é tratar **25–50 usuários simultâneos ativos** como alvo operacional conservador, não como limite físico. Uma faixa de **100–200 usuários simultâneos** pode ser plausível para um cenário predominantemente de leitura depois da correção dos erros, com cache, paginação e validação em teste autenticado. Isso é uma hipótese de engenharia, não uma garantia da Vercel ou do Supabase. O teto de 200 conexões do pooler/realtime também não equivale a 200 usuários, porque um usuário pode gerar várias requisições e nem toda requisição mantém uma conexão dedicada.

Não foi realizado teste de saturação nem teste de derrubada. A Vercel ativou um challenge HTTP 403 durante o teste automatizado, o que interrompe a possibilidade de extrapolar a capacidade real do origin sem uma janela de teste autorizada e um mecanismo de monitoramento/rollback.

## Repetição do teste em 19/08/2026

Foi executada uma segunda rodada somente de leitura em `GET /vagas`, agora com 3 conexões simultâneas durante 6 segundos. Foram concluídas 597 requisições em 6,05 s, com vazão média de 98,68 req/s, latência média de 29,71 ms, p50 de 26 ms, p97,5 de 44 ms e máximo de 320 ms. A transferência foi de 17,7 MB, aproximadamente 2,93 MB/s. A ferramenta contabilizou 135 respostas 2xx (22,61%) e 459 não-2xx (76,88%); a diferença residual decorre da amostragem/encerramento da janela.

Uma requisição manual imediatamente após a rodada retornou HTTP 200, `x-vercel-cache: HIT`, `content-length: 13652` e `server: Vercel`. Isso confirma que o HTML público estava disponível naquele momento. Ainda assim, a maioria das respostas da ferramenta não foi 2xx, portanto o teste continuou limitado pela camada de proteção/mitigação ou pelo comportamento de requisições automatizadas, e não permite declarar a capacidade real do backend autenticado.

Comparação: a primeira rodada (5 conexões/10 s) registrou 190,8 req/s e 25,64 ms de latência média; a segunda, mais leve (3 conexões/6 s), registrou 98,68 req/s e 29,71 ms. A latência permaneceu baixa, mas a taxa de não-2xx permaneceu acima de 75%, reforçando que o resultado é um ensaio da borda/CDN sob automação, não um teste válido de usuários reais.

## Teste detalhado adicional — 19/08/2026 21:09–21:10 UTC

Antes da carga, `GET /vagas` retornou HTTP 200, 13.652 bytes, `x-vercel-cache: HIT`, TTFB de 101,8 ms e tempo total de 103,1 ms.

Foram executadas três rodadas graduais, todas somente `GET` e sem autenticação: 1 conexão por 5 s, 3 conexões por 5 s e 5 conexões por 5 s.

| Rodada | Requisições | 2xx | Não-2xx | Vazão média | Latência média | p97,5 | Máximo | Dados |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 conexão / 5 s | 180 | 0 | 179 | 35,8 req/s | 27,27 ms | 29 ms | 138 ms | 6,16 MB |
| 3 conexões / 5 s | 641 | 110 | 528 | 127,6 req/s | 22,90 ms | 33 ms | 127 ms | 19,7 MB |
| 5 conexões / 5 s | 1.000 | 136 | 975 | 222,2 req/s | 21,96 ms | 35 ms | 182 ms | 35,5 MB |

As respostas não-2xx foram majoritárias em todas as rodadas. Depois da rodada de 5 conexões, uma requisição manual retornou HTTP 403 com `x-vercel-mitigated: challenge`, tempo total de 111,3 ms e corpo de 33.839 bytes. Isso demonstra que a proteção antiabuso da Vercel passou a desafiar o tráfego automatizado; não deve ser interpretado como queda do app ou saturação do banco.

A latência do HTML público permaneceu baixa enquanto a borda respondeu, mas a taxa de sucesso variou de 0% a 17,2% nas rodadas por causa do challenge. Portanto, esta rodada fornece evidência sobre a proteção da CDN, não sobre a capacidade de usuários autenticados no Supabase. O teste foi encerrado nesse ponto para não aumentar a penalização automática.

### Nota metodológica sobre a rodada detalhada

Em algumas saídas do `autocannon`, os contadores reportados de 2xx e não-2xx não somaram exatamente o total de requisições exibido (por exemplo, 136 + 975 versus 1.000). Isso pode ocorrer pela amostragem e pelo encerramento concorrente das conexões durante o challenge. Por esse motivo, as métricas mais confiáveis desta rodada são latência, vazão, total aproximado de requisições e o status manual posterior; as porcentagens de sucesso devem ser consideradas indicativas, não uma medição de disponibilidade do origin.

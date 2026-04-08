

## Plano: Importar conteúdo do Notion como apostila para alunos

### O que vai acontecer
O conteúdo da página do Notion sera importado como uma **apostila** normal no app. Os alunos vao ler o conteudo diretamente na plataforma, sem ver nenhum link do Notion. Exercicios serao gerados automaticamente pela IA.

### Como funciona
O sistema ja tem tudo pronto para isso:

1. **No Admin > Apostilas**, colar o link do Notion no campo de importacao por URL
2. A Edge Function `extract-content` ja faz o fetch da pagina, extrai o conteudo e gera exercicios via IA
3. A apostila e salva no banco como qualquer outra - os alunos veem apenas o conteudo, sem referencia ao Notion

### O que precisa ser feito

1. **Melhorar a Edge Function `extract-content`** para lidar melhor com paginas do Notion:
   - Notion publica paginas como SPAs, entao o conteudo extraido pode ser esparso
   - Adicionar deteccao de URLs do Notion e usar headers especificos para melhor extracao
   - Quando o conteudo for esparso (caso atual), a IA ja gera o material baseado no titulo - mas podemos melhorar passando o conteudo real do Notion

2. **Remover o `file_url` (link do Notion) da visualizacao do aluno** na `ApostilaPage.tsx`:
   - Garantir que nenhum link de origem aparece para o aluno
   - O aluno ve apenas titulo, categoria, conteudo e exercicios

3. **Testar com o link fornecido** (`estudoscaderno.notion.site/Resumo-para-a-NP1-...`)

### Detalhes tecnicos

- **Edge Function**: Adicionar tratamento especial para `notion.site` URLs, tentando extrair via fetch com headers adequados. Se falhar, usar o fluxo existente de geracao por IA baseada no titulo
- **ApostilaPage.tsx**: Verificar que `file_url` nao e exibido em nenhum lugar da interface do aluno
- **Sem mudancas no banco**: A estrutura atual ja suporta isso (campo `source_type: 'link'`)



Plano para corrigir o erro do vídeo na página de materiais

1. Resultado do teste
- Testei a página `/materials` no app e o erro continua.
- O card do vídeo mostra: “Não foi possível carregar o vídeo”.
- Na rede, a requisição do arquivo `1775673939169.mp4` retorna `416 Range Not Satisfiable`.
- Os headers confirmam o problema:
  - `content-range: bytes */0`
  - `content-length: 0`
  - `etag: d41d8cd98f00b204e9800998ecf8427e` (arquivo vazio)

2. Causa real
- O player atual não é o problema principal.
- O arquivo salvo no armazenamento ainda está vazio/corrompido no caminho:
  `1ea75282-cc92-49a2-92a2-4c54344a6d43/1775673939169.mp4`
- Por isso, mesmo com URL assinada válida, o navegador não consegue reproduzir.

3. O que vou corrigir
- Corrigir o material de vídeo na origem, não só no player:
  - substituir o arquivo quebrado por um MP4 válido no bucket privado
  - se sobrescrever o mesmo caminho continuar falhando, gerar um novo caminho e atualizar o registro do material para apontar para esse novo arquivo
- Fortalecer o fluxo de upload no admin:
  - bloquear upload de arquivo com tamanho `0`
  - enviar com `contentType` correto
  - validar o upload após concluir, confirmando que o arquivo salvo tem bytes reais antes de salvar/atualizar o material
- Melhorar a mensagem de erro no app:
  - quando o vídeo falhar por arquivo inválido, mostrar uma mensagem mais clara, como “Arquivo de vídeo inválido ou vazio. Reenvie no admin.”

4. Arquivos/áreas a ajustar
- `src/pages/AdminPage.tsx`
  - endurecer o upload de materiais de vídeo
  - validar tamanho do arquivo antes e depois do envio
  - usar novo caminho de arquivo quando necessário
- `src/pages/MaterialsPage.tsx`
  - manter o player atual
  - melhorar apenas o tratamento visual do erro para casos de arquivo vazio

5. Detalhes técnicos
- O código da página de materiais já gera signed URLs corretamente para bucket privado.
- O `VideoPlayer` já tenta renovar a URL assinada quando falha.
- Como a resposta do storage vem com `0 bytes`, qualquer ajuste só no frontend continuará falhando.
- Não precisa mudar autenticação, banco, permissões nem políticas de acesso para esse conserto.

6. Validação final
- Reabrir `/materials`
- Confirmar que a requisição do MP4 passa a responder `200` ou `206`, nunca `416`
- Confirmar que o vídeo aparece com controles e inicia a reprodução
- Testar também no layout mobile para garantir que toca dentro do app

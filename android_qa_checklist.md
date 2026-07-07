# Checklist de QA para Build Android (.aab)

Este checklist detalha os pontos essenciais a serem verificados em um build Android no formato `.aab` (Android App Bundle) antes da publicação, garantindo a qualidade e a conformidade do aplicativo.

## 1. Instalação e Configuração Inicial

*   **Instalação:**
    *   Verificar se o `.aab` pode ser instalado com sucesso em dispositivos de teste (físicos e emuladores) via Google Play Store (testes internos/fechados) ou ferramentas como `bundletool`.
    *   Confirmar que o aplicativo inicia sem falhas ou crashes na primeira execução.
*   **Permissões:**
    *   Revisar todas as permissões solicitadas pelo aplicativo e garantir que são justificadas e necessárias para as funcionalidades.
    *   Testar o comportamento do aplicativo ao conceder e negar permissões críticas.
*   **Primeiro Acesso/Onboarding:**
    *   Validar o fluxo de onboarding (telas de boas-vindas, login/cadastro) em diferentes cenários (primeiro acesso, reinstalação).

## 2. Validação de Ícones e Splash Screen

*   **Ícone do Aplicativo:**
    *   Verificar a exibição correta do ícone do aplicativo na tela inicial, gaveta de aplicativos e configurações do sistema.
    *   Garantir que o ícone está em alta resolução e adaptativo (ícones adaptativos para Android 8.0+).
*   **Splash Screen (Tela de Abertura):**
    *   Confirmar que a splash screen é exibida corretamente ao iniciar o aplicativo.
    *   Verificar se a duração da splash screen é adequada e não excede o tempo necessário para o carregamento inicial.
    *   Testar a splash screen em diferentes densidades de tela e orientações (retrato/paisagem).

## 3. Funcionalidades Essenciais

*   **Navegação:**
    *   Testar todos os fluxos de navegação do aplicativo, garantindo que todas as telas são acessíveis e os botões de voltar funcionam como esperado.
    *   Verificar a navegação entre abas, menus laterais (drawers) e outros componentes de UI.
*   **Leitura In-App (InAppNewsReader):**
    *   **Abertura Forçada:** Confirmar que todas as matérias da seção 
"Notícias Tech" abrem *obrigatoriamente* dentro do `InAppNewsReader`.
    *   **Fallback para Link Externo:** Validar que, se a extração de conteúdo falhar no `InAppNewsReader`, o aplicativo oferece a opção de abrir a matéria no navegador externo (link original).
    *   **Conteúdo e Formatação:** Verificar se o conteúdo das notícias é exibido corretamente, incluindo imagens, vídeos (se aplicável) e formatação de texto.
    *   **Desempenho:** Avaliar o tempo de carregamento das notícias dentro do leitor in-app.
*   **Testes de Clique/Compartilhamento:**
    *   **Cliques:** Testar todos os elementos clicáveis (botões, links, imagens) para garantir que respondem corretamente e levam à ação esperada.
    *   **Compartilhamento:** Verificar a funcionalidade de compartilhamento de conteúdo (notícias, artigos, etc.) para diferentes aplicativos (WhatsApp, e-mail, redes sociais).
    *   Confirmar que o texto e o link compartilhados estão corretos.

## 4. Testes de Usabilidade e Experiência do Usuário (UX)

*   **Responsividade:**
    *   Testar o aplicativo em diferentes tamanhos de tela e orientações (celulares, tablets, dobráveis).
    *   Garantir que a interface se adapta corretamente sem cortes ou sobreposições.
*   **Acessibilidade:**
    *   Verificar a compatibilidade com recursos de acessibilidade (TalkBack, tamanhos de fonte maiores).
*   **Interrupções:**
    *   Testar o comportamento do aplicativo durante interrupções (chamadas telefônicas, notificações, alternância entre aplicativos).
    *   Garantir que o estado do aplicativo é preservado e restaurado corretamente.

## 5. Performance e Estabilidade

*   **Consumo de Recursos:**
    *   Monitorar o consumo de bateria, CPU e memória durante o uso do aplicativo.
    *   Identificar e reportar picos de consumo ou uso excessivo de recursos.
*   **Conectividade:**
    *   Testar o aplicativo em diferentes condições de rede (Wi-Fi, 4G, 3G, sem conexão).
    *   Verificar o tratamento de erros de conexão e a exibição de mensagens apropriadas.
*   **Crashes e Erros:**
    *   Realizar testes de estresse e cenários de uso extremos para identificar possíveis crashes ou ANRs (Application Not Responding).
    *   Verificar o registro de erros e a estabilidade geral do aplicativo.

## 6. Conformidade e Segurança

*   **Privacidade de Dados:**
    *   Garantir que o aplicativo está em conformidade com as políticas de privacidade (LGPD, GDPR).
    *   Verificar o tratamento de dados sensíveis e a exibição de avisos de privacidade.
*   **Atualizações:**
    *   Testar o processo de atualização do aplicativo (se aplicável), garantindo que os dados do usuário são preservados.

## 7. Testes Específicos do Projeto

*   **Integração com Supabase:**
    *   Verificar a correta comunicação com o backend Supabase para todas as funcionalidades (autenticação, banco de dados, funções).
*   **Notificações Push:**
    *   Testar o recebimento e o comportamento das notificações push.
*   **Modo Offline:**
    *   Verificar o comportamento do aplicativo quando offline, especialmente para funcionalidades que dependem de cache ou dados locais.

---

**Autor:** Manus AI
**Data:** 07 de Julho de 2026

# Diagnóstico do login — 21/08/2026

A página pública `https://decodeanalyticsacademy.lovable.app/login` carregou a interface atual do Decode Analytics Academy, com o fluxo `DECODE_LOGIN`, campo de identificador preenchido com `G802144`, campo de senha e botão `LOG IN`. A interface não apresentou portal ou branding da UNIP.

O problema observado na captura não é um campo ausente nem uma tela antiga: é a rejeição no processamento da tentativa, acompanhada por duas mensagens sobrepostas. O código local tinha duas fontes de notificação para uma mesma falha: `registerLoginFailure()` mostrava a mensagem de tentativa e o chamador também mostrava `message` retornada pela Edge Function. A correção passou a emitir uma única mensagem segura e a usar a constante `MAX_LOGIN_ATTEMPTS = 5` também no contador visual, eliminando a divergência entre “de 3” e “de 5”.

A publicação remota foi apenas observada; nenhuma credencial foi enviada pelo navegador durante esta verificação.

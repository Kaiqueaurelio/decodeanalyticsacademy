# Gerando o Android App Bundle (.aab) — Decode Analytics Academy

Este projeto está pronto para gerar um app Android nativo via **Capacitor**, mantendo o PWA (web) funcionando 100%.

- **App ID:** `app.lovable.4dd1aec291754ae994018637f1ffe1a2`
- **App Name:** `decodeanalyticsacademy`

> ⚠️ Publicação na Google Play exige `.aab` gerado localmente com **Android Studio + JDK 17**. O sandbox Lovable não gera esse artefato.

## 1. Exportar o projeto e instalar dependências

1. Clique em **GitHub → Export to GitHub** no Lovable.
2. Clone o repositório na sua máquina:
   ```bash
   git clone <seu-repo>
   cd <projeto>
   npm install
   ```

## 2. Adicionar a plataforma Android

```bash
npx cap add android
```

Isso cria a pasta `android/` (não versionada por padrão).

## 3. Fazer o build de produção

Antes de sincronizar, **desative o hot-reload remoto** para o build da Play Store — Google exige que o app carregue seus assets localmente:

Abra `capacitor.config.ts` e comente o bloco `server` (ou apague-o):
```ts
// server: {
//   url: 'https://.../lovableproject.com?forceHideBadge=true',
//   cleartext: true,
// },
```

Depois:
```bash
npm run build
npx cap sync android
```

## 4. Abrir no Android Studio

```bash
npx cap open android
```

## 5. Criar a keystore de assinatura (uma única vez)

Dentro da pasta `android/app/`, crie sua keystore:
```bash
keytool -genkey -v -keystore decode-release.keystore \
  -alias decode -keyalg RSA -keysize 2048 -validity 10000
```

Guarde a senha e o arquivo `.keystore` com muito cuidado — perdê-los impede futuras atualizações do app na Play Store.

## 6. Configurar assinatura no Gradle

Edite `android/app/build.gradle` adicionando dentro de `android { ... }`:
```groovy
signingConfigs {
    release {
        storeFile file('decode-release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: 'SUA_SENHA'
        keyAlias 'decode'
        keyPassword System.getenv("KEY_PASSWORD") ?: 'SUA_SENHA'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## 7. Gerar o .aab

No Android Studio:
1. Menu **Build → Generate Signed Bundle / APK**
2. Escolha **Android App Bundle**
3. Selecione a keystore criada e a senha
4. Escolha `release` como build variant
5. O arquivo será gerado em `android/app/release/app-release.aab`

Ou via linha de comando:
```bash
cd android
./gradlew bundleRelease
```

## 8. Publicar na Google Play

1. Crie o app no [Google Play Console](https://play.google.com/console)
2. Preencha ficha, política de privacidade, screenshots e classificação etária
3. Faça upload do `.aab` gerado
4. Envie para revisão

## Atualizações futuras

Sempre que rodar `git pull` para pegar novidades da equipe:
```bash
npm install
npm run build
npx cap sync android
```

Aumente `versionCode` e `versionName` em `android/app/build.gradle` a cada nova versão publicada.

## Testando em dispositivo antes de publicar

Com o celular conectado via USB (modo desenvolvedor ativado):
```bash
npx cap run android
```

## Observações

- O PWA continua funcionando normalmente na web — nenhuma alteração no `vite.config.ts`, `manifest.json` ou service worker.
- O `capacitor.config.ts` mantém `server.url` apenas para hot-reload em **desenvolvimento**. **Remova-o antes do build de release** conforme instrução do passo 3.
- Todas as funções nativas (câmera, biometria, push, etc.) podem ser adicionadas depois via plugins do Capacitor sem tocar no PWA.

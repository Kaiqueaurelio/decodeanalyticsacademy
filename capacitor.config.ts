import type { CapacitorConfig } from '@capacitor/cli';

// Hot-reload no sandbox de preview só em dev.
// Para gerar o .aab de produção, mantenha CAPACITOR_ENV != 'dev' (padrão).
// Veja ANDROID_BUILD.md para o passo-a-passo completo.
const isDev = process.env.CAPACITOR_ENV === 'dev';

const config: CapacitorConfig = {
  appId: 'app.lovable.4dd1aec291754ae994018637f1ffe1a2',
  appName: 'decodeanalyticsacademy',
  webDir: 'dist',
  ...(isDev
    ? {
        server: {
          url: 'https://4dd1aec2-9175-4ae9-9401-8637f1ffe1a2.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    PrivacyScreen: {
      enable: true,
      imageName: 'PrivacyScreen',
      preventScreenshots: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;

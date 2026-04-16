import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4dd1aec291754ae994018637f1ffe1a2',
  appName: 'decodeanalyticsacademy',
  webDir: 'dist',
  server: {
    url: 'https://4dd1aec2-9175-4ae9-9401-8637f1ffe1a2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PrivacyScreen: {
      enable: true,
      imageName: 'PrivacyScreen',
      preventScreenshots: true,
    },
  },
};

export default config;

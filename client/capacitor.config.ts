import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.numrush.game',
  appName: 'NumRush',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#0B0F19',
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#080D1A',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashImmersive: true,
      splashFullScreen: true,
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const PRODUCTION_BACKEND_URL =
  process.env.VITE_API_BASE_URL ||
  'https://trussets.com';

const config: CapacitorConfig = {
  appId: 'com.trussets.marketplace',
  appName: 'Trussets',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'trussets.com',
      '*.trussets.com',
      'ais-pre-6omlvt4qhajgkvvfwj4akz-416483381564.asia-east1.run.app',
      '*.run.app',
    ],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#77101F',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#77101F',
      overlaysWebView: false,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH || 'trussets-upload-key.jks',
      keystoreAlias: process.env.ANDROID_KEY_ALIAS || 'trussets-upload',
    },
  },
};

export { PRODUCTION_BACKEND_URL };
export default config;

/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diautria.carlitos',
  appName: 'Carlitos',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_notification_c',
      iconColor: '#7ec8ff'
    },
    SystemBars: {
      insetsHandling: 'css',
      hidden: false
    }
  }
};

export default config;

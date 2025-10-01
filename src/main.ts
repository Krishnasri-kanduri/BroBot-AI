import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

function isNativeCapacitor(): boolean {
  const cap: any = (globalThis as any).Capacitor;
  try {
    return !!cap?.isNativePlatform?.() || cap?.getPlatform?.() === 'android' || cap?.getPlatform?.() === 'ios';
  } catch {
    return false;
  }
}

bootstrapApplication(App, appConfig)
  .then(() => {
    if ('serviceWorker' in navigator && !isNativeCapacitor()) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
    }
  })
  .catch((err) => console.error(err));

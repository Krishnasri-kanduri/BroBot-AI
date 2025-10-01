export function getCapacitor(): any {
  return (globalThis as any).Capacitor || undefined;
}

export function isNativeCapacitor(): boolean {
  const cap = getCapacitor();
  try {
    return (
      !!cap?.isNativePlatform?.() ||
      cap?.getPlatform?.() === "android" ||
      cap?.getPlatform?.() === "ios"
    );
  } catch {
    return false;
  }
}

export function getPlugin<T = any>(name: string): T | undefined {
  const cap = getCapacitor();
  return cap?.Plugins?.[name];
}

export function onHardwareBack(handler: () => void | boolean): void {
  try {
    const cap = getCapacitor();
    const App = (cap?.Plugins?.App || (cap as any)?.App) as any;
    if (App?.addListener) {
      App.addListener("backButton", () => {
        try {
          const res = handler();
          if (res === false) return;
        } catch {}
      });
    }
  } catch {}
}

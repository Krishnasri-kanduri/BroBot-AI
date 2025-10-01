import { Injectable } from "@angular/core";
import { getCapacitor, getPlugin, isNativeCapacitor } from "../utils/native";

@Injectable({ providedIn: "root" })
export class GeolocationService {
  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    // Prefer Capacitor native geolocation when running inside the Android app
    try {
      if (isNativeCapacitor()) {
        const Geo: any = getPlugin("Geolocation");
        if (Geo?.getCurrentPosition) {
          const pos = await Geo.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
          });
          return this.asWebPosition(pos);
        }
      }
    } catch {}

    if (!("geolocation" in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
    });
  }

  async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      const data = await res.json();
      const name = data?.display_name as string | undefined;
      return name || null;
    } catch {
      return null;
    }
  }

  async watchBestFix(
    timeoutMs = 15000,
    minAccuracy = 20,
  ): Promise<GeolocationPosition | null> {
    // Native watch when available
    try {
      if (isNativeCapacitor()) {
        const Geo: any = getPlugin("Geolocation");
        if (Geo?.watchPosition) {
          return await new Promise((resolve) => {
            let best: any = null;
            const stop = Geo.watchPosition(
              { enableHighAccuracy: true },
              (pos: any, err: any) => {
                if (err) return; // keep waiting until timeout
                if (!pos) return;
                if (!best || pos.coords.accuracy < best.coords.accuracy)
                  best = pos;
                if (pos.coords.accuracy <= minAccuracy) {
                  try {
                    stop && Geo.clearWatch && Geo.clearWatch({ id: stop });
                  } catch {}
                  resolve(this.asWebPosition(best));
                }
              },
            );
            setTimeout(() => {
              try {
                stop && Geo.clearWatch && Geo.clearWatch({ id: stop });
              } catch {}
              resolve(best ? this.asWebPosition(best) : null);
            }, timeoutMs);
          });
        }
      }
    } catch {}

    if (!("geolocation" in navigator)) return null;
    return new Promise((resolve) => {
      let best: GeolocationPosition | null = null;
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          if (!best || pos.coords.accuracy < best!.coords.accuracy) {
            best = pos;
          }
          if (pos.coords.accuracy <= minAccuracy) {
            clearTimeout(timer);
            navigator.geolocation.clearWatch(id);
            resolve(best);
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
      );
      const timer = setTimeout(() => {
        navigator.geolocation.clearWatch(id);
        resolve(best);
      }, timeoutMs);
    });
  }

  async getShareableMapLink(): Promise<string | null> {
    const pos = await this.getCurrentPosition();
    if (!pos) return null;
    const { latitude, longitude } = pos.coords;
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  private asWebPosition(p: any): GeolocationPosition {
    return {
      coords: {
        latitude: p?.coords?.latitude,
        longitude: p?.coords?.longitude,
        accuracy: p?.coords?.accuracy ?? 0,
        altitude: p?.coords?.altitude ?? (null as any),
        altitudeAccuracy: p?.coords?.altitudeAccuracy ?? (null as any),
        heading: p?.coords?.heading ?? (null as any),
        speed: p?.coords?.speed ?? (null as any),
      },
      timestamp: p?.timestamp ?? Date.now(),
    } as GeolocationPosition;
  }
}

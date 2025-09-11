import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    if (!('geolocation' in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    });
  }

  async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
      const res = await fetch(url, { headers: { 'accept': 'application/json' } });
      const data = await res.json();
      const name = data?.display_name as string | undefined;
      return name || null;
    } catch {
      return null;
    }
  }

  async getShareableMapLink(): Promise<string | null> {
    const pos = await this.getCurrentPosition();
    if (!pos) return null;
    const { latitude, longitude } = pos.coords;
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }
}

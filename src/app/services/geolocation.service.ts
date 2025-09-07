import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    if (!('geolocation' in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    });
  }

  async getShareableMapLink(): Promise<string | null> {
    const pos = await this.getCurrentPosition();
    if (!pos) return null;
    const { latitude, longitude } = pos.coords;
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }
}

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import {CentreService} from "../../../services/centre.service";

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.css']
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  @Input() center: [number, number] = [0, 0];
  @Input() zoom = 13;
  @Input() height = '320px';
  @Input() markerOnClick = true;
  @Input() initialPosition?: [number, number] | null = undefined;
  @Input() autoSetMarker = false;
  /** Show the shopping center marker on the map */
  @Input() showCentreMarker = false;

  @Output() mapClick = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  map?: L.Map;
  private marker?: L.Marker;
  private centreMarker?: L.Marker;
  private defaultIcon?: L.Icon;

  centreLoaded = false;
  private centreLatLng?: [number, number];

  constructor(private centreService: CentreService) {}

  ngAfterViewInit(): void {
    this.initIconDefaults();
    this.initMap();
    this.applyInitialPositionIfNeeded();
    if (this.showCentreMarker) {
      this.loadCentreMarker();
    }
  }

  private createUserMarkerIcon(): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 40px;
      ">

        <!-- Continuous pulse ring -->
       <div class="user-marker-ring" style="
        position: absolute;
        top: 17px;
        left: 50%;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.5);
        pointer-events: none;
        z-index: 2;
      "></div>

        <!-- Pin wrapper — drop on placement then float forever -->
        <div class="user-marker-pin" style="position: relative; z-index: 1;">
          <div class="user-marker-float" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
          ">
            <!-- Pin head -->
            <div style="
              background: linear-gradient(135deg, #f87171, #ef4444);
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              width: 34px;
              height: 34px;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 8px rgba(239,68,68,0.5);
            ">
              <div style="transform: rotate(45deg); display:flex; align-items:center; justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none"
                     viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Shadow on ground synced with float -->
        <div class="user-marker-shadow" style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          width: 16px;
          height: 5px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        "></div>

      </div>
    `,
      iconSize: [40, 52],
      iconAnchor: [19, 46],
      popupAnchor: [0, -48],
    });
  }

  // ── Centre marker ─────────────────────────────────────────────
  private loadCentreMarker(): void {
    this.centreService.getCentreCommercial().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data?.location?.coordinates) {
          const { latitude, longitude } = res.data.location.coordinates;
          if (isFinite(latitude) && isFinite(longitude)) {
            this.placeCentreMarker(latitude, longitude);
          }
        }
      },
      error: () => {
        // silently fail — map still works without the centre marker
      }
    });
  }

  flyToCentre(): void {
    if (!this.map || !this.centreLatLng) return;
    this.map.flyTo(this.centreLatLng, this.zoom, {
      animate: true,
      duration: 1.2
    });
  }

  private placeCentreMarker(lat: number, lng: number): void {
    if (!this.map) return;

    // ── Sauvegarde pour flyTo ──
    this.centreLatLng = [lat, lng];
    this.centreLoaded = true;

    const icon = L.divIcon({
      className: '',
      html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
      ">
        <div style="
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: 2.5px solid white;
          border-radius: 50% 50% 50% 0;
          width: 36px;
          height: 36px;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(79,70,229,0.5);
        ">
          <div style="transform: rotate(45deg); display:flex; align-items:center; justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
        </div>
        <div style="
          margin-top: 6px;
          background: #4f46e5;
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          border: 1.5px solid white;
          box-shadow: 0 2px 6px rgba(79,70,229,0.4);
          letter-spacing: 0.02em;
        ">
          Our Center
        </div>
      </div>
    `,
      iconSize: [80, 70],
      iconAnchor: [28, 36],
      popupAnchor: [0, -40],
    });

    this.centreMarker = L.marker([lat, lng], { icon, interactive: false, keyboard: false })
        .addTo(this.map);
  }

  // ── Existing logic (unchanged) ────────────────────────────────
  private initIconDefaults() {
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    // @ts-ignore
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
    this.defaultIcon = L.icon({
      iconUrl, iconRetinaUrl, shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  private initMap() {
    if (this.map) return;

    this.map = L.map(this.mapContainer.nativeElement).setView(this.center, this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 100);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (this.markerOnClick) {
        const icon = this.createUserMarkerIcon();
        if (this.marker) {
          // Recrée le marker pour rejouer l'animation
          this.map!.removeLayer(this.marker);
          this.marker = L.marker([lat, lng], { icon }).addTo(this.map!);
        } else {
          this.marker = L.marker([lat, lng], { icon }).addTo(this.map!);
        }
      }
      this.mapClick.emit({ lat, lng });
    });
  }

  private applyInitialPositionIfNeeded() {
    if (this.initialPosition && Array.isArray(this.initialPosition) && this.initialPosition.length >= 2) {
      const [lat, lng] = this.initialPosition;
      if (isFinite(lat) && isFinite(lng)) {
        this.setMapView([lat, lng], this.zoom, this.autoSetMarker);
        return;
      }
    }

    if (navigator && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
            pos => this.setMapView([pos.coords.latitude, pos.coords.longitude], this.zoom, this.autoSetMarker),
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch (e) {}
    }
  }

  private setMapView(center: [number, number], zoom?: number, placeMarker = false) {
    if (!this.map) return;
    try {
      this.map.setView(center, zoom ?? this.zoom);
      if (placeMarker) {
        const icon = this.createUserMarkerIcon(); // ← fix ici
        if (this.marker) {
          this.map!.removeLayer(this.marker);
          this.marker = L.marker(center, { icon }).addTo(this.map);
        } else {
          this.marker = L.marker(center, { icon }).addTo(this.map);
        }
        this.mapClick.emit({ lat: center[0], lng: center[1] });
      }
    } catch (e) {
      console.error('Failed to set map view:', e);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  public setView(center: [number, number], zoom?: number) {
    if (!this.map) return;
    this.map.setView(center, zoom ?? this.zoom);
  }
}
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { CentreService } from "../../../services/centre.service";

export interface StaticMarkerConfig {
  lat: number;
  lng: number;
  logoUrl?: string;
  label?: string;
  color?: string;
  isLocal?: boolean; // true = appartient au centre commercial
}

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
  @Input() showCentreMarker = false;

  /** Marker statique configurable (ex: boutique externe) */
  @Input() staticMarker?: StaticMarkerConfig | null = null;

  @Output() mapClick = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  map?: L.Map;
  private marker?: L.Marker;
  private centreMarker?: L.Marker;
  private staticMarkerInstance?: L.Marker;
  private defaultIcon?: L.Icon;

  centreLoaded = false;
  staticMarkerLoaded = false;
  private centreLatLng?: [number, number];
  private staticLatLng?: [number, number];

  constructor(private centreService: CentreService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.initIconDefaults();
    this.initMap();
    this.applyInitialPositionIfNeeded();
    if (this.showCentreMarker) {
      this.loadCentreMarker();
    }
    if (this.staticMarker) {
      this.placeStaticMarker(this.staticMarker);
    }
  }

  // ── Static marker ─────────────────────────────────────────────
  private placeStaticMarker(config: StaticMarkerConfig): void {
    if (!this.map) return;

    this.staticLatLng = [config.lat, config.lng];
    this.staticMarkerLoaded = true;
    this.cdr.detectChanges();

    const color = config.color || '#10b981';
    const shadowColor = color + '80';
    const isLocal = config.isLocal === true;

    // ── Badge "In our center" ──────────────────────────────────
    const localBadge = isLocal ? `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-bottom: 4px;
        background: white;
        border: 1.5px solid #6366f1;
        color: #4f46e5;
        font-size: 9px;
        font-weight: 900;
        padding: 2px 7px 2px 4px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(79,70,229,0.2);
        letter-spacing: 0.03em;
        text-transform: uppercase;
      ">
        <div style="
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        In our center
      </div>` : '';

    // ── Contenu interne : logo ou icône store par défaut ───────
    const innerContent = config.logoUrl
        ? `<img src="${config.logoUrl}"
            style="width:22px;height:22px;border-radius:50%;object-fit:cover;display:block;"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
         />
         <div style="display:none; align-items:center; justify-content:center;">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
           </svg>
         </div>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
           <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
         </svg>`;

    // ── Label sous le pin ──────────────────────────────────────
    const labelHtml = config.label
        ? `<div style="
            margin-top: 6px;
            background: ${color};
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 20px;
            white-space: nowrap;
            border: 1.5px solid white;
            box-shadow: 0 2px 6px ${shadowColor};
            letter-spacing: 0.02em;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${config.label}</div>`
        : '';

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
          ${localBadge}
          <!-- Pin body -->
          <div style="
            background: linear-gradient(135deg, ${color}dd, ${color});
            border: 2.5px solid white;
            border-radius: 50% 50% 50% 0;
            width: 38px;
            height: 38px;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px ${shadowColor};
          ">
            <div style="
              transform: rotate(45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              overflow: hidden;
              background: ${config.logoUrl ? 'white' : 'transparent'};
            ">
              ${innerContent}
            </div>
          </div>
          ${labelHtml}
        </div>
      `,
      iconSize: [90, isLocal ? 90 : 72],
      iconAnchor: [19, isLocal ? 52 : 38],
      popupAnchor: [0, -42],
    });

    this.staticMarkerInstance = L.marker([config.lat, config.lng], {
      icon,
      interactive: false,
      keyboard: false
    }).addTo(this.map);
  }

  flyToStatic(): void {
    if (!this.map || !this.staticLatLng) return;
    this.map.flyTo(this.staticLatLng, 15, {
      animate: true,
      duration: 1.2
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
      error: () => {}
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

    this.centreLatLng = [lat, lng];
    this.centreLoaded = true;
    this.cdr.detectChanges();

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
          ">Our Center</div>
        </div>
      `,
      iconSize: [80, 70],
      iconAnchor: [28, 36],
      popupAnchor: [0, -40],
    });

    this.centreMarker = L.marker([lat, lng], { icon, interactive: false, keyboard: false })
        .addTo(this.map);
  }

  // ── User marker ───────────────────────────────────────────────
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

          <div class="user-marker-pin" style="position: relative; z-index: 1;">
            <div class="user-marker-float" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
            ">
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

  // ── Map init ──────────────────────────────────────────────────
  private initIconDefaults() {
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    // @ts-ignore
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
    this.defaultIcon = L.icon({
      iconUrl, iconRetinaUrl, shadowUrl,
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41]
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
          this.map!.removeLayer(this.marker);
        }
        this.marker = L.marker([lat, lng], { icon }).addTo(this.map!);
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
        const icon = this.createUserMarkerIcon();
        if (this.marker) this.map!.removeLayer(this.marker);
        this.marker = L.marker(center, { icon }).addTo(this.map);
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
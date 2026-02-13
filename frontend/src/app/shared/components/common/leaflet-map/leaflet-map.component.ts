import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.css']
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  /** explicit center input (existing) */
  @Input() center: [number, number] = [0, 0];
  @Input() zoom = 13;
  @Input() height = '320px';
  @Input() markerOnClick = true;

  /** New: initialPosition overrides center if provided. Format: [lat, lng] */
  @Input() initialPosition?: [number, number] | null = undefined;
  /** New: if true, when initial position is determined we'll also place a marker and emit a mapClick event */
  @Input() autoSetMarker = false;

  @Output() mapClick = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;
  private defaultIcon?: L.Icon;

  ngAfterViewInit(): void {
    this.initIconDefaults();
    this.initMap();
    // After initializing the map, attempt to apply initialPosition or use geolocation
    this.applyInitialPositionIfNeeded();
  }

  private initIconDefaults() {
    // Use CDN-hosted images to avoid bundler asset issues
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

    // Merge options so Leaflet controls use the CDN images as fallback
    // @ts-ignore
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

    // Also create an explicit icon instance we will use when creating markers
    this.defaultIcon = L.icon({
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  private initMap() {
    if (this.map) return;

    // Initially set view to provided center; it may be overridden by initialPosition or geolocation later
    this.map = L.map(this.mapContainer.nativeElement).setView(this.center, this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (this.markerOnClick) {
        if (this.marker) {
          this.marker.setLatLng([lat, lng]);
        } else {
          // Use the explicit default icon so the marker image is loaded correctly
          this.marker = L.marker([lat, lng], { icon: this.defaultIcon }).addTo(this.map!);
        }
      }
      this.mapClick.emit({ lat, lng });
    });
  }

  private applyInitialPositionIfNeeded() {
    // Preference: explicit initialPosition input > attempt geolocation > keep current center
    if (this.initialPosition && Array.isArray(this.initialPosition) && this.initialPosition.length >= 2) {
      const [lat, lng] = this.initialPosition;
      if (isFinite(lat) && isFinite(lng)) {
        this.setMapView([lat, lng], this.zoom, this.autoSetMarker);
        return;
      }
    }

    // If no explicit initialPosition, try geolocation (if available)
    if (navigator && 'geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            // center the map on current location; optionally place a marker
            this.setMapView([lat, lng], this.zoom, this.autoSetMarker);
          },
          err => {
            // permission denied or unavailable -> keep existing center
            // console.warn('Geolocation failed or denied:', err);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch (e) {
        // ignore geolocation errors, keep default center
      }
    }
  }

  private setMapView(center: [number, number], zoom?: number, placeMarker = false) {
    if (!this.map) return;
    try {
      this.map.setView(center, zoom ?? this.zoom);
      if (placeMarker) {
        // place marker (use default icon)
        if (this.marker) this.marker.setLatLng(center);
        else this.marker = L.marker(center, { icon: this.defaultIcon }).addTo(this.map);
        // also emit mapClick to inform parent (useful to auto-fill fields)
        this.mapClick.emit({ lat: center[0], lng: center[1] });
      }
    } catch (e) {
      // ignore errors
      console.error('Failed to set map view:', e);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  /** Helper: programmatically set view */
  public setView(center: [number, number], zoom?: number) {
    if (!this.map) return;
    this.map.setView(center, zoom ?? this.zoom);
  }
}

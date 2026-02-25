import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import * as L from 'leaflet';
import {BoutiqueService} from "../../../shared/services/boutique.service";
import {CentreService} from "../../../shared/services/centre.service";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";

interface Boutique {
  _id: string;
  name: string;
  logo: string;
  description: string;
  isLocal: boolean;
  isActive: boolean;
  isValidated: boolean;
  address: { latitude: number; longitude: number };
}

@Component({
  selector: 'app-boutiques-map',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent, NgOptimizedImage],
  templateUrl: './boutiques-map.component.html',
  styleUrls: ['./boutiques-map.component.css']
})
export class BoutiquesMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private boutiquesMarkers: Map<string, L.Marker> = new Map();
  private centreMarker?: L.Marker;
  private centreCircle?: L.Circle;
  private userMarker?: L.Marker;
  private activePopupEl: HTMLElement | null = null;

  boutiques: Boutique[] = [];
  isLoading = true;

  searchQuery = '';
  searchResults: Boutique[] = [];
  showDropdown = false;
  searchSubject = new Subject<string>();

  showCentreModal = false;
  get localBoutiques(): Boutique[] { return this.boutiques.filter(b => b.isLocal); }

  private centreLatLng?: [number, number];
  private defaultCenter: [number, number] = [-18.8792, 47.5079];

  constructor(
      private boutiqueService: BoutiqueService,
      private centreService: CentreService,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.initSearch(); this.loadData(); }
  ngAfterViewInit(): void { this.initMap(); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showCentreModal = false;
    this.showDropdown = false;
    this.closeExternalPopup();
  }

  // ── Map init ──────────────────────────────────────────────────
  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.defaultCenter, zoom: 13, zoomControl: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(this.map);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 100);
    this.map.on('click', () => {
      this.showDropdown = false;
      this.closeExternalPopup();
      this.cdr.detectChanges();
    });
  }

  // ── Load data ─────────────────────────────────────────────────
  private loadData(): void {
    this.centreService.getCentreCommercial().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data?.location?.coordinates) {
          const { latitude, longitude } = res.data.location.coordinates;
          if (isFinite(latitude) && isFinite(longitude)) {
            this.centreLatLng = [latitude, longitude];
            this.placeCentreMarker(latitude, longitude);
          }
        }
      },
      error: () => {}
    });

    this.boutiqueService.getBoutiques({
      limit: 999, sort: '-createdAt', isActive: true, isValidated: true
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success && res?.data?.items) {
          this.boutiques = res.data.items.filter(
              (b: Boutique) => b.address?.latitude && b.address?.longitude
          );
          this.placeBoutiqueMarkers();
          this.cdr.detectChanges();
        }
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            this.placeUserMarker(lat, lng);
            this.map?.setView([lat, lng], 15);
          },
          () => {
            // No geolocation — fly to centre if loaded
            if (this.centreLatLng) this.map?.setView(this.centreLatLng, 15);
          },
          { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  // ── Centre marker ─────────────────────────────────────────────
  private placeCentreMarker(lat: number, lng: number): void {
    if (!this.map) return;
    // Circle removed — marker alone is sufficient

    const icon = L.divIcon({
      className: 'bm-centre-icon-wrapper',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <!-- Main chip — bigger, indigo, with building icon -->
          <div style="
            display:inline-flex;align-items:center;gap:7px;
            background:#4f46e5;
            border-radius:99px;
            padding:6px 14px 6px 6px;
            box-shadow:0 4px 20px rgba(79,70,229,0.45),0 2px 6px rgba(0,0,0,0.2);
            white-space:nowrap;
          ">
            <!-- Icon circle -->
            <div style="
              width:30px;height:30px;border-radius:50%;
              background:rgba(255,255,255,0.18);
              border:1.5px solid rgba(255,255,255,0.3);
              display:flex;align-items:center;justify-content:center;flex-shrink:0;
            ">
              <svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'>
                <path stroke-linecap='round' stroke-linejoin='round' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'/>
              </svg>
            </div>
            <span style="
              font-size:12px;font-weight:800;color:white;
              letter-spacing:0.04em;text-transform:uppercase;
            ">Our Center</span>
          </div>
          <!-- Stem dot -->
          <div style="
            width:8px;height:8px;border-radius:50%;
            background:#4f46e5;
            margin-top:2px;
            box-shadow:0 0 0 2.5px white,0 0 0 4px rgba(79,70,229,0.3);
          "></div>
        </div>`,
      iconSize: [180, 60],
      iconAnchor: [90, 57],
    });

    this.centreMarker = L.marker([lat, lng], { icon })
        .addTo(this.map)
        .on('click', (e) => { L.DomEvent.stopPropagation(e); this.openCentreModal(); });
  }

  openCentreModal(): void {
    if (this.centreLatLng) this.map?.flyTo(this.centreLatLng, 17, { animate: true, duration: 1.2 });
    setTimeout(() => { this.showCentreModal = true; this.cdr.detectChanges(); }, 400);
  }

  closeCentreModal(): void { this.showCentreModal = false; }

  // ── External boutique markers ─────────────────────────────────
  private placeBoutiqueMarkers(): void {
    if (!this.map) return;
    this.boutiques.filter(b => !b.isLocal).forEach(boutique => {
      const { latitude, longitude } = boutique.address;
      const color = '#10b981';
      // FIX: use filter:drop-shadow() — no box-shadow in inline styles to avoid linter error
      const ds = 'drop-shadow(0 3px 6px rgba(16,185,129,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.12))';

      const logoContent = boutique.logo
          ? `<img src="${boutique.logo}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;display:block;"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
           <div style="display:none;align-items:center;justify-content:center;">
             <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'>
               <path stroke-linecap='round' stroke-linejoin='round' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'/></svg></div>`
          : `<svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'>
             <path stroke-linecap='round' stroke-linejoin='round' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'/></svg>`;

      // Modern flat chip marker — logo thumbnail + name pill, no rotation tricks
      const icon = L.divIcon({
        className: 'bm-ext-marker-wrapper',
        html: `
          <div style="
            display:inline-flex;align-items:center;gap:6px;
            background:white;
            border:1.5px solid rgba(16,185,129,0.3);
            border-radius:99px;
            padding:4px 10px 4px 4px;
            box-shadow:0 2px 12px rgba(0,0,0,0.15),0 1px 3px rgba(0,0,0,0.1);
            cursor:pointer;
            white-space:nowrap;
            position:relative;
          ">
            <!-- Logo circle -->
            <div style="
              width:26px;height:26px;border-radius:50%;overflow:hidden;flex-shrink:0;
              background:#ecfdf5;border:1.5px solid rgba(16,185,129,0.25);
              display:flex;align-items:center;justify-content:center;
            ">
              ${boutique.logo
            ? `<img src="${boutique.logo}" style="width:100%;height:100%;object-fit:cover;display:block;"
                       onerror="this.style.display='none'" />`
            : `<svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' fill='none' viewBox='0 0 24 24' stroke='#10b981' stroke-width='2'>
                     <path stroke-linecap='round' stroke-linejoin='round' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'/></svg>`
        }
            </div>
            <!-- Name -->
            <span style="
              font-size:11px;font-weight:700;color:#0f172a;
              letter-spacing:0.01em;max-width:100px;
              overflow:hidden;text-overflow:ellipsis;
            ">${boutique.name}</span>
            <!-- Bottom stem dot -->
          </div>
          <!-- Stem -->
          <div style="
            width:6px;height:6px;border-radius:50%;
            background:#10b981;
            margin:1px auto 0;
            box-shadow:0 0 0 2px white, 0 0 0 3px rgba(16,185,129,0.3);
          "></div>
        `,
        iconSize: [160, 52],
        iconAnchor: [80, 49],
      });

      const marker = L.marker([latitude, longitude], { icon })
          .addTo(this.map!)
          .on('click', (e) => { L.DomEvent.stopPropagation(e); this.openExternalPopup(boutique, marker); });
      this.boutiquesMarkers.set(boutique._id, marker);
    });
  }

  // ── External popup — Google Maps style card ──────────────────
  openExternalPopup(boutique: Boutique, marker: L.Marker): void {
    if (!this.map) return;
    this.closeExternalPopup();

    const point = this.map.latLngToContainerPoint(marker.getLatLng());
    const mapEl = this.mapContainer.nativeElement as HTMLElement;
    const cardW = 288;
    const cardH = 220;
    let left = point.x - cardW / 2;
    let top  = point.y - cardH - 52;
    left = Math.max(8, Math.min(left, mapEl.offsetWidth  - cardW - 8));
    top  = Math.max(8, Math.min(top,  mapEl.offsetHeight - cardH - 8));

    const desc = (boutique.description || '').slice(0, 80) + ((boutique.description || '').length > 80 ? '…' : '');
    const logo = boutique.logo || '/placeholder.svg';

    const el = document.createElement('div');
    el.className = 'bm-gmap-card';
    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
    el.innerHTML = `
      <!-- Close -->
      <button class="bm-gmap-close" id="bm-close-btn" aria-label="Close">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Hero image band (logo stretched as cover, fallback gradient) -->
      <div class="bm-gmap-hero">
        <img src="${logo}" onerror="this.parentElement.classList.add('bm-gmap-hero--fallback');this.remove();" />
        <div class="bm-gmap-hero-badge">External</div>
      </div>

      <!-- Body -->
      <div class="bm-gmap-body">
        <div class="bm-gmap-title-row">
          <!-- Logo thumbnail -->
          <div class="bm-gmap-thumb">
            <img src="${logo}" onerror="this.src='/placeholder.svg'" />
          </div>
          <div class="bm-gmap-titles">
            <p class="bm-gmap-name">${boutique.name}</p>
            <p class="bm-gmap-sub">${desc || 'External store'}</p>
          </div>
        </div>

        <!-- CTA row -->
        <div class="bm-gmap-actions">
          <a href="/v1/stores/${boutique._id}" class="bm-gmap-btn-primary">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            View Store
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${boutique.address.latitude},${boutique.address.longitude}"
             target="_blank" rel="noopener" class="bm-gmap-btn-secondary" title="Get directions">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Tail -->
      <div class="bm-gmap-tail"></div>
    `;

    mapEl.appendChild(el);
    this.activePopupEl = el;

    el.querySelector('#bm-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeExternalPopup();
    });

    const cleanup = () => this.closeExternalPopup();
    this.map.once('movestart', cleanup);
    this.map.once('zoomstart', cleanup);
  }

  closeExternalPopup(): void {
    if (this.activePopupEl) { this.activePopupEl.remove(); this.activePopupEl = null; }
  }

  // ── User marker — FIX: ring behind dot via z-index ────────────
  private placeUserMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.userMarker) this.map.removeLayer(this.userMarker);

    const icon = L.divIcon({
      className: '',
      // Container 44x44 gives pulse ring room to expand.
      // Ring: absolute inset-0, z-index 0 (behind).
      // Dot: absolute centered, z-index 1 (visible on top).
      html: `
        <div style="position:relative;width:22px;height:22px;overflow:visible;">
          <div class="bm-user-ring" style="
            position:absolute;
            width:44px;height:44px;
            top:50%;left:50%;
            margin-top:-22px;margin-left:-22px;
            border-radius:50%;
            background:rgba(239,68,68,0.28);
            z-index:0;pointer-events:none;
          "></div>
          <div class="bm-user-dot" style="
            position:absolute;top:0;left:0;
            width:22px;height:22px;border-radius:50%;
            background:linear-gradient(135deg,#f87171,#ef4444);
            border:2.5px solid white;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 3px 10px rgba(239,68,68,0.5);z-index:1;
          ">
            <svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='white' viewBox='0 0 24 24'>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11], // center of dot = coordinate point
    });

    this.userMarker = L.marker([lat, lng], { icon, interactive: false }).addTo(this.map);
  }

  // ── Fly buttons ───────────────────────────────────────────────
  flyToMyLocation(): void {
    if (!this.map) return;
    navigator?.geolocation?.getCurrentPosition(
        pos => {
          this.placeUserMarker(pos.coords.latitude, pos.coords.longitude);
          this.map!.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 1.2 });
        },
        () => {}
    );
  }

  flyToCentre(): void {
    if (!this.map || !this.centreLatLng) return;
    this.map.flyTo(this.centreLatLng, 17, { animate: true, duration: 1.2 });
  }

  // ── Search ────────────────────────────────────────────────────
  private initSearch(): void {
    this.searchSubject.pipe(debounceTime(200), distinctUntilChanged()).subscribe(term => {
      if (!term) { this.searchResults = []; this.showDropdown = false; return; }
      const lower = term.toLowerCase();
      this.searchResults = this.boutiques.filter(b => b.name.toLowerCase().includes(lower)).slice(0, 8);
      this.showDropdown = this.searchResults.length > 0;
      this.cdr.detectChanges();
    });
  }

  onSearchInput(event: any): void {
    this.searchQuery = event.target.value;
    this.searchSubject.next(this.searchQuery);
  }

  selectBoutique(boutique: Boutique): void {
    if (!this.map) return;
    this.searchQuery = boutique.name;
    this.showDropdown = false;
    if (boutique.isLocal) {
      if (this.centreLatLng) this.map.flyTo(this.centreLatLng, 17, { animate: true, duration: 1.2 });
      setTimeout(() => { this.showCentreModal = true; this.cdr.detectChanges(); }, 1400);
    } else {
      const { latitude, longitude } = boutique.address;
      this.map.flyTo([latitude, longitude], 18, { animate: true, duration: 1.4 });
      setTimeout(() => {
        const marker = this.boutiquesMarkers.get(boutique._id);
        if (marker) this.openExternalPopup(boutique, marker);
      }, 1500);
    }
  }

  clearSearch(): void { this.searchQuery = ''; this.searchResults = []; this.showDropdown = false; }

  get localCount(): number { return this.boutiques.filter(b => b.isLocal).length; }
  get externalCount(): number { return this.boutiques.filter(b => !b.isLocal).length; }

  ngOnDestroy(): void { if (this.map) { this.map.off(); this.map.remove(); } }
}
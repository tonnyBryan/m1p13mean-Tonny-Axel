import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {UserService} from "../../../shared/services/user.service";
import {CommandeService} from "../../../shared/services/commande.service";
import {CentreService} from '../../../shared/services/centre.service';
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {LeafletMapComponent} from '../../../shared/components/common/leaflet-map/leaflet-map.component';

@Component({
  selector: 'app-checkout-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, LeafletMapComponent],
  templateUrl: './checkout-user.component.html',
  styleUrl: './checkout-user.component.css',
})
export class CheckoutUserComponent implements OnInit {
  tax: number = 0; // percentage

  profile: any = null;
  cart: any = null;
  isLoading = false;
  centre: any = null;

  // Delivery mode: 'pickup' or 'delivery'
  deliveryMode: 'pickup' | 'delivery' = 'pickup';

  // Selected address
  selectedAddressId: string | null = null;

  // New address (if user wants to add one)
  showNewAddressForm = false;
  saveNewAddress = false;
  savePaymentInfo = false;
  newAddress = {
    label: '',
    description: '',
    latitude: '',
    longitude: ''
  };

  // Payment info
  paymentInfo = {
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  };

  isProcessing = false;

  constructor(
      private userService: UserService,
      private commandeService: CommandeService,
      private centreService: CentreService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCentre();
    this.loadFullDraft();
    this.loadProfile();
  }

  loadFullDraft() {
    this.commandeService.getDraftFull().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.cart = res.data;
          console.log(this.cart);
          this.checkLoadingComplete();
        } else {
          this.router.navigate(['/v1/cart']);
        }
      },
      error: (err: any) => {
        console.error('Error fetching draft full:', err);
        this.router.navigate(['/v1/cart']);
      }
    });
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.profile = res.data;
          console.log(this.profile);
          // Auto-select default address if available
          const defaultAddr = this.profile.addresses?.find((a: any) => a.isDefault);
          if (defaultAddr) {
            this.selectedAddressId = defaultAddr._id;
          }
          this.checkLoadingComplete();
        } else {
          this.router.navigate(['/v1/cart']);
        }
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.router.navigate(['/v1/cart']);
      }
    });
  }

  loadCentre(): void {
    this.centreService.getCentreCommercial().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.centre = res.data;
        } else {
          this.centre = null;
        }
      },
      error: (err) => {
        console.error('Error loading centre commercial', err);
        this.centre = null;
      }
    });
  }

  checkLoadingComplete(): void {
    if (this.cart && this.profile) {
      this.isLoading = false;
    }
  }

  // ════════════════════════════════════════════
  //  DELIVERY MODE
  // ════════════════════════════════════════════

  selectDeliveryMode(mode: 'pickup' | 'delivery'): void {
    // If choosing delivery but boutique doesn't allow delivery, ignore and keep pickup
    if (mode === 'delivery') {
      const isAllowed = !!(this.cart && this.cart.boutique && this.cart.boutique.livraisonConfig && this.cart.boutique.livraisonConfig.isDeliveryAvailable);
      if (!isAllowed) {
        // keep pickup and optionally show a message
        alert('Home delivery is not available for this boutique');
        return;
      }
    }

    this.deliveryMode = mode;
    if (mode === 'pickup') {
      this.selectedAddressId = null;
      this.showNewAddressForm = false;
    }
  }

  // ════════════════════════════════════════════
  //  ADDRESS MANAGEMENT
  // ════════════════════════════════════════════

  selectAddress(addressId: string): void {
    this.selectedAddressId = addressId;
    this.showNewAddressForm = false;
  }

  toggleNewAddressForm(): void {
    this.showNewAddressForm = !this.showNewAddressForm;
    if (this.showNewAddressForm) {
      this.selectedAddressId = null;
    }
  }

  getSelectedAddress(): any {
    if (!this.selectedAddressId) return null;
    return this.profile.addresses?.find((a: any) => a._id === this.selectedAddressId);
  }

  // ════════════════════════════════════════════
  //  PRICE CALCULATIONS
  // ════════════════════════════════════════════

  get subtotal(): number {
    return this.cart?.totalAmount || 0;
  }

  get deliveryFee(): number {
    if (this.deliveryMode !== 'delivery') return 0;

    // Need both boutique livraisonConfig and a selected address (or new address)
    const livraison = this.cart?.boutique?.livraisonConfig;
    if (!livraison || !livraison.deliveryRules) return 0;

    const addr = this.showNewAddressForm ? this.newAddress : this.getSelectedAddress();
    if (!addr) return 0;

    const centreCoords = this.centre?.location?.coordinates || this.centre?.location;
    return this.getPrixLivraison(centreCoords, addr);
  }

  get taxPrice(): number {
    return this.subtotal * (this.tax / 100);
  }

  get taxPercentage(): number {
    return this.tax;
  }


  get total(): number {
    return this.subtotal + this.deliveryFee + this.taxPrice;
  }

  // Compute haversine distance (km) between two coordinates {latitude, longitude}
  haversineDistanceKm(c1: { latitude: number; longitude: number } | any, c2: { latitude: number; longitude: number } | any): number {
    try {
      if (!c1 || !c2) return 5; // fallback
      const lat1 = Number(c1.latitude);
      const lon1 = Number(c1.longitude);
      const lat2 = Number(c2.latitude);
      const lon2 = Number(c2.longitude);
      if ([lat1, lon1, lat2, lon2].some(v => !isFinite(v))) return 5;

      const toRad = (deg: number) => deg * Math.PI / 180;
      const R = 6371; // Earth radius km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      return d;
    } catch (e) {
      return 5;
    }
  }

  // Calculate delivery price between centre coords and an address object
  getPrixLivraison(centreCoords: any, address: any): number {
    // If no boutique or no delivery rules, return 0
    const livraison = this.cart?.boutique?.livraisonConfig;
    if (!livraison || !livraison.deliveryRules) return 0;

    // If delivery not available, return 0
    if (!livraison.isDeliveryAvailable) return 0;

    // Prepare coordinates
    let centre = centreCoords;
    if (centre && centre.coordinates) centre = centre.coordinates; // support different shapes

    // fallback to 5 km when coordinates missing
    const distanceKm = this.haversineDistanceKm(centre, address) || 5;

    const rules = livraison.deliveryRules || { minPrice: 0, baseDistanceKm: 0, extraPricePerKm: 0 };
    const baseKm = Number(rules.baseDistanceKm || 0);
    const minPrice = Number(rules.minPrice || 0);
    const extraPerKm = Number(rules.extraPricePerKm || 0);

    let price = 0;
    if (distanceKm <= baseKm) {
      price = minPrice;
    } else {
      price = minPrice + (distanceKm - baseKm) * extraPerKm;
    }

    return Math.max(0, Math.round(price));
  }

  // Retourne la distance en km (arrondie à 1 décimale) entre le centre commercial et l'adresse fournie
  getDistanceKmForAddress(address: any): number {
    try {
      const centreCoords = this.centre?.location?.coordinates || this.centre?.location;
      const d = this.haversineDistanceKm(centreCoords, address);
      if (!isFinite(d) || d <= 0) return 5;
      // arrondir à 1 décimale
      return Math.round(d * 10) / 10;
    } catch (e) {
      return 5;
    }
  }

  // ════════════════════════════════════════════
  //  PAYMENT
  // ════════════════════════════════════════════

  processPayment(): void {
    // Validate
    if (this.deliveryMode === 'delivery' && !this.selectedAddressId && !this.showNewAddressForm) {
      alert('Please select a delivery address');
      return;
    }

    if (!this.paymentInfo.cardNumber || !this.paymentInfo.cardName || !this.paymentInfo.expiryDate || !this.paymentInfo.cvv) {
      alert('Please fill in all payment details');
      return;
    }

    this.isProcessing = true;

    // Build deliveryAddress payload or set null for pickup
    let deliveryAddressPayload: any = null;
    if (this.deliveryMode === 'delivery') {
      if (this.showNewAddressForm) {
        const addr = {
          id: null,
          label: this.newAddress.label || '',
          description: this.newAddress.description || '',
          latitude: Number(this.newAddress.latitude),
          longitude: Number(this.newAddress.longitude),
          price: 0,
          saveNewAddress: this.saveNewAddress
        };
        // compute price using existing helper
        const centreCoords = this.centre?.location?.coordinates || this.centre?.location;
        addr.price = this.getPrixLivraison(centreCoords, addr);
        deliveryAddressPayload = addr;
      } else {
        const addr = this.getSelectedAddress();
        const latitude = addr?.latitude ?? addr?.location?.latitude ?? addr?.coordinates?.latitude ?? null;
        const longitude = addr?.longitude ?? addr?.location?.longitude ?? addr?.coordinates?.longitude ?? null;
        const addrPayload = {
          id: addr?._id ?? null,
          label: addr?.label ?? (addr?.description ?? ''),
          description: addr?.description ?? '',
          latitude: Number(latitude),
          longitude: Number(longitude),
          price: 0,
          saveNewAddress: false
        };
        const centreCoords = this.centre?.location?.coordinates || this.centre?.location;
        addrPayload.price = this.getPrixLivraison(centreCoords, addrPayload);
        deliveryAddressPayload = addrPayload;
      }
    }

    const payload = {
      deliveryMode: this.deliveryMode,
      deliveryAddress: deliveryAddressPayload, // nullable
      paymentInfo: this.paymentInfo,
      savePaymentInfo: this.savePaymentInfo,
      totalAmount: this.total
    };

    // Print the prepared payload (for debug)
    console.log('Prepared payment payload:', payload);

    // Call backend pay API
    this.commandeService.payCommand(payload).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        if (res?.success) {
          console.log('Payment successful:', res.data);
          // navigate to orders or show success message
          alert('Payment successful');
        } else {
          console.error('Payment failed:', res);
          alert(res?.message || 'Payment failed');
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        console.error('Payment API error:', err);
        const message = err?.error?.message || err?.message || 'Payment error';
        alert(message);
      }
    });
  }

  // ════════════════════════════════════════════
  //  UTILITIES
  // ════════════════════════════════════════════

  formatPrice(price: number): string {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    this.paymentInfo.cardNumber = formattedValue;
  }

  formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\//g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.paymentInfo.expiryDate = value;
  }

  // Card type detection
  getCardType(): string | null {
    const number = this.paymentInfo.cardNumber.replace(/\s/g, '');
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    return null;
  }

  getCardTypeIcon(): string {
    const type = this.getCardType();
    switch (type) {
      case 'visa':
        return 'https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg';
      case 'mastercard':
        return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg';
      case 'amex':
        return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg';
      default:
        return '';
    }
  }

  isDeliveryAvailableToday(): boolean {
    if (!this.cart.boutique?.livraisonConfig?.deliveryDays) return false;

    const jsDay = new Date().getDay();
    const apiDay = jsDay === 0 ? 7 : jsDay;
    const todayDelivery = this.cart.boutique.livraisonConfig.deliveryDays.find((d: any) => d.day === apiDay);

    return todayDelivery?.isActive || false;
  }

  isDeliveryEnabled(): boolean {
    return !!(this.cart && this.cart.boutique && this.cart.boutique.livraisonConfig && this.cart.boutique.livraisonConfig.isDeliveryAvailable);
  }

  isReadyToPay(): boolean {
    // 1. Validate payment info
    const isPaymentValid = !!(
        this.paymentInfo.cardNumber.replace(/\s/g, '').length >= 15 &&
        this.paymentInfo.cardName.trim() &&
        this.paymentInfo.expiryDate.length === 5 &&
        this.paymentInfo.cvv.length >= 3
    );

    if (!isPaymentValid) return false;

    // 2. If delivery mode is pickup, payment info is enough
    if (this.deliveryMode === 'pickup') return true;

    // 3. If delivery mode is 'delivery', we need an address
    if (this.deliveryMode === 'delivery') {
      // Case A: User selected an existing address
      if (this.selectedAddressId) return true;

      // Case B: User is adding a new address
      if (this.showNewAddressForm) {
        const isNewAddressValid = !!(
            this.newAddress.label.trim() &&
            this.newAddress.description.trim() &&
            this.newAddress.latitude &&
            this.newAddress.longitude &&
            !isNaN(Number(this.newAddress.latitude)) &&
            !isNaN(Number(this.newAddress.longitude))
        );
        return isNewAddressValid;
      }

      // Case C: No address selected and not showing new address form
      return false;
    }

    return false;
  }

  // Provide center for the Leaflet map (prefer centre commercial, otherwise existing newAddress coords or fallback)
  get mapCenter(): [number, number] {
    // prefer centre commercial coordinates if present
    const centreCoords = this.centre?.location?.coordinates || this.centre?.location || null;
    if (centreCoords) {
      // support different shapes: [lng, lat] or { latitude, longitude }
      if (Array.isArray(centreCoords) && centreCoords.length >= 2) {
        // Many geojson store as [lng, lat]
        const lng = Number(centreCoords[0]);
        const lat = Number(centreCoords[1]);
        if (isFinite(lat) && isFinite(lng)) return [lat, lng];
      }
      if (centreCoords.latitude && centreCoords.longitude) {
        return [Number(centreCoords.latitude), Number(centreCoords.longitude)];
      }
    }

    // fallback: if user typed coordinates already
    if (this.newAddress && this.newAddress.latitude && this.newAddress.longitude) {
      const lat = Number(this.newAddress.latitude);
      const lng = Number(this.newAddress.longitude);
      if (isFinite(lat) && isFinite(lng)) return [lat, lng];
    }

    // default to Antananarivo (Madagascar) roughly
    return [-18.8792, 47.5079];
  }

  // When user clicks on the leaflet map: fill newAddress latitude/longitude (as strings for ngModel)
  onMapClick(e: { lat: number; lng: number }) {
    // ensure new address form is visible
    if (!this.showNewAddressForm) this.showNewAddressForm = true;

    // fill values as strings (template expects strings)
    this.newAddress.latitude = e.lat.toFixed(6).toString();
    this.newAddress.longitude = e.lng.toFixed(6).toString();

    // Optionally, you may auto-fill a label or description placeholder
    if (!this.newAddress.label) this.newAddress.label = 'Selected location';
    if (!this.newAddress.description) this.newAddress.description = '';

    // trigger change detection if needed (Angular will handle since we're in zone)
    console.log('Map click captured, coords:', e);
  }
}
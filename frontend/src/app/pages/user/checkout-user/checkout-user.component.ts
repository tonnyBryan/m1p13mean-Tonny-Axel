import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {UserService} from "../../../shared/services/user.service";
import {CommandeService} from "../../../shared/services/commande.service";
import {CentreService} from '../../../shared/services/centre.service';
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {LeafletMapComponent} from '../../../shared/components/common/leaflet-map/leaflet-map.component';
import {SkeletonCheckoutComponent} from "./skeleton-checkout/skeleton-checkout.component";
import {ToastService} from "../../../shared/services/toast.service";
import {IncompleteProfileComponent} from "./incomplete-profile/incomplete-profile.component";
import {DeliveryWarningComponent} from "./delivery-warning/delivery-warning.component";

@Component({
  selector: 'app-checkout-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, LeafletMapComponent, SkeletonCheckoutComponent, IncompleteProfileComponent, DeliveryWarningComponent],
  templateUrl: './checkout-user.component.html',
  styleUrl: './checkout-user.component.css',
})
export class CheckoutUserComponent implements OnInit {
  tax: number = 0; // percentage

  profile: any = null;
  cart: any = null;
  isLoading = false;
  centre: any = null;

  profileIncomplete = false;


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
      private router: Router,
      private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCentre();
    this.loadProfile();
    this.loadFullDraft();
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
        if (err.error && err.error.message) {
          this.toast.error('Error',err.error.message,0);
        } else {
          this.toast.error('Error','An error occurred while fetching your cart',0);
        }

        // this.router.navigate(['/v1/cart']);
      }
    });
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile = res.data;
          console.log(this.profile);
          // Auto-select default address if available
          const defaultAddr = this.profile.addresses?.find((a: any) => a.isDefault);
          if (defaultAddr) {
            this.selectedAddressId = defaultAddr._id;
          }
          this.checkLoadingComplete();
        } else {
          this.isLoading = false;
          this.profileIncomplete = true;
        }
      },
      error: (err) => {
        console.error('Error fetching profile', err);

        if (err.error && err.error.message) {
          this.toast.error('Error',err.error.message,0);
        } else {
          this.toast.error('Error','An error occurred while fetching your profile',0);
        }

        // this.router.navigate(['/v1/cart']);
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
        if (err.error && err.error.message) {
          this.toast.error('Error',err.error.message,0);
        } else {
          this.toast.error('Error','An error occurred while fetching application details',0);
        }
      }
    });
  }

  checkLoadingComplete(): void {
    if (this.centre && this.cart && this.profile) {
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
        this.toast.warning('Oups', 'Home delivery is not available for this store', 5000);
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

  async processPayment(): Promise<void>  {
    // Validate
    if (this.deliveryMode === 'delivery' && !this.selectedAddressId && !this.showNewAddressForm) {
      this.toast.warning('Oups', 'Please select a delivery address or add a new one', 5000);
      return;
    }

    if (!this.paymentInfo.cardNumber || !this.paymentInfo.cardName || !this.paymentInfo.expiryDate || !this.paymentInfo.cvv) {
      this.toast.warning('Oups', 'Please complete your payment card', 5000);
      return;
    }

    if (!this.isReadyToPay()) {
      this.toast.warning('Oups', 'Please complete all information', 5000);
      return;
    }

    this.isProcessing = true;

    if (this.deliveryMode === 'delivery') {
      const nextDeliveryDay = this.getNextDeliveryDay();

      // Cas 1: Livraison non disponible aujourd'hui
      if (this.isDeliveryEnabled() && !this.isDeliveryAvailableToday()) {
        const confirmed = await this.toast.confirmAsync(
            'Delivery Not Available Today',
            `Home delivery is not available today. Your order will be delivered on ${nextDeliveryDay}. Do you want to continue?`,
            {
              confirmLabel: 'Yes, Continue',
              cancelLabel: 'Cancel',
              variant: 'primary',
              position: 'top-center',
              backdrop: true
            }
        );

        if (!confirmed) {
          console.log('Payment cancelled by user');
          this.isProcessing = false;
          return;
        }
      }

      // Cas 2: Heure limite dépassée (mais jour de livraison actif)
      else if (this.isDeliveryEnabled() && this.isDeliveryAvailableToday() && !this.isDeliveryAvailableNow()) {
        const cutoffTime = this.cart?.boutique?.livraisonConfig?.orderCutoffTime || '';
        const confirmed = await this.toast.confirmAsync(
            'Order Cutoff Time Passed',
            `The cutoff time for same-day delivery (${cutoffTime}) has passed. Your order will be delivered on ${nextDeliveryDay}. Do you want to continue?`,
            {
              confirmLabel: 'Yes, Continue',
              cancelLabel: 'Cancel',
              variant: 'primary',
              position: 'top-center',
              backdrop: true
            }
        );

        if (!confirmed) {
          this.isProcessing = false;
          return;
        }
      }
    }

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
          this.toast.error('Payment failed', res?.message || 'An error occurred during payment');
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        console.error('Payment API error:', err);
        const message = err?.error?.message || err?.message || 'Payment error';
        this.toast.error('Error',message,5000);
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

  formatCardName(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.paymentInfo.cardName = input.value;
  }

  isDeliveryAvailableToday(): boolean {
    if (!this.cart.boutique?.livraisonConfig?.deliveryDays) return false;

    const jsDay = new Date().getDay();
    const apiDay = jsDay === 0 ? 7 : jsDay;
    const todayDelivery = this.cart.boutique.livraisonConfig.deliveryDays.find((d: any) => d.day === apiDay);

    return todayDelivery?.isActive || false;
  }

  isDeliveryAvailableNow(): boolean {
    if (!this.cart?.boutique?.livraisonConfig?.orderCutoffTime) return false;

    const cutoffTime = this.cart.boutique.livraisonConfig.orderCutoffTime; // ex: "18:00"
    const now = new Date();

    // Parser l'heure limite (format "HH:MM")
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);

    // Créer une date pour l'heure limite aujourd'hui
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffHour, cutoffMinute, 0, 0);

    // Retourne true si on est avant l'heure limite
    return now < cutoffDate;
  }

  getOrderCutoffTime(): string {
    return this.cart?.boutique?.livraisonConfig?.orderCutoffTime || '';
  }

  getNextDeliveryDay(): string {
    if (!this.cart?.boutique?.livraisonConfig?.deliveryDays) return '';

    const deliveryDays = this.cart.boutique.livraisonConfig.deliveryDays;
    const today = new Date();
    let currentDay = today.getDay(); // 0 = dimanche, 1 = lundi, etc.

    // Convertir en format API (1 = lundi, 7 = dimanche)
    let apiDay = currentDay === 0 ? 7 : currentDay;

    // Chercher le prochain jour actif (maximum 7 jours)
    for (let i = 1; i <= 7; i++) {
      apiDay = apiDay + 1;
      if (apiDay > 7) apiDay = 1; // Boucler sur la semaine

      const dayConfig = deliveryDays.find((d: any) => d.day === apiDay);
      if (dayConfig?.isActive) {
        // Retourner le nom du jour
        return this.getDayName(apiDay);
      }
    }

    return '';
  }

  getDayName(apiDay: number): string {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[apiDay] || '';
  }

  shouldShowDeliveryWarning(): boolean {
    // Cas 1: Livraison complètement désactivée
    if (!this.isDeliveryEnabled()) return true;

    // Cas 2: Livraison non disponible aujourd'hui
    if (!this.isDeliveryAvailableToday()) return true;

    // Cas 3: Heure limite dépassée
    if (this.isDeliveryAvailableToday() && !this.isDeliveryAvailableNow()) return true;

    return false;
  }

  isDeliveryEnabled(): boolean {
    return !!(this.cart && this.cart.boutique && this.cart.boutique.livraisonConfig && this.cart.boutique.livraisonConfig.isDeliveryAvailable);
  }

  isValidCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d{15,16}$/.test(digits)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  isValidCardName(name: string): boolean {
    return /^[A-Z '-]{3,}$/.test(name.trim());
  }


  isValidExpiryDate(expiry: string): boolean {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    return year > currentYear || (year === currentYear && month >= currentMonth);
  }

  isValidCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }


  isReadyToPay(): boolean {
    const paymentValid =
        this.isValidCardNumber(this.paymentInfo.cardNumber) &&
        this.isValidCardName(this.paymentInfo.cardName) &&
        this.isValidExpiryDate(this.paymentInfo.expiryDate) &&
        this.isValidCVV(this.paymentInfo.cvv);

    if (!paymentValid) return false;

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
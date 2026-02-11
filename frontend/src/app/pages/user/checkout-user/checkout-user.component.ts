import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {UserService} from "../../../shared/services/user.service";
import {CommandeService} from "../../../shared/services/commande.service";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";

@Component({
  selector: 'app-checkout-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent],
  templateUrl: './checkout-user.component.html',
  styleUrl: './checkout-user.component.css',
})
export class CheckoutUserComponent implements OnInit {

  profile: any = null;
  cart: any = null;
  isLoading = false;

  // Delivery mode: 'pickup' or 'delivery'
  deliveryMode: 'pickup' | 'delivery' = 'pickup';

  // Selected address
  selectedAddressId: string | null = null;

  // New address (if user wants to add one)
  showNewAddressForm = false;
  newAddress = {
    label: '',
    description: '',
    latitude: -18.913,
    longitude: 47.5296
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
      private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
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

  checkLoadingComplete(): void {
    if (this.cart && this.profile) {
      this.isLoading = false;
    }
  }

  // ════════════════════════════════════════════
  //  DELIVERY MODE
  // ════════════════════════════════════════════

  selectDeliveryMode(mode: 'pickup' | 'delivery'): void {
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
    // TODO: Calculate based on distance if delivery mode
    return this.deliveryMode === 'delivery' ? 500 : 0;
  }

  get tax(): number {
    return this.subtotal * 0.1;
  }

  get total(): number {
    return this.subtotal + this.deliveryFee + this.tax;
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

    // TODO: Call API to process payment
    console.log('Processing payment...', {
      deliveryMode: this.deliveryMode,
      addressId: this.selectedAddressId,
      newAddress: this.showNewAddressForm ? this.newAddress : null,
      paymentInfo: this.paymentInfo,
      total: this.total
    });

    // Simulate API call
    setTimeout(() => {
      this.isProcessing = false;
      alert('Payment processed successfully!');
      this.router.navigate(['/v1/orders']);
    }, 2000);
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

  isPaymentFormValid(): boolean {
    return !!(
        this.paymentInfo.cardNumber.replace(/\s/g, '').length >= 15 &&
        this.paymentInfo.cardName.trim() &&
        this.paymentInfo.expiryDate.length === 5 &&
        this.paymentInfo.cvv.length >= 3
    );
  }
}
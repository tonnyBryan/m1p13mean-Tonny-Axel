import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CommandeService } from '../../../shared/services/commande.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import {SkeletonCartComponent} from "./skeleton-cart/skeleton-cart.component";
import {ToastService} from "../../../shared/services/toast.service";

@Component({
  selector: 'app-cart-user',
  standalone: true,
    imports: [CommonModule, RouterModule, PageBreadcrumbComponent, SkeletonCartComponent],
  templateUrl: './cart-user.component.html',
  styleUrl: './cart-user.component.css',
})
export class CartUserComponent implements OnInit, OnDestroy {

  tax : number = 0;
  cart: any = null;
  isLoading = false;

  // track per-item loading states (by product id)
  itemLoading: Record<string, boolean> = {};

  private timerInterval: any;
  timeRemaining: string = '';

  constructor(
      private commandeService: CommandeService,
      protected router: Router,
      private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFullDraft();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer(): void {
    // Calculer immédiatement
    this.updateTimeRemaining();

    // Puis mettre à jour chaque seconde
    this.timerInterval = setInterval(() => {
      this.updateTimeRemaining();
    }, 1000);
  }

  get taxPrice(): number {
    return this.subtotal * (this.tax / 100);
  }

  get taxPercentage(): number {
    return this.tax;
  }

  loadFullDraft() {
    this.isLoading = true;
    this.commandeService.getDraftFull().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('Draft full response:', res);
        if (res?.success && res?.data) {
          this.cart = res.data;
          this.startTimer();
          console.log('Commande full data:', res.data);
        } else {
          this.cart = null;
          console.log('No draft or empty result');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error fetching draft full:', err);
        if (err.error && err.error.message) {
          this.toast.error('Error',err.error.message,0);
        } else {
          this.toast.error('Error','An error occurred while fetching cart',0);
        }
      }
    });
  }

  /**
   * Met à jour le temps restant
   */
  updateTimeRemaining(): void {
    if (!this.cart?.expiredAt) {
      this.timeRemaining = '';
      return;
    }

    const now = new Date().getTime();
    const expiry = new Date(this.cart.expiredAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      this.timeRemaining = 'Expired';

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      setTimeout(() => {
        this.cart = null;

        this.toast.warning(
            'Cart Expired',
            'Your cart has expired. Please add items again.',
            5000
        );

        this.commandeService.adjustCartCount(-this.commandeService.cartCountSubject.value);
      }, 3000);

      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    this.timeRemaining = parts.join(' ');
  }

  /**
   * Retourne true si le timer est critique (moins de 5 minutes)
   */
  isTimerCritical(): boolean {
    if (!this.cart?.expiredAt) return false;

    const now = new Date().getTime();
    const expiry = new Date(this.cart.expiredAt).getTime();
    const diff = expiry - now;

    // Critique si moins de 5 minutes (300000 ms)
    return diff > 0 && diff <= 300000;
  }

  /**
   * Retourne true si le panier a expiré
   */
  isExpired(): boolean {
    if (!this.cart?.expiredAt) return false;

    const now = new Date().getTime();
    const expiry = new Date(this.cart.expiredAt).getTime();

    return now >= expiry;
  }

  // ════════════════════════════════════════════
  //  QUANTITY MANAGEMENT
  // ════════════════════════════════════════════

  incrementQuantity(item: any): void {
    const product = item.product;
    if (item.quantity < product.maxOrderQty && item.quantity < product.stockReal) {
      const newQty = item.quantity + 1;

      // save snapshot for rollback
      const snapshot = JSON.parse(JSON.stringify(this.cart));

      // optimistic update locally: update item quantity and totals
      item.quantity = newQty;
      item.totalPrice = item.unitPrice * item.quantity;
      this.recalculateTotalAmount();

      // optimistic cart count update
      this.commandeService.adjustCartCount(1);

      this.setItemLoading(item.product._id, true);
      this.commandeService.updateItemQuantity(item.product._id, newQty).subscribe({
        next: (res: any) => {
          this.setItemLoading(item.product._id, false);
          if (res?.success && res?.data) {
            // backend success, but we DO NOT replace local cart with res.data (as requested)
            console.log('Increment quantity confirmed by server');
          } else {
            // rollback
            this.cart = snapshot;
            // rollback badge
            this.commandeService.adjustCartCount(-1);
            alert('Unable to update quantity');
          }
        },
        error: (err: any) => {
          this.setItemLoading(item.product._id, false);
          // rollback
          this.cart = snapshot;
          this.commandeService.adjustCartCount(-1);
          console.error('Error incrementing quantity:', err);
          if (err.error && err.error.message) {
            this.toast.error('Error',err.error.message,5000);
          } else {
            this.toast.error('Error','An error occurred while updating quantity',5000);
          }
        }
      });
    }
  }

  decrementQuantity(item: any): void {
    const product = item.product;
    if (item.quantity > product.minOrderQty) {
      const newQty = item.quantity - 1;

      const snapshot = JSON.parse(JSON.stringify(this.cart));

      // optimistic update
      item.quantity = newQty;
      item.totalPrice = item.unitPrice * item.quantity;
      this.recalculateTotalAmount();

      // optimistic cart count update
      this.commandeService.adjustCartCount(-1);

      this.setItemLoading(item.product._id, true);
      this.commandeService.updateItemQuantity(item.product._id, newQty).subscribe({
        next: (res: any) => {
          this.setItemLoading(item.product._id, false);
          if (res?.success && res?.data) {
            console.log('Decrement quantity confirmed by server');
          } else {
            // rollback
            this.cart = snapshot;
            this.commandeService.adjustCartCount(1);
            alert('Unable to update quantity');
          }
        },
        error: (err: any) => {
          this.setItemLoading(item.product._id, false);
          // rollback
          this.cart = snapshot;
          this.commandeService.adjustCartCount(1);
          console.error('Error decrementing quantity:', err);
          if (err.error && err.error.message) {
            this.toast.error('Error',err.error.message,5000);
          } else {
            this.toast.error('Error','An error occurred while updating quantity',5000);
          }
        }
      });
    }
  }

  canIncrement(item: any): boolean {
    const product = item.product;
    return item.quantity < product.maxOrderQty && item.quantity < product.stockReal && !this.itemLoading[item.product._id];
  }

  canDecrement(item: any): boolean {
    const product = item.product;
    return item.quantity > product.minOrderQty && !this.itemLoading[item.product._id];
  }

  removeItem(item: any, index: number): void {
    this.toast.confirm(
        'Remove item from cart?',
        'Are you sure you want to remove this item from your cart?',
        () => {
          this.performRemoveItem(item);
        },
        () => {
          console.log('Removal cancelled');
        },
        {
          confirmLabel: 'Remove',
          cancelLabel: 'Keep item',
          variant: 'danger',
          position: 'top-center',
          backdrop: true,
        }
    );
  }

  private performRemoveItem(item: any): void {
    const snapshot = JSON.parse(JSON.stringify(this.cart));

    const prodId = item.product._id;
    const itemQty = item.quantity || 0;
    this.cart.products = this.cart.products.filter((p: any) =>
        String(p.product._id || p.product) !== String(prodId)
    );
    this.recalculateTotalAmount();

    this.commandeService.adjustCartCount(-itemQty);

    this.setItemLoading(prodId, true);
    this.commandeService.removeFromCart(prodId).subscribe({
      next: (res: any) => {
        this.setItemLoading(prodId, false);
        if (res?.success) {
          this.toast.success('Item removed', 'The item has been removed from your cart');

          if (!this.cart.products || this.cart.products.length === 0) {
            this.cart = null;
          }
        } else {
          // rollback
          this.cart = snapshot;
          this.commandeService.adjustCartCount(itemQty);
          this.toast.error('Unable to remove item', 'Please try again');
        }
      },
      error: (err: any) => {
        this.setItemLoading(prodId, false);
        // rollback
        this.cart = snapshot;
        this.commandeService.adjustCartCount(itemQty);
        console.error('Error removing item:', err);
        this.toast.error(
            'Error',
            err?.error?.message || 'An error occurred while removing the item',
            5000
        );
      }
    });
  }

  // helper to set per-item loading
  setItemLoading(productId: string, loading: boolean) {
    if (!productId) return;
    if (loading) this.itemLoading[productId] = true;
    else delete this.itemLoading[productId];
  }

  // ════════════════════════════════════════════
  //  PRICE CALCULATIONS
  // ════════════════════════════════════════════


  recalculateTotalAmount(): void {
    this.cart.totalAmount = this.cart.products.reduce(
        (sum: number, item: any) => sum + item.totalPrice,
        0
    );
  }

  get subtotal(): number {
    return this.cart?.totalAmount || 0;
  }


  get total(): number {
    return this.subtotal + this.taxPrice;
  }

  // ════════════════════════════════════════════
  //  EXPIRATION
  // ════════════════════════════════════════════

  getTimeRemaining(): string {
    if (!this.cart?.expiredAt) return '';

    const now = new Date().getTime();
    const expiry = new Date(this.cart.expiredAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ');
  }

  isExpiringSoon(): boolean {
    if (!this.cart?.expiredAt) return false;
    const now = new Date().getTime();
    const expiry = new Date(this.cart.expiredAt).getTime();
    const diff = expiry - now;
    const oneHour = 1000 * 60 * 60;
    return diff > 0 && diff < oneHour;
  }

  // ════════════════════════════════════════════
  //  ACTIONS
  // ════════════════════════════════════════════

  proceedToCheckout(): void {
    // TODO: Navigate to checkout
    console.log('Proceed to checkout');
    this.router.navigate(['/v1/cart/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/v1/stores/' , this.cart.boutique._id]);
  }

  explore() : void {
    this.router.navigate(['/v1/stores/']);
  }

  goToShop(): void {
    if (this.cart?.boutique?._id) {
      this.router.navigate(['/v1/stores', this.cart.boutique._id]);
    }
  }

  // ════════════════════════════════════════════
  //  UTILITIES
  // ════════════════════════════════════════════

  getProductImage(item: any): string {
    return item.product?.images?.[0] || '/product-placeholder.png';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }
}
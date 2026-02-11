import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CommandeService } from '../../../shared/services/commande.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-cart-user',
  standalone: true,
  imports: [CommonModule, RouterModule, PageBreadcrumbComponent],
  templateUrl: './cart-user.component.html',
  styleUrl: './cart-user.component.css',
})
export class CartUserComponent implements OnInit {
  cart: any = null;
  isLoading = false;

  // track per-item loading states (by product id)
  itemLoading: Record<string, boolean> = {};

  constructor(
      private commandeService: CommandeService,
      protected router: Router
  ) {}

  ngOnInit(): void {
    this.loadFullDraft();
  }

  loadFullDraft() {
    this.isLoading = true;
    this.commandeService.getDraftFull().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('Draft full response:', res);
        if (res?.success && res?.data) {
          this.cart = res.data;
          console.log('Commande full data:', res.data);
        } else {
          this.cart = null;
          console.log('No draft or empty result');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.cart = null;
        console.error('Error fetching draft full:', err);
      }
    });
  }

  // ════════════════════════════════════════════
  //  QUANTITY MANAGEMENT
  // ════════════════════════════════════════════

  incrementQuantity(item: any): void {
    const product = item.product;
    if (item.quantity < product.maxOrderQty && item.quantity < product.stock) {
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
          alert(err?.error?.message || 'Error updating quantity');
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
          alert(err?.error?.message || 'Error updating quantity');
        }
      });
    }
  }

  canIncrement(item: any): boolean {
    const product = item.product;
    return item.quantity < product.maxOrderQty && item.quantity < product.stock && !this.itemLoading[item.product._id];
  }

  canDecrement(item: any): boolean {
    const product = item.product;
    return item.quantity > product.minOrderQty && !this.itemLoading[item.product._id];
  }

  removeItem(item: any, index: number): void {
    if (!confirm('Are you sure you want to remove this item from your cart?')) return;

    const snapshot = JSON.parse(JSON.stringify(this.cart));

    // optimistic update: remove item locally
    const prodId = item.product._id;
    const itemQty = item.quantity || 0;
    this.cart.products = this.cart.products.filter((p: any) => String(p.product._id || p.product) !== String(prodId));
    this.recalculateTotalAmount();

    // optimistic badge update
    this.commandeService.adjustCartCount(-itemQty);

    this.setItemLoading(prodId, true);
    this.commandeService.removeFromCart(prodId).subscribe({
      next: (res: any) => {
        this.setItemLoading(prodId, false);
        if (res?.success) {
          console.log('Remove confirmed by server');
          if (!this.cart.products || this.cart.products.length === 0) this.cart = null;
        } else {
          // rollback
          this.cart = snapshot;
          this.commandeService.adjustCartCount(itemQty);
          alert('Unable to remove item');
        }
      },
      error: (err: any) => {
        this.setItemLoading(prodId, false);
        // rollback
        this.cart = snapshot;
        this.commandeService.adjustCartCount(itemQty);
        console.error('Error removing item:', err);
        alert(err?.error?.message || 'Error removing item');
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

  get tax(): number {
    // Exemple: 10% de taxe
    return this.subtotal * 0.1;
  }

  get total(): number {
    return this.subtotal + this.tax;
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
    this.router.navigate(['/v1/stores']);
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
    return item.product?.images?.[0] || '/assets/images/product-placeholder.png';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }
}
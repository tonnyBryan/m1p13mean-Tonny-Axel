import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WishlistService } from "../../../shared/services/wishlist.service";
import { ToastService } from "../../../shared/services/toast.service";
import { WishlistItem } from "../../../core/models/WishlistItem.model";
import { ShareProductUserComponent } from "../share-product-user/share-product-user.component";

@Component({
  selector: 'app-wishlist-user',
  standalone: true,
  imports: [CommonModule, RouterModule, ShareProductUserComponent],
  templateUrl: './wishlist-user.component.html',
  styleUrl: './wishlist-user.component.css',
})
export class WishlistUserComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  isLoading = false;
  isRemoving: { [key: string]: boolean } = {};

  // Share modal state
  showShareModal = false;
  selectedProductId: string | null = null;

  constructor(
      private wishlistService: WishlistService,
      private toast: ToastService,
      public router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyWishlist();
  }

  loadMyWishlist() {
    this.isLoading = true;
    this.wishlistService.getMyWishlist().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data?.products) {
          this.wishlistItems = res.data.products;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        const msg = err?.error?.message || 'Error loading wishlist';
        this.toast.error('Error', msg, 5000);
      }
    });
  }

  confirmRemove(item: WishlistItem) {
    this.toast.confirm(
        'Remove from wishlist?',
        `Are you sure you want to remove "${item.product.name}" from your wishlist?`,
        () => {
          this.removeFromWishlist(item.product._id);
        },
        () => {
          console.log('Removal cancelled');
        },
        {
          confirmLabel: 'Remove',
          cancelLabel: 'Keep it',
          variant: 'danger',
          position: 'top-center',
          backdrop: true,
        }
    );
  }

  removeFromWishlist(productId: string) {
    this.isRemoving[productId] = true;

    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: () => {
        this.isRemoving[productId] = false;
        this.wishlistItems = this.wishlistItems.filter(
            item => item.product._id !== productId
        );
        this.toast.success('Success', 'Item removed from wishlist', 3000);
      },
      error: (err) => {
        this.isRemoving[productId] = false;
        const msg = err?.error?.message || 'Failed to remove item';
        this.toast.error('Error', msg, 5000);
      }
    });
  }

  shareProduct(item: WishlistItem) {
    this.selectedProductId = item.product._id;
    this.showShareModal = true;
  }

  closeShareModal() {
    this.showShareModal = false;
    this.selectedProductId = null;
  }

  goToProduct(item: WishlistItem) {
    this.router.navigate([`/v1/stores/${item.boutique._id}/products/${item.product._id}`]);
  }

  goToStore(item: WishlistItem) {
    this.router.navigate([`/v1/stores/${item.boutique._id}`]);
  }

  formatDate(date: Date | undefined): string {
    if (date === undefined) {
      return "";
    }

    const now = new Date();
    const added = new Date(date);
    const diffMs = now.getTime() - added.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }
}
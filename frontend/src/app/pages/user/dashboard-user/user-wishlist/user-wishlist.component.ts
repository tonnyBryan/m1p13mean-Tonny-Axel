import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../../../shared/services/wishlist.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface WishlistItem {
  productId: string;
  boutiqueId: string;
  name: string;
  boutiqueName: string;
  price: number;
  image: string | null;
  addedAt: Date;
}

@Component({
  selector: 'app-user-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-wishlist.component.html',
})
export class UserWishlistComponent implements OnInit {

  items: WishlistItem[] = [];
  totalWishlist = 0;
  isLoading = true;

  constructor(
      private wishlistService: WishlistService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    const params = { page: 1, limit: 3, sort: '-createdAt' };
    this.wishlistService.getAllWishList(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.totalWishlist = res.data.total;
          this.items = res.data.items.map((item: any) => ({
            productId: item.product._id,
            boutiqueId: item.boutique._id,
            name: item.product.name,
            boutiqueName: item.boutique.name,
            price: item.product.effectivePrice,
            image: item.product.images?.[0] ?? null,
            addedAt: new Date(item.addedAt),
          }));
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load wishlist.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load wishlist.', 0);
        this.isLoading = false;
      }
    });
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
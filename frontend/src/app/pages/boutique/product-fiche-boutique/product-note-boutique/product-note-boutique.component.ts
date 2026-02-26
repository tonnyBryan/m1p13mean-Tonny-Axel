import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../shared/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { RatingStarComponent } from '../../../../shared/components/common/rating-star/rating-star.component';

interface ProductRating {
  _id: string;
  product: string;
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  userInfo: {
    firstName: string;
    lastName: string;
    photo: string;
  };
}

@Component({
  selector: 'app-product-note-boutique',
  standalone: true,
  imports: [CommonModule, RatingStarComponent],
  templateUrl: './product-note-boutique.component.html',
  styleUrl: './product-note-boutique.component.css',
})
export class ProductNoteBoutiqueComponent implements OnChanges {
  @Input() product!: Product | null;

  ratings: ProductRating[] = [];
  isLoading = false;
  isLoadingMore = false;

  // Pagination
  page = 1;
  limit = 10;
  totalDocs = 0;
  hasMore = false;

  constructor(private productService: ProductService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product && this.product._id) {
      this.resetAndLoad();
    }
  }

  resetAndLoad(): void {
    this.ratings = [];
    this.page = 1;
    this.loadProductRatings();
  }

  loadProductRatings(): void {
    if (!this.product || !this.product._id) return;

    this.isLoading = true;
    this.productService
        .getRatingsByProduct(this.product._id, { page: this.page, limit: this.limit })
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success && res.data) {
              this.ratings = res.data.items || [];
              this.totalDocs = res.data.pagination?.totalDocs || 0;
              this.hasMore = this.ratings.length < this.totalDocs;
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Failed to load product ratings', err);
          },
        });
  }

  loadMore(): void {
    if (!this.product || !this.product._id || this.isLoadingMore || !this.hasMore) return;

    this.isLoadingMore = true;
    this.page++;

    this.productService
        .getRatingsByProduct(this.product._id, { page: this.page, limit: this.limit })
        .subscribe({
          next: (res) => {
            this.isLoadingMore = false;
            if (res.success && res.data) {
              this.ratings = [...this.ratings, ...(res.data.items || [])];
              this.hasMore = this.ratings.length < this.totalDocs;
            }
          },
          error: (err) => {
            this.isLoadingMore = false;
            this.page--;
            console.error('Failed to load more ratings', err);
          },
        });
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
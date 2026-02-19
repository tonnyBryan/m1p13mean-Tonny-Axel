import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../shared/services/product.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Product } from '../../../../core/models/product.model';
import { RatingStarComponent } from '../../../../shared/components/common/rating-star/rating-star.component';
import { AuthService } from "../../../../shared/services/auth.service";

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
  selector: 'app-product-note-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingStarComponent],
  templateUrl: './product-note-user.component.html',
  styleUrl: './product-note-user.component.css',
})
export class ProductNoteUserComponent implements OnChanges {
  @Input() product!: Product | null;

  ratings: ProductRating[] = [];
  isLoading = false;
  isLoadingMore = false;
  isSubmitting = false;
  deletingRatingId: string | null = null;

  // Pagination
  page = 1;
  limit = 10;
  totalDocs = 0;
  hasMore = false;

  // Add review form
  showAddReviewForm = false;
  newRating = 0;
  newComment = '';
  hoveredStar = 0;

  // Current user ID
  currentUserId: string | null = null;

  constructor(
      private productService: ProductService,
      private toast: ToastService,
      private authService: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product && this.product._id) {
      this.currentUserId = this.authService.userHash?.id || null;
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
    this.productService.getRatingsByProduct(this.product._id, { page: this.page, limit: this.limit })
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
          }
        });
  }

  loadMore(): void {
    if (!this.product || !this.product._id || this.isLoadingMore || !this.hasMore) return;

    this.isLoadingMore = true;
    this.page++;

    this.productService.getRatingsByProduct(this.product._id, { page: this.page, limit: this.limit })
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
            this.page--; // Revert page on error
            console.error('Failed to load more ratings', err);
            this.toast.error('Error', 'Failed to load more reviews');
          }
        });
  }

  toggleAddReviewForm(): void {
    this.showAddReviewForm = !this.showAddReviewForm;
    if (!this.showAddReviewForm) {
      this.resetForm();
    }
  }

  selectRating(star: number): void {
    this.newRating = star;
  }

  hoverStar(star: number): void {
    this.hoveredStar = star;
  }

  resetHover(): void {
    this.hoveredStar = 0;
  }

  submitReview(): void {
    if (!this.product || !this.product._id) return;

    if (this.newRating === 0) {
      this.toast.warning('Required', 'Please select a rating');
      return;
    }

    if (!this.newComment.trim()) {
      this.toast.warning('Required', 'Please write a comment');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      rating: this.newRating,
      comment: this.newComment.trim()
    };

    this.productService.addProductRating(this.product._id, payload)
        .subscribe({
          next: (res) => {
            this.isSubmitting = false;
            if (res.success) {
              if (this.product && res.data) {
                this.product.avgRating = res.data.avgRating ?? this.product.avgRating;
                this.product.totalRatings = res.data.totalRatings ?? this.product.totalRatings;
              }

              // this.toast.success('Success', 'Review submitted successfully!');
              this.resetForm();
              this.showAddReviewForm = false;
              this.resetAndLoad(); // Reload ratings
            }
          },
          error: (err) => {
            this.isSubmitting = false;
            const msg = err.error?.message || 'Failed to submit review';
            this.toast.error('Error', msg);
          }
        });
  }

  confirmDeleteReview(rating: ProductRating): void {
    this.toast.confirm(
        'Delete your review?',
        'Are you sure you want to delete your review? This action cannot be undone.',
        () => {
          this.deleteReview(rating);
        },
        () => {
          console.log('Deletion cancelled');
        },
        {
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          variant: 'danger',
          position: 'top-center',
          backdrop: true,
        }
    );
  }

  deleteReview(rating: ProductRating): void {
    if (!this.product || !this.product._id) return;

    this.deletingRatingId = rating._id;

    this.productService.removeProductRating(this.product._id)
        .subscribe({
          next: (res) => {
            this.deletingRatingId = null;
            if (res.success) {
              // Update avgRating and totalRatings if provided
              console.log(res.data);
              if (this.product && res.data) {
                this.product.avgRating = res.data.avgRating ?? this.product.avgRating;
                this.product.totalRatings = res.data.totalRatings ?? this.product.totalRatings;
              }

              // Remove from local array
              this.ratings = this.ratings.filter(r => r._id !== rating._id);
              this.totalDocs--;

              // this.toast.success('Success', 'Review deleted successfully');
            }
          },
          error: (err) => {
            this.deletingRatingId = null;
            const msg = err.error?.message || 'Failed to delete review';
            this.toast.error('Error', msg);
          }
        });
  }

  isCurrentUserReview(rating: ProductRating): boolean {
    return this.currentUserId === rating.user;
  }

  resetForm(): void {
    this.newRating = 0;
    this.newComment = '';
    this.hoveredStar = 0;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  get canSubmit(): boolean {
    return this.newRating > 0 && this.newComment.trim().length > 0 && !this.isSubmitting;
  }
}
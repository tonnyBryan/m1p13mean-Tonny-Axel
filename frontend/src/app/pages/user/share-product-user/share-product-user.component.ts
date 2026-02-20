import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { ProductService } from '../../../shared/services/product.service';
import { ToastService } from '../../../shared/services/toast.service';

interface SearchUser {
  _id: string;
  name: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
    photo: string;
  } | null;
}

@Component({
  selector: 'app-share-product-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './share-product-user.component.html',
  styleUrls: ['./share-product-user.component.css'],
})
export class ShareProductUserComponent {
  @Input() productId!: string;
  @Output() closeModal = new EventEmitter<void>();

  query: string = '';
  results: SearchUser[] = [];
  loading: boolean = false;
  tooMany: boolean = false;
  selectedUser: SearchUser | null = null;
  additionalMessage: string = '';
  isSharing: boolean = false;

  constructor(
      private userService: UserService,
      private productService: ProductService,
      private toast: ToastService
  ) {}

  search() {
    const q = (this.query || '').trim();
    if (!q) {
      this.results = [];
      this.tooMany = false;
      return;
    }
    this.loading = true;
    this.userService.searchUsers(q).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.results = res.data.items || [];
          this.tooMany = res.data.tooMany || false;
        } else {
          this.results = [];
          this.tooMany = false;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Search error', err);
        this.toast.error('Error', err.error?.message || 'An error occurred while searching users');
      }
    });
  }

  selectUser(user: SearchUser) {
    this.selectedUser = user;
  }

  share() {
    if (!this.selectedUser || !this.productId) return;

    this.isSharing = true;

    this.productService.shareProduct(this.productId, this.selectedUser._id, this.additionalMessage.trim()).subscribe({
      next: (res) => {
        this.isSharing = false;
        if (res && res.success) {
          this.toast.success('Success', res.message || 'Product shared successfully!');
          this.close();
        } else {
          this.toast.error('Error', res.message || 'Unable to share product');
        }
      },
      error: (err) => {
        this.isSharing = false;
        console.error('Share error', err);
        this.toast.error('Error', err.error?.message || 'An error occurred while sharing the product');
      }
    });
  }

  close() {
    this.closeModal.emit();
  }

  getUserDisplayName(user: SearchUser): string {
    if (user.profile?.firstName) {
      return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
    }
    return user.name;
  }

  getInitials(user: SearchUser): string {
    if (user.profile?.firstName) {
      const first = user.profile.firstName.charAt(0);
      const last = user.profile.lastName?.charAt(0) || '';
      return `${first}${last}`.toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  }
}
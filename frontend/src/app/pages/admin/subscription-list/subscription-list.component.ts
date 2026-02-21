import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../shared/services/subscription.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.css',
})
export class SubscriptionListComponent implements OnInit {

  subscriptions: any[] = [];
  page = 1;
  limit = 20;
  totalPages = 0;
  totalDocs = 0;
  searchEmail = '';
  isLoading = false;

  constructor(
      private subscriptionService: SubscriptionService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(page: number = 1): void {
    this.page = page;
    const params: any = {
      page: this.page,
      limit: this.limit,
      sort: '-createdAt',
    };

    if (this.searchEmail.trim()) {
      params['email[regex]'] = this.searchEmail.trim();
      params['email[options]'] = 'i';
    }

    this.isLoading = true;
    this.subscriptionService.getSubscriptions(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.subscriptions = res.data.items;
          this.totalDocs = res.data.pagination.totalDocs;
          this.totalPages = res.data.pagination.totalPages;
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load subscriptions.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load subscriptions.', 0);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadSubscriptions(1);
  }

  clearSearch(): void {
    this.searchEmail = '';
    this.loadSubscriptions(1);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
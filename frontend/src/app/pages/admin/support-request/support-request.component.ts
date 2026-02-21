import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportRequestService } from '../../../shared/services/support-request.service';
import { ToastService } from '../../../shared/services/toast.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-support-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-request.component.html',
  styleUrl: './support-request.component.css',
})
export class SupportRequestComponent implements OnInit {

  requests: any[] = [];
  page = 1;
  limit = 10;
  totalPages = 0;
  totalDocs = 0;
  searchEmail = '';
  searchSubject = '';
  searchFullName = '';
  isAnswered: string | null = null;
  isLoading = false;
  expandedId: string | null = null;

  constructor(
      private supportService: SupportRequestService,
      private toast: ToastService,
      private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSupportRequests();
  }

  loadSupportRequests(page: number = 1): void {
    this.page = page;
    const params: any = { page: this.page, limit: this.limit, sort: '-createdAt' };

    if (this.searchEmail.trim()) { params['email[regex]'] = this.searchEmail.trim(); params['email[options]'] = 'i'; }
    if (this.searchSubject.trim()) { params['subject[regex]'] = this.searchSubject.trim(); params['subject[options]'] = 'i'; }
    if (this.searchFullName.trim()) { params['fullName[regex]'] = this.searchFullName.trim(); params['fullName[options]'] = 'i'; }
    if (this.isAnswered === 'true' || this.isAnswered === 'false') params['isAnswered'] = this.isAnswered === 'true';

    this.isLoading = true;
    this.supportService.getSupportRequests(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.requests = res.data.items;
          this.totalDocs = res.data.pagination.totalDocs;
          this.totalPages = res.data.pagination.totalPages;
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load support requests.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load support requests.', 0);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void { this.loadSupportRequests(1); }

  clearSearch(): void {
    this.searchEmail = '';
    this.searchSubject = '';
    this.searchFullName = '';
    this.isAnswered = null;
    this.loadSupportRequests(1);
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  onReply(request: any): void {
    this.router.navigate(['/admin/app/support-requests', request._id, 'reply']);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(date));
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchEmail || this.searchSubject || this.searchFullName || this.isAnswered);
  }
}
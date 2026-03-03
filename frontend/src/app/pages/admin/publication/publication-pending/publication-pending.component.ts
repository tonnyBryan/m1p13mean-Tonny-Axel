import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {PublicationService} from "../../../../shared/services/publication.service";

interface Publication {
  _id: string;
  content: string;
  images: string[];
  type: string | null;
  status: 'pending' | 'published' | 'rejected';
  createdAt: string;
  author: { name: string; email: string };
  boutique: { _id: string; name: string; logo: string } | null;
}

@Component({
  selector: 'app-publication-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-pending.component.html',
})
export class PublicationPendingComponent implements OnInit {

  publications: Publication[] = [];
  loading = true;
  error: string | null = null;

  // Reject modal
  rejectModalId: string | null = null;
  rejectReason = '';
  rejectLoading = false;
  rejectError: string | null = null;

  // Approve loading
  approveLoadingId: string | null = null;

  // Image lightbox
  lightboxImages: string[] = [];
  lightboxIndex = 0;
  lightboxOpen = false;

  readonly typeConfig: Record<string, { label: string; icon: string; cls: string }> = {
    announcement: { label: 'Announcement', icon: '📢', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    promotion:    { label: 'Promotion',    icon: '🏷️', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    new_arrival:  { label: 'New Arrival',  icon: '✨', cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    event:        { label: 'Event',        icon: '🎉', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };

  constructor(private publicationService: PublicationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.publicationService.getPendingPublications().subscribe({
      next: (res) => {
        this.publications = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load pending publications.';
        this.loading = false;
      }
    });
  }

  approve(id: string): void {
    this.approveLoadingId = id;
    this.publicationService.approvePublication(id).subscribe({
      next: () => {
        this.publications = this.publications.filter(p => p._id !== id);
        this.approveLoadingId = null;
      },
      error: () => {
        this.approveLoadingId = null;
      }
    });
  }

  openRejectModal(id: string): void {
    this.rejectModalId = id;
    this.rejectReason = '';
    this.rejectError = null;
  }

  closeRejectModal(): void {
    this.rejectModalId = null;
    this.rejectReason = '';
    this.rejectError = null;
  }

  submitReject(): void {
    if (!this.rejectModalId || this.rejectReason.trim().length < 3) {
      this.rejectError = 'The reason must be at least 3 characters.';
      return;
    }
    this.rejectLoading = true;
    this.rejectError = null;
    const id = this.rejectModalId;

    this.publicationService.rejectPublication(id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.publications = this.publications.filter(p => p._id !== id);
        this.rejectLoading = false;
        this.closeRejectModal();
      },
      error: (err) => {
        this.rejectError = err?.error?.message ?? 'An error occurred.';
        this.rejectLoading = false;
      }
    });
  }

  openLightbox(images: string[], index: number): void {
    this.lightboxImages = images;
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  prevImage(): void {
    this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
  }

  nextImage(): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}

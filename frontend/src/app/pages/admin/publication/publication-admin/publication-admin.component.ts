import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { PublicationService } from '../../../../shared/services/publication.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface Publication {
  _id: string;
  content: string;
  images: string[];
  type: string | null;
  status: 'published' | 'pending' | 'rejected';
  rejectedReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  authorType: 'admin' | 'boutique';
  author: { name: string; email: string };
  boutique: { _id: string; name: string; logo: string } | null;
}

type Tab = 'mine' | 'all' | 'pending';

@Component({
  selector: 'app-publication-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-admin.component.html',
})
export class PublicationAdminComponent implements OnInit {

  activeTab: Tab = 'mine';

  // Data per tab
  myPublications:      Publication[] = [];
  allPublications:     Publication[] = [];
  pendingPublications: Publication[] = [];

  // Loading per tab
  loadingMine    = false;
  loadingAll     = false;
  loadingPending = false;

  // Loaded flags (load once)
  loadedMine    = false;
  loadedAll     = false;
  loadedPending = false;

  error: string | null = null;

  // Reject modal
  rejectModalId: string | null = null;
  rejectReason  = '';
  rejectLoading = false;
  rejectError:  string | null = null;

  // Action loading
  approveLoadingId: string | null = null;
  deleteLoadingId:  string | null = null;

  // Lightbox
  lightboxImages: string[] = [];
  lightboxIndex  = 0;
  lightboxOpen   = false;

  // All tab pagination
  allPage       = 1;
  allTotalPages = 1;
  allTotal      = 0;
  readonly PAGE_LIMIT = 10;

  readonly typeConfig: Record<string, { label: string; icon: string; cls: string }> = {
    announcement: { label: 'Announcement', icon: '📢', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    promotion:    { label: 'Promotion',    icon: '🏷️', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    new_arrival:  { label: 'New Arrival',  icon: '✨', cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    event:        { label: 'Event',        icon: '🎉', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };

  readonly statusConfig: Record<string, { label: string; cls: string }> = {
    published: { label: 'Published', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    pending:   { label: 'Pending',   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  };

  constructor(
      private publicationService: PublicationService,
      private router: Router,
      private toast: ToastService,
      private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as Tab;
    const initialTab: Tab = (tab && ['mine', 'all', 'pending'].includes(tab)) ? tab : 'mine';
    this.activeTab = initialTab;
    this.loadTab(initialTab);
  }
  // ─── Tab navigation ───────────────────────────────────────────────────────

  switchTab(tab: Tab): void {
    this.activeTab = tab;
    this.error = null;
    this.loadTab(tab);
  }

  loadTab(tab: Tab): void {
    if (tab === 'mine'    && !this.loadedMine)    this.loadMine();
    if (tab === 'all'     && !this.loadedAll)     this.loadAll();
    if (tab === 'pending' && !this.loadedPending) this.loadPending();
  }

  // ─── Load data ────────────────────────────────────────────────────────────

  loadMine(): void {
    this.loadingMine = true;
    this.error = null;
    this.publicationService.getMyPublications().subscribe({
      next: (res) => {
        this.myPublications = res.data ?? [];
        this.loadingMine = false;
        this.loadedMine  = true;
      },
      error: () => {
        this.error = 'Unable to load your publications.';
        this.loadingMine = false;
      }
    });
  }

  loadAll(page = 1): void {
    this.loadingAll = true;
    this.error = null;
    this.publicationService.getPublications({ page, limit: this.PAGE_LIMIT }).subscribe({
      next: (res) => {
        this.allPublications = res.data?.publications ?? [];
        this.allTotal        = res.data?.pagination?.total ?? 0;
        this.allTotalPages   = res.data?.pagination?.totalPages ?? 1;
        this.allPage         = page;
        this.loadingAll      = false;
        this.loadedAll       = true;
      },
      error: () => {
        this.error = 'Unable to load publications.';
        this.loadingAll = false;
      }
    });
  }

  loadPending(): void {
    this.loadingPending = true;
    this.error = null;
    this.publicationService.getPendingPublications().subscribe({
      next: (res) => {
        this.pendingPublications = res.data ?? [];
        this.loadingPending = false;
        this.loadedPending  = true;
      },
      error: () => {
        this.error = 'Unable to load pending publications.';
        this.loadingPending = false;
      }
    });
  }

  refreshCurrent(): void {
    if (this.activeTab === 'mine')    { this.loadedMine    = false; this.loadMine(); }
    if (this.activeTab === 'all')     { this.loadedAll     = false; this.loadAll(this.allPage); }
    if (this.activeTab === 'pending') { this.loadedPending = false; this.loadPending(); }
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  goCreate(): void {
    this.router.navigate(['/admin/app/publications/add']);
  }

  askDelete(pub: Publication): void {
    const label = this.truncate(pub.content, 60);
    this.toast.confirm(
        'Delete publication?',
        `Are you sure you want to delete "${label}"?`,
        () => this.confirmDelete(pub._id),
        () => {},
        { confirmLabel: 'Delete', cancelLabel: 'Keep it', variant: 'danger', position: 'top-center', backdrop: true }
    );
  }

  confirmDelete(id: string): void {
    this.deleteLoadingId = id;
    this.publicationService.deletePublication(id).subscribe({
      next: () => {
        this.myPublications      = this.myPublications.filter(p => p._id !== id);
        this.allPublications     = this.allPublications.filter(p => p._id !== id);
        this.pendingPublications = this.pendingPublications.filter(p => p._id !== id);
        this.deleteLoadingId = null;
      },
      error: () => { this.deleteLoadingId = null; }
    });
  }

  approve(id: string): void {
    this.approveLoadingId = id;
    this.publicationService.approvePublication(id).subscribe({
      next: () => {
        this.pendingPublications = this.pendingPublications.filter(p => p._id !== id);
        this.approveLoadingId = null;
        // Reset all tab so it reloads with new publication
        this.loadedAll = false;
      },
      error: () => { this.approveLoadingId = null; }
    });
  }

  openRejectModal(id: string): void {
    this.rejectModalId = id;
    this.rejectReason  = '';
    this.rejectError   = null;
  }

  closeRejectModal(): void {
    this.rejectModalId = null;
    this.rejectReason  = '';
    this.rejectError   = null;
  }

  submitReject(): void {
    if (!this.rejectModalId || this.rejectReason.trim().length < 3) {
      this.rejectError = 'The reason must be at least 3 characters.';
      return;
    }
    this.rejectLoading = true;
    this.rejectError   = null;
    const id = this.rejectModalId;

    this.publicationService.rejectPublication(id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.pendingPublications = this.pendingPublications.filter(p => p._id !== id);
        this.rejectLoading = false;
        this.closeRejectModal();
      },
      error: (err) => {
        this.rejectError   = err?.error?.message ?? 'An error occurred.';
        this.rejectLoading = false;
      }
    });
  }

  // ─── Lightbox ─────────────────────────────────────────────────────────────

  openLightbox(images: string[], index: number): void {
    this.lightboxImages = images;
    this.lightboxIndex  = index;
    this.lightboxOpen   = true;
  }

  closeLightbox(): void { this.lightboxOpen = false; }

  prevImage(): void {
    this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
  }

  nextImage(): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length;
  }

  // ─── Pagination ───────────────────────────────────────────────────────────

  prevPage(): void {
    if (this.allPage > 1) { this.loadedAll = false; this.loadAll(this.allPage - 1); }
  }

  nextPage(): void {
    if (this.allPage < this.allTotalPages) { this.loadedAll = false; this.loadAll(this.allPage + 1); }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  truncate(text: string, max = 120): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  get isLoading(): boolean {
    return (this.activeTab === 'mine'    && this.loadingMine)
        || (this.activeTab === 'all'     && this.loadingAll)
        || (this.activeTab === 'pending' && this.loadingPending);
  }

  get currentList(): Publication[] {
    if (this.activeTab === 'mine')    return this.myPublications;
    if (this.activeTab === 'all')     return this.allPublications;
    if (this.activeTab === 'pending') return this.pendingPublications;
    return [];
  }
}
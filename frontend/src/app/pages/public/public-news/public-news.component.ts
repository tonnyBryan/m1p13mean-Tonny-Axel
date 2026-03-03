import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationService } from '../../../shared/services/publication.service';
import { environment } from '../../../../environments/environment';

interface Publication {
  _id: string; content: string; images: string[];
  type: string | null; status: string;
  publishedAt: string | null; createdAt: string;
  author: { name: string };
  authorType: 'admin' | 'boutique';
  boutique: { name: string; logo: string } | null;
}

@Component({
  selector: 'app-public-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-news.component.html',
})
export class PublicNewsComponent implements OnInit {

  publications: Publication[] = [];
  loading = false; loadingMore = false;
  error: string | null = null;
  hasMore = false; totalPublications = 0;
  activeFilter = 'all'; page = 1;
  readonly PAGE_LIMIT = 9;
  readonly skeletonItems = Array(6).fill(0);
  lightboxImages: string[] = []; lightboxIndex = 0; lightboxOpen = false;
  readonly platformName = environment.plateformeName;

  readonly filters = [
    { value: 'all',          label: 'All',          icon: '🌐' },
    { value: 'announcement', label: 'News',          icon: '📢' },
    { value: 'promotion',    label: 'Deals',         icon: '🏷️' },
    { value: 'new_arrival',  label: 'New arrivals',  icon: '✨' },
    { value: 'event',        label: 'Events',        icon: '🎉' },
  ];

  readonly typeConfig: Record<string, { label: string; icon: string; cls: string }> = {
    announcement: { label: 'News',       icon: '📢', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    promotion:    { label: 'Deal',        icon: '🏷️', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    new_arrival:  { label: 'New Arrival', icon: '✨', cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    event:        { label: 'Event',       icon: '🎉', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };

  constructor(private publicationService: PublicationService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = null; this.page = 1;
    const params: any = { page: 1, limit: this.PAGE_LIMIT };
    if (this.activeFilter !== 'all') params.type = this.activeFilter;
    this.publicationService.getPublications(params).subscribe({
      next: (res) => {
        this.publications = res.data?.publications ?? [];
        console.log(this.publications);
        this.totalPublications = res.data?.pagination?.total ?? 0;
        this.hasMore = this.page < (res.data?.pagination?.totalPages ?? 1);
        this.loading = false;
      },
      error: () => { this.error = 'Unable to load news.'; this.loading = false; }
    });
  }

  loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;
    this.loadingMore = true; this.page++;
    const params: any = { page: this.page, limit: this.PAGE_LIMIT };
    if (this.activeFilter !== 'all') params.type = this.activeFilter;
    this.publicationService.getPublications(params).subscribe({
      next: (res) => {
        this.publications = [...this.publications, ...(res.data?.publications ?? [])];
        this.hasMore = this.page < (res.data?.pagination?.totalPages ?? 1);
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; }
    });
  }

  setFilter(value: string): void {
    if (this.activeFilter === value) return;
    this.activeFilter = value; this.load();
  }

  openLightbox(images: string[], index: number): void {
    this.lightboxImages = images; this.lightboxIndex = index; this.lightboxOpen = true;
  }
  closeLightbox(): void { this.lightboxOpen = false; }
  prevImage(): void { this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length; }
  nextImage(): void { this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length; }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  truncate(text: string, max = 160): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
  get featuredPub(): Publication | null { return this.publications[0] ?? null; }
  get restPubs(): Publication[]         { return this.publications.slice(1); }
}
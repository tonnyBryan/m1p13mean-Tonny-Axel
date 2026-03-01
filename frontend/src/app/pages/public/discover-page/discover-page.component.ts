import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PublicService } from '../../../shared/services/public.service';
import { UserStateService, CurrentUser } from '../../../shared/services/user-state.service';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { RedirectIntentService } from '../../../shared/services/redirect-intent.service';

interface PreviewProduct {
  _id: string;
  name: string;
  regularPrice: number;
  salePrice?: number;
  isSale: boolean;
  avgRating: number;
  totalRatings: number;
  category?: { name: string };
  images: string[];
}

interface PreviewBoutique {
  _id: string;
  name: string;
  logo: string;
  description: string;
  isLocal: boolean;
}

interface StorePreview {
  boutique: PreviewBoutique;
  products: PreviewProduct[];
}

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './discover-page.component.html',
  styleUrl: './discover-page.component.css',
})
export class DiscoverPageComponent implements OnInit, OnDestroy {

  // ── Auth state ────────────────────────────────
  currentUser: CurrentUser | null = null;
  isAuthLoading = true;   // true tant que le header n'a pas résolu l'auth

  // ── Data ──────────────────────────────────────
  stores: StorePreview[] = [];
  isInitialLoading = true;
  isLoadingMore = false;
  hasMore = false;
  total = 0;
  currentPage = 1;
  hasError = false;
  readonly skeletonItems = Array(6).fill(0);

  // ── Typing animation ──────────────────────────
  private readonly phrases = [
    'in store', 'near you', 'on sale',
    'trending now', 'new today', 'just arrived',
  ];
  typedText = '';
  cursorVisible = true;
  private phraseIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: any;
  private cursorTimer: any;
  private readonly TYPE_SPEED = 80;
  private readonly DELETE_SPEED = 40;
  private readonly PAUSE_AFTER_TYPE = 1800;
  private readonly PAUSE_BEFORE_TYPE = 300;

  private authSub!: Subscription;

  constructor(
      private publicService: PublicService,
      private userState: UserStateService,
      private router: Router,
      private redirectIntent: RedirectIntentService,
  ) {}

  ngOnInit(): void {
    this.startCursorBlink();
    this.typingTimer = setTimeout(() => this.tick(), 500);

    // Attendre la fin du chargement auth avant de décider
    this.authSub = this.userState.isLoading$.pipe(
        filter(loading => !loading),
        take(1)
    ).subscribe(() => {
      const user = this.userState.getUser();
      this.currentUser = user;
      this.isAuthLoading = false;

      // Redirect si rôle non autorisé sur discover
      if (user?.role === 'boutique') {
        this.router.navigate(['/store/app/dashboard']);
        return;
      }
      if (user?.role === 'admin') {
        this.router.navigate(['/admin/app/boutiques']);
        return;
      }

      // Non connecté ou role user → charger les stores
      this.loadStores();
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimer);
    clearInterval(this.cursorTimer);
    this.authSub?.unsubscribe();
  }

  // ── Routes dynamiques ─────────────────────────

  /** Lien vers une boutique (user connecté) */
  getStoreRoute(boutiqueId: string): string[] {
    return ['/v1/stores', boutiqueId];
  }

  /** Lien vers un produit (user connecté) */
  getProductRoute(boutiqueId: string, productId: string): string[] {
    return ['/v1/stores', boutiqueId, 'products', productId];
  }

  /** Non connecté clique "Visit store" → save intent + /signin */
  goToStoreSignin(boutiqueId: string, event: Event): void {
    event.preventDefault();
    this.redirectIntent.save('/v1/stores/' + boutiqueId);
    this.router.navigate(['/signin']);
  }

  /** Non connecté clique "Sign in to order" → save intent + /signin */
  goToProductSignin(boutiqueId: string, productId: string, event: Event): void {
    event.preventDefault();
    this.redirectIntent.save('/v1/stores/' + boutiqueId + '/products/' + productId);
    this.router.navigate(['/signin']);
  }

  /** Label + route du CTA principal en bas */
  getBottomCtaRoute(): string {
    return this.currentUser?.role === 'user' ? '/v1/maps' : '/signup';
  }

  /** Afficher le CTA "Ready to shop" seulement si non connecté */
  get showGuestCta(): boolean {
    return !this.currentUser;
  }

  /** Afficher le CTA "Explore map" seulement si connecté user */
  get showMapCta(): boolean {
    return this.currentUser?.role === 'user';
  }

  // ── Data loading ──────────────────────────────

  loadStores(): void {
    this.isInitialLoading = true;
    this.hasError = false;

    this.publicService.getStoresPreview(1).subscribe({
      next: (res) => {
        this.stores = res?.data?.data ?? [];
        this.hasMore = res?.data?.hasMore ?? false;
        this.total = res?.data?.total ?? 0;
        this.currentPage = 1;
        this.isInitialLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isInitialLoading = false;
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    const nextPage = this.currentPage + 1;

    this.publicService.getStoresPreview(nextPage).subscribe({
      next: (res) => {
        this.stores = [...this.stores, ...(res?.data?.data ?? [])];
        this.hasMore = res?.data?.hasMore ?? false;
        this.currentPage = nextPage;
        this.isLoadingMore = false;
      },
      error: () => { this.isLoadingMore = false; }
    });
  }

  // ── Typing ────────────────────────────────────

  private tick(): void {
    const current = this.phrases[this.phraseIndex];
    if (this.isDeleting) {
      this.typedText = current.substring(0, this.charIndex - 1);
      this.charIndex--;
      if (this.charIndex === 0) {
        this.isDeleting = false;
        this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
        this.typingTimer = setTimeout(() => this.tick(), this.PAUSE_BEFORE_TYPE);
        return;
      }
      this.typingTimer = setTimeout(() => this.tick(), this.DELETE_SPEED);
    } else {
      this.typedText = current.substring(0, this.charIndex + 1);
      this.charIndex++;
      if (this.charIndex === current.length) {
        this.isDeleting = true;
        this.typingTimer = setTimeout(() => this.tick(), this.PAUSE_AFTER_TYPE);
        return;
      }
      this.typingTimer = setTimeout(() => this.tick(), this.TYPE_SPEED);
    }
  }

  private startCursorBlink(): void {
    this.cursorTimer = setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
    }, 530);
  }

  // ── Helpers ───────────────────────────────────

  getProductImage(product: PreviewProduct): string {
    return product.images?.[0] ?? '';
  }

  getProductPrice(product: PreviewProduct): string {
    const price = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;
    return price.toLocaleString('fr-MG') + ' Ar';
  }

  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.round(rating)).fill(0);
  }

  getSalePercent(product: PreviewProduct): number {
    if (!product.isSale || !product.salePrice) return 0;
    return Math.round((product.regularPrice - product.salePrice) / product.regularPrice * 100);
  }
}
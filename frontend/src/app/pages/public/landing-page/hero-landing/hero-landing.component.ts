import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { NgForOf, NgIf } from "@angular/common";
import { AnimationObserverService } from "../../../../shared/services/animation-observer.service";
import { UserStateService, CurrentUser } from '../../../../shared/services/user-state.service';
import { RouterLink } from "@angular/router";
import { ProductService } from "../../../../shared/services/product.service";

interface HeroProduct {
  _id: string;
  name: string;
  regularPrice: number;
  salePrice?: number;
  isSale: boolean;
  images: string[];
}

@Component({
  selector: 'app-hero-landing',
  standalone: true,
  imports: [NgForOf, NgIf, RouterLink],
  templateUrl: './hero-landing.component.html',
  styleUrl: './hero-landing.component.css',
})
export class HeroLandingComponent implements OnInit, AfterViewInit, OnDestroy {

  currentUser: CurrentUser | null = null;
  isLoading = true;

  heroProductsLoading = true;
  heroProducts: HeroProduct[] = [];

  private fallbackProducts: HeroProduct[] = [
    {
      _id: 'fallback-1',
      name: 'Summer Dress',
      regularPrice: 89000,
      isSale: false,
      images: ['https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=600&auto=format&fit=crop']
    },
    {
      _id: 'fallback-2',
      name: 'Classic Watch',
      regularPrice: 349000,
      isSale: false,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop']
    }
  ];

  // ── Badge slide animation ─────────────────────
  private readonly badgePhrases = [
    'The all-in-one shopping mall platform',
    '500+ stores already on board',
    'New stores joining every day',
    'Browse freely · No account needed',
  ];

  badgeCurrentText = this.badgePhrases[0];
  badgeNextText = '';
  badgeAnimState: 'idle' | 'exit' | 'enter' = 'idle';

  private badgeIndex = 0;
  private badgeTimer: any;

  constructor(
      private animObs: AnimationObserverService,
      private userState: UserStateService,
      private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.userState.isLoading$.subscribe(loading => this.isLoading = loading);
    this.userState.currentUser$.subscribe(user => this.currentUser = user);
    this.loadHeroProducts();
    this.startBadgeAnimation();
  }

  ngAfterViewInit(): void {
    this.animObs.observe(document.querySelectorAll('.hero-reveal'));
  }

  ngOnDestroy(): void {
    clearTimeout(this.badgeTimer);
  }

  // ── Badge animation logic ─────────────────────

  private startBadgeAnimation(): void {
    this.badgeTimer = setTimeout(() => this.nextBadge(), 3000);
  }

  private nextBadge(): void {
    const next = (this.badgeIndex + 1) % this.badgePhrases.length;
    this.badgeNextText = this.badgePhrases[next];

    // 1. Lancer exit (current sort vers le haut)
    this.badgeAnimState = 'exit';

    setTimeout(() => {
      // 2. Swap le texte + lancer enter (next entre par le bas)
      this.badgeCurrentText = this.badgeNextText;
      this.badgeIndex = next;
      this.badgeAnimState = 'enter';

      setTimeout(() => {
        // 3. Revenir idle, programmer le prochain
        this.badgeAnimState = 'idle';
        this.badgeTimer = setTimeout(() => this.nextBadge(), 3000);
      }, 400); // durée de l'animation enter

    }, 350); // durée de l'animation exit
  }

  // ── Products ──────────────────────────────────

  private loadHeroProducts(): void {
    this.heroProductsLoading = true;
    this.productService.getHeroProducts().subscribe({
      next: (res) => {
        this.heroProducts = res?.data?.length === 2 ? res.data : this.fallbackProducts;
        this.heroProductsLoading = false;
      },
      error: () => {
        this.heroProducts = this.fallbackProducts;
        this.heroProductsLoading = false;
      }
    });
  }

  getProductImage(product: HeroProduct): string {
    return product.images?.[0]
        ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop';
  }

  getProductPrice(product: HeroProduct): string {
    const price = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;
    return price.toLocaleString('fr-MG') + ' Ar';
  }

  // ── Routes ────────────────────────────────────

  getCtaRoute(): string {
    const role = this.currentUser?.role;
    if (role === 'user') return '/v1/stores';
    if (role === 'boutique') return '/store/app/dashboard';
    if (role === 'admin') return '/admin/app/boutiques';
    return '/signup';
  }

  getCtaLabel(): string {
    const role = this.currentUser?.role;
    if (role === 'user') return 'Go to MarketPlace';
    if (role === 'boutique') return 'Go to Dashboard';
    if (role === 'admin') return 'Go to Dashboard';
    return "Get Started — it's free";
  }

  getDiscoverRoute(): string | null {
    if (!this.currentUser) return '/discover';
    if (this.currentUser.role === 'user') return '/v1/stores';
    return null;
  }

  getDiscoverLabel(): string {
    if (!this.currentUser) return 'Explore our stores';
    return 'Browse MarketPlace';
  }
}
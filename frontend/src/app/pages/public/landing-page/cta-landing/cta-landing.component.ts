import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnimationObserverService } from '../../../../shared/services/animation-observer.service';
import { UserStateService, CurrentUser } from '../../../../shared/services/user-state.service';

@Component({
  selector: 'app-cta-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cta-landing.component.html',
})
export class CtaLandingComponent implements OnInit, AfterViewInit {

  currentUser: CurrentUser | null = null;
  isLoading = true;

  constructor(
      private animObs: AnimationObserverService,
      private userState: UserStateService,
  ) {}

  ngOnInit(): void {
    this.userState.isLoading$.subscribe(loading => {
      this.isLoading = loading;
      if (!loading) {
        setTimeout(() => {
          this.animObs.observe(document.querySelectorAll('.cta-reveal'));
        }, 50);
      }
    });

    this.userState.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngAfterViewInit(): void {
    this.animObs.observe(document.querySelectorAll('.cta-reveal'));
  }

  getInitials(): string {
    if (!this.currentUser?.name) return '?';
    return this.currentUser.name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
  }

  getQuickLinks(): { label: string; route: string; icon: string; color: string }[] {
    const role = this.currentUser?.role;
    if (role === 'user') return [
      { label: 'MarketPlace', route: '/v1/stores', color: 'brand',
        icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
      { label: 'My Orders', route: '/v1/orders', color: 'purple',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { label: 'My Profile', route: '/v1/profile', color: 'emerald',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ];
    if (role === 'boutique') return [
      { label: 'Dashboard', route: '/store/app/dashboard', color: 'brand',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { label: 'My Store', route: '/store/app/profile', color: 'emerald',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { label: 'Orders', route: '/store/app/orders', color: 'purple',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    ];
    if (role === 'admin') return [
      { label: 'Dashboard', route: '/admin/app/dashboard', color: 'brand',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ];
    return [];
  }

  customerPerks = [
    'Browse hundreds of local stores',
    'Track orders in real time',
    'Wishlist & reviews included',
  ];

  storePerks = [
    'Full product catalog management',
    'Custom delivery configuration',
    'Order dashboard & notifications',
  ];
}
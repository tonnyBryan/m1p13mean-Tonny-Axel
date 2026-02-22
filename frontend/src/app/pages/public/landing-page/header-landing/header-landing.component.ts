import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from "../../../../shared/services/auth.service";
import { UserService } from "../../../../shared/services/user.service";
import { UserStateService } from "../../../../shared/services/user-state.service";
import {environment} from "../../../../../environments/environment";
import {LogoutService} from "../../../../shared/services/logout.service";

interface HeaderUser {
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

@Component({
  selector: 'app-header-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-landing.component.html',
})
export class HeaderLandingComponent implements OnInit {
  appName: string = environment.plateformeName;

  mobileMenuOpen = false;
  isOnLandingPage = false;
  currentUser: HeaderUser | null = null;
  userMenuOpen = false;
  isLoadingUser = false;

  constructor(
      private router: Router,
      private authService: AuthService,
      private userService: UserService,
      private userState: UserStateService,
      private logoutService: LogoutService
  ) {
    this.router.events.subscribe(() => {
      this.isOnLandingPage = this.router.url === '/' || this.router.url === '/home';
      this.mobileMenuOpen = false;
      this.userMenuOpen = false;
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.userState.setLoading(false);
      return;
    }

    this.isLoadingUser = true;
    this.userState.setLoading(true);

    // 1. Vérifier le token côté serveur
    this.authService.verifyToken().subscribe({
      next: (res) => {
        if (!res.success) {
          this.authService.logout();
          this.isLoadingUser = false;
          this.userState.setLoading(false);
          return;
        }
        // 2. Token valide → récupérer les infos
        this.userService.getMyInfo().subscribe({
          next: (infoRes) => {
            if (infoRes.success && infoRes.data) {
              this.currentUser = infoRes.data;
              this.userState.setUser(infoRes.data);
            }
            this.isLoadingUser = false;
            this.userState.setLoading(false);
          },
          error: () => {
            this.isLoadingUser = false;
            this.userState.setLoading(false);
          }
        });
      },
      error: () => {
        this.authService.logout();
        this.isLoadingUser = false;
        this.userState.setLoading(false);
      }
    });
  }

  getMenuItems(): { label: string; route: string; icon: string }[] {
    const role = this.currentUser?.role;

    if (role === 'user') return [
      { label: 'MarketPlace', route: '/v1/stores', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
      { label: 'My Profile', route: '/v1/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ];

    if (role === 'boutique') return [
      { label: 'Dashboard', route: '/store/app/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { label: 'My Store', route: '/store/app/profile', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    ];

    if (role === 'admin') return [
      { label: 'Dashboard', route: '/admin/app/boutiques', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ];

    return [];
  }

  navigateTo(item: { route: string }): void {
    this.userMenuOpen = false;
    this.mobileMenuOpen = false;
    this.router.navigate([item.route]);
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

  getRoleBadge(): string {
    const role = this.currentUser?.role;
    if (role === 'boutique') return 'Store Owner';
    if (role === 'admin') return 'Admin';
    return 'Customer';
  }

  onLogout(): void {
    this.userMenuOpen = false;
    this.logoutService.show();
    setTimeout(() => {
      this.authService.logout();
      this.currentUser = null;
      this.logoutService.hide();
      this.router.navigate(['/']);
    }, 3000);
  }

  scrollToFeatures(event: Event): void {
    event.preventDefault();
    if (this.isOnLandingPage) {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      });
    }
    this.mobileMenuOpen = false;
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
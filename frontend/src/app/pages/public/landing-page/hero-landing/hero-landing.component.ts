import {Component, AfterViewInit, OnInit} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import { AnimationObserverService } from "../../../../shared/services/animation-observer.service";
import { UserStateService, CurrentUser } from '../../../../shared/services/user-state.service';
import {RouterLink} from "@angular/router";


@Component({
  selector: 'app-hero-landing',
  standalone: true,
  imports: [NgForOf, NgIf, RouterLink],
  templateUrl: './hero-landing.component.html',
  styleUrl: './hero-landing.component.css',
})
export class HeroLandingComponent implements OnInit, AfterViewInit {

  currentUser: CurrentUser | null = null;
  isLoading = true;

  constructor(
      private animObs: AnimationObserverService,
      private userState: UserStateService,
  ) {}

  ngOnInit(): void {
    this.userState.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
    this.userState.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngAfterViewInit(): void {
    this.animObs.observe(document.querySelectorAll('.hero-reveal'));
  }

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
}
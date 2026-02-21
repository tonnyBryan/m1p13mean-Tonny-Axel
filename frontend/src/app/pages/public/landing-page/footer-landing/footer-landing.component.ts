import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { SubscriptionService } from '../../../../shared/services/subscription.service';

@Component({
  selector: 'app-footer-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './footer-landing.component.html',
})
export class FooterLandingComponent {

  constructor(
      private router: Router,
      private subscriptionService: SubscriptionService,
  ) {}

  appName: string = environment.plateformeName;
  currentYear = new Date().getFullYear();
  newsletterEmail = '';
  newsletterSubmitted = false;
  newsletterError = '';
  isSubmitting = false;

  developers = [
    { num: 'ETU002768', name: 'ANDERSON Tonny Bryan' },
    { num: 'ETU002442', name: 'MAMIRAZANA Isis Axel' },
  ];

  scrollToSection(sectionId: string): void {
    const isOnLanding = this.router.url === '/' || this.router.url === '/home'
        || this.router.url.startsWith('/#') || this.router.url.startsWith('/home#');

    if (isOnLanding) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/home'], { fragment: sectionId });
    }
  }

  onNewsletterSubmit(): void {
    if (!this.newsletterEmail || this.isSubmitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newsletterEmail)) {
      this.newsletterError = 'Please enter a valid email address.';
      return;
    }

    this.isSubmitting = true;
    this.newsletterError = '';

    this.subscriptionService.subscribe(this.newsletterEmail).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.newsletterSubmitted = true;
          this.newsletterEmail = '';
          setTimeout(() => this.newsletterSubmitted = false, 10000);
        } else {
          this.newsletterError = res.message ?? 'Something went wrong. Please try again.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.newsletterError = err?.error?.message ?? 'Something went wrong. Please try again.';
      }
    });
  }
}
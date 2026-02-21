import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './footer-landing.component.html',
})
export class FooterLandingComponent {
  currentYear = new Date().getFullYear();
  newsletterEmail = '';
  newsletterSubmitted = false;

  developers = [
    { num: 'ETU002768', name: 'ANDERSON Tonny Bryan' },
    { num: 'ETU002442', name: 'MAMIRAZANA Isis Axel' },
  ];

  onNewsletterSubmit(): void {
    if (!this.newsletterEmail) return;
    this.newsletterSubmitted = true;
    this.newsletterEmail = '';
    setTimeout(() => this.newsletterSubmitted = false, 4000);
  }
}
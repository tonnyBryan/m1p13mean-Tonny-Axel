import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-terms-page',
  standalone: true,
    imports: [CommonModule],
  templateUrl: './terms-page.component.html',
})
export class TermsPageComponent {
  appName: string = environment.plateformeName;
  appMail: string = environment.plateformeEmail;

  lastUpdated = 'February 20, 2026';
  activeSection = 'acceptance';

  scrollTo(event: Event, sectionId: string): void {
    event.preventDefault();
    const el = document.getElementById(sectionId);
    if (!el) return;
    const offset = 90;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    this.activeSection = sectionId;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    for (const section of [...this.sections].reverse()) {
      const el = document.getElementById(section.id);
      if (el && el.getBoundingClientRect().top <= 120) {
        this.activeSection = section.id;
        break;
      }
    }
  }

  sections = [
    { id: 'acceptance',   label: 'Acceptance of Terms' },
    { id: 'accounts',     label: 'User Accounts' },
    { id: 'customers',    label: 'Customer Obligations' },
    { id: 'stores',       label: 'Store Owner Obligations' },
    { id: 'prohibited',   label: 'Prohibited Conduct' },
    { id: 'ip',           label: 'Intellectual Property' },
    { id: 'liability',    label: 'Limitation of Liability' },
    { id: 'termination',  label: 'Termination' },
    { id: 'law',          label: 'Governing Law' },
  ];

  accountItems = [
    'Providing accurate and truthful registration information',
    'Keeping your password secure and confidential',
    'Notifying us immediately of any unauthorized account access',
    'All activity that occurs under your account',
  ];

  customerItems = [
    'Provide accurate delivery information',
    'Honor orders you place with stores',
    'Leave honest and respectful reviews',
    'Not abuse refund or return processes',
    'Treat store owners respectfully',
    'Not place fraudulent orders',
  ];

  storeItems = [
    'Provide accurate and truthful product descriptions, images, and pricing',
    'Fulfill orders you accept in a timely and professional manner',
    'Comply with all applicable laws and regulations regarding your products',
    'Not list counterfeit, illegal, or prohibited items',
    'Handle customer data received through orders with care and confidentiality',
    'Maintain accurate stock levels to avoid unfulfillable orders',
  ];

  prohibitedItems = [
    'Impersonating another person or entity',
    'Using the platform for fraudulent or illegal activities',
    'Attempting to hack, scrape, or disrupt platform services',
    'Posting false, misleading, or defamatory content',
    'Harassing or abusing other users or store owners',
    'Creating multiple accounts to abuse promotions or reviews',
  ];

  prohibitedItems2 = [
    'Selling counterfeit or illegal products',
    'Manipulating ratings or reviews',
  ];
}
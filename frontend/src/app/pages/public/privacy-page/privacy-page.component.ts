import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-privacy-page',
  standalone: true,
    imports: [CommonModule],
  templateUrl: './privacy-page.component.html',
})
export class PrivacyPageComponent {
  appName: string = environment.plateformeName;
  appMail: string = environment.plateformeEmail;

  lastUpdated = 'February 20, 2026';
  activeSection = 'collect';


  scrollTo(event: Event, sectionId: string): void {
    event.preventDefault();
    const el = document.getElementById(sectionId);
    if (!el) return;
    const offset = 90; // hauteur header (64px) + marge confortable
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
    { id: 'collect',  label: 'Information We Collect' },
    { id: 'use',      label: 'How We Use It' },
    { id: 'sharing',  label: 'Sharing Your Data' },
    { id: 'cookies',  label: 'Cookies' },
    { id: 'security', label: 'Data Security' },
    { id: 'rights',   label: 'Your Rights' },
    { id: 'changes',  label: 'Changes to Policy' },
  ];

  collectItems = [
    'Full name, email address and password',
    'Delivery address and contact details',
    'Order history and transaction data',
    'Profile photo and preferences',
    'Messages sent to stores or support',
  ];

  useItems = [
    'Create and manage your account',
    'Process and fulfill your orders',
    'Send order confirmations and updates',
    'Improve platform features and performance',
    'Provide customer support',
    'Send relevant notifications',
    'Detect and prevent fraud',
    'Comply with legal obligations',
  ];

  shareItems = [
    'With stores you order from — to fulfill your orders and arrange delivery.',
    'With service providers — who assist us in operating our platform under strict confidentiality agreements.',
    'When required by law — such as in response to a court order or legal process.',
    'With your consent — for any other purpose with your explicit agreement.',
  ];

  rights = [
    'Access your personal data',
    'Correct inaccurate data',
    'Request deletion of your data',
    'Object to data processing',
    'Export your data (portability)',
    'Withdraw consent at any time',
  ];
}
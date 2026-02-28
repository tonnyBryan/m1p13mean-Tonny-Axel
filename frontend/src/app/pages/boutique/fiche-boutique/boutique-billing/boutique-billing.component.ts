import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boutique-billing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boutique-billing.component.html',
})
export class BoutiqueBillingComponent {
  @Input() boutique: any = null;

  /**
   * Mask card number: show only last 4 digits
   * "4111 1111 1111 1111" → "•••• •••• •••• 1111"
   */
  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const cleaned = cardNumber.replace(/\s/g, '');
    const last4 = cleaned.slice(-4);
    const masked = cleaned.slice(0, -4).replace(/\d/g, '•');
    // reformat with spaces every 4 chars
    const full = masked + last4;
    return full.match(/.{1,4}/g)?.join(' ') || full;
  }

  /**
   * Extract billing day from startDate (day of month)
   * e.g. "2026-02-28T11:03:14.953Z" → 28
   */
  getBillingDay(startDate: string): number {
    if (!startDate) return 0;
    return new Date(startDate).getDate();
  }

  /**
   * English ordinal suffix: 1st, 2nd, 3rd, 28th …
   */
  getBillingDaySuffix(startDate: string): string {
    const day = this.getBillingDay(startDate);
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  /**
   * Compute next billing date from startDate.
   * Takes the billing day (e.g. 29) and finds the next occurrence from today.
   * If that day doesn't exist in a month (e.g. Feb 30), uses the last day of month.
   */
  getNextBillingDate(startDate: string): string {
    if (!startDate) return '—';
    const billingDay = new Date(startDate).getDate();
    const now = new Date();

    // Try this month first
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-indexed

    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

    // If we're past billing day this month, move to next month
    const effectiveDayThisMonth = Math.min(billingDay, daysInMonth(year, month));
    const candidateThisMonth = new Date(year, month, effectiveDayThisMonth);

    let next: Date;
    if (candidateThisMonth > now) {
      next = candidateThisMonth;
    } else {
      // Move to next month
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      const effectiveDay = Math.min(billingDay, daysInMonth(year, month));
      next = new Date(year, month, effectiveDay);
    }

    return next.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
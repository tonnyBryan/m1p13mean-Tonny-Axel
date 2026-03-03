import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaiementAbonnementService } from '../../../../shared/services/paiement-abonnement.service';

@Component({
  selector: 'app-boutique-billing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boutique-billing.component.html',
})
export class BoutiqueBillingComponent implements OnChanges {
  @Input() boutique: any = null;
  payments: any[] = [];
  paymentsLoading = false;

  constructor(private paiementService: PaiementAbonnementService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['boutique'] && this.boutique?._id) {
      this.loadPayments();
    }
  }

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

  formatShortDate(dateString: string): string {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  }

  private daysInMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  private withAnchorDay(year: number, monthIndex: number, anchorDay: number, timeRef: Date): Date {
    const day = Math.min(anchorDay, this.daysInMonth(year, monthIndex));
    const d = new Date(year, monthIndex, day);
    d.setHours(timeRef.getHours(), timeRef.getMinutes(), timeRef.getSeconds(), timeRef.getMilliseconds());
    return d;
  }

  private addMonthsWithAnchor(date: Date, monthsToAdd: number, anchorDay: number, timeRef: Date): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    return this.withAnchorDay(year, month + monthsToAdd, anchorDay, timeRef);
  }

  private getCurrentPeriod(startDate: Date, refDate: Date): { periodStart: Date; periodEnd: Date } | null {
    if (!startDate || refDate < startDate) return null;

    const anchorDay = startDate.getDate();
    const monthsDiff =
      (refDate.getFullYear() - startDate.getFullYear()) * 12 +
      (refDate.getMonth() - startDate.getMonth());

    let periodStart = this.withAnchorDay(
      startDate.getFullYear(),
      startDate.getMonth() + monthsDiff,
      anchorDay,
      startDate
    );

    if (refDate < periodStart) {
      periodStart = this.withAnchorDay(
        startDate.getFullYear(),
        startDate.getMonth() + monthsDiff - 1,
        anchorDay,
        startDate
      );
    }

    const periodEnd = this.addMonthsWithAnchor(periodStart, 1, anchorDay, startDate);
    return { periodStart, periodEnd };
  }

  getCurrentPeriodLabel(): string {
    const startDateRaw = this.boutique?.plan?.startDate;
    if (!startDateRaw) return '';
    const startDate = new Date(startDateRaw);
    const now = new Date();
    const period = this.getCurrentPeriod(startDate, now);
    if (!period) return '';
    return `${this.formatShortDate(period.periodStart.toISOString())} — ${this.formatShortDate(period.periodEnd.toISOString())}`;
  }

  isCurrentPeriodPaid(): boolean {
    const startDateRaw = this.boutique?.plan?.startDate;
    if (!startDateRaw) return true;
    const startDate = new Date(startDateRaw);
    const now = new Date();
    const period = this.getCurrentPeriod(startDate, now);
    if (!period) return true;

    return this.payments.some(p => {
      const pStart = new Date(p.periodStart);
      const pEnd = new Date(p.periodEnd);
      return pStart <= period.periodStart && pEnd >= period.periodEnd;
    });
  }

  loadPayments(): void {
    if (!this.boutique?._id) return;
    this.paymentsLoading = true;
    this.paiementService.getPaymentsByBoutique(this.boutique._id, {
      sort: '-periodStart,-paidAt',
      limit: 20
    }).subscribe({
      next: (res: any) => {
        const items = res?.data?.items || res?.data || [];
        this.payments = Array.isArray(items) ? items : [];
        this.paymentsLoading = false;
      },
      error: () => {
        this.payments = [];
        this.paymentsLoading = false;
      }
    });
  }

  get totalPaid(): number {
    return this.payments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  }
}

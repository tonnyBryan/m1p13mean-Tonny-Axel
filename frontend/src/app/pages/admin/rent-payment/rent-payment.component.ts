import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { PaiementAbonnementService } from '../../../shared/services/paiement-abonnement.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-rent-payment',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './rent-payment.component.html',
    styleUrl: './rent-payment.component.css'
})
export class RentPaymentComponent implements OnInit {
    // Autocomplete
    searchSubject = new Subject<string>();
    searchResults: any[] = [];
    showResults = false;
    isSearching = false;

    selectedBoutique: any | null = null;
    isRunning = false;

    // Payment form
    amount: number | null = null;
    method = '';
    paidAt = new Date().toISOString().split('T')[0];

    isSaving = false;
    payments: any[] = [];
    paymentsLoading = false;
    currentPeriodLabel = '';
    isCurrentPaid = false;

    constructor(
        private boutiqueService: BoutiqueService,
        private paiementService: PaiementAbonnementService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.searchResults = [];
                    this.showResults = false;
                    return of(null);
                }
                this.isSearching = true;
                return this.boutiqueService.getBoutiques({
                    'name[regex]': term.trim(),
                    'name[options]': 'i',
                    limit: 10,
                    sort: 'name'
                });
            })
        ).subscribe({
            next: (res: any) => {
                if (res === null) {
                    this.isSearching = false;
                    return;
                }
                this.searchResults = res?.data?.items || res?.data || [];
                this.showResults = this.searchResults.length > 0;
                this.isSearching = false;
            },
            error: () => {
                this.searchResults = [];
                this.showResults = false;
                this.isSearching = false;
            }
        });
    }

    onSearch(event: any): void {
        this.searchSubject.next(event.target.value);
    }

    selectBoutique(boutique: any): void {
        this.selectedBoutique = boutique;
        this.showResults = false;
        this.searchResults = [];

        this.isRunning = !!(
            boutique?.isActive &&
            boutique?.isValidated &&
            boutique?.plan?.startDate
        );

        if (this.isRunning) {
            const price = Number(boutique?.plan?.priceToPayPerMonth || 0);
            this.amount = Number.isFinite(price) ? price : 0;
        } else {
            this.amount = null;
        }

        this.loadPayments();
    }

    clearSelection(): void {
        this.selectedBoutique = null;
        this.isRunning = false;
        this.amount = null;
        this.method = '';
        this.payments = [];
        this.currentPeriodLabel = '';
        this.isCurrentPaid = false;
    }

    pay(): void {
        if (!this.selectedBoutique?._id) {
            this.toast.error('Error', 'Please select a boutique first.', 0);
            return;
        }
        if (!this.isRunning) {
            this.toast.error('Error', 'This boutique is not running. Payment cannot be registered.', 0);
            return;
        }
        const amountValue = Number(this.amount);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
            this.toast.error('Error', 'Please enter a valid amount.', 0);
            return;
        }

        this.isSaving = true;
        this.paiementService.paySubscription({
            boutiqueId: this.selectedBoutique._id,
            amount: amountValue,
            method: this.method || undefined,
            paidAt: this.paidAt || undefined
        }).subscribe({
            next: (res) => {
                if (res?.success) {
                    this.toast.success('Success', 'Payment recorded successfully.');
                    this.loadPayments();
                } else {
                    this.toast.error('Error', res?.message || 'Failed to record payment.', 0);
                }
                this.isSaving = false;
            },
            error: (err) => {
                this.toast.error('Error', err?.error?.message || 'Failed to record payment.', 0);
                this.isSaving = false;
            }
        });
    }

    loadPayments(): void {
        if (!this.selectedBoutique?._id) return;
        this.paymentsLoading = true;
        this.paiementService.getPaymentsByBoutique(this.selectedBoutique._id, {
            sort: '-periodStart,-paidAt',
            limit: 10
        }).subscribe({
            next: (res) => {
                const items = res?.data?.items || res?.data || [];
                this.payments = Array.isArray(items) ? items : [];
                this.computeCurrentPeriodStatus();
                this.paymentsLoading = false;
            },
            error: () => {
                this.payments = [];
                this.currentPeriodLabel = '';
                this.isCurrentPaid = false;
                this.paymentsLoading = false;
            }
        });
    }

    formatDate(date: string | Date): string {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(date));
    }

    formatDateTime(date: string | Date): string {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
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

    private computeCurrentPeriodStatus(): void {
        const startDateRaw = this.selectedBoutique?.plan?.startDate;
        if (!startDateRaw) {
            this.currentPeriodLabel = '';
            this.isCurrentPaid = false;
            return;
        }
        const startDate = new Date(startDateRaw);
        const now = new Date();
        const period = this.getCurrentPeriod(startDate, now);
        if (!period) {
            this.currentPeriodLabel = '';
            this.isCurrentPaid = false;
            return;
        }

        this.currentPeriodLabel = `${this.formatDate(period.periodStart)} — ${this.formatDate(period.periodEnd)}`;
        this.isCurrentPaid = this.payments.some(p => {
            const pStart = new Date(p.periodStart);
            const pEnd = new Date(p.periodEnd);
            return pStart <= period.periodStart && pEnd >= period.periodEnd;
        });
    }

    get isFormValid(): boolean {
        const amountValue = Number(this.amount);
        return !!(
            this.selectedBoutique &&
            this.isRunning &&
            Number.isFinite(amountValue) &&
            amountValue > 0 &&
            this.method &&
            this.paidAt &&
            !this.isCurrentPaid
        );
    }
}

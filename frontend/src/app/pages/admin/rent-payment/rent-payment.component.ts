import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { PaiementAbonnementService } from '../../../shared/services/paiement-abonnement.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-rent-payment',
    standalone: true,
    imports: [CommonModule, FormsModule],
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

    constructor(
        private boutiqueService: BoutiqueService,
        private paiementService: PaiementAbonnementService,
        private toast: ToastService
    ) {}

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
                    this.toast.success('Success', 'Payment recorded successfully.', 0);
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
                this.paymentsLoading = false;
            },
            error: () => {
                this.payments = [];
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

    get isFormValid(): boolean {
        const amountValue = Number(this.amount);
        return !!(
            this.selectedBoutique &&
            this.isRunning &&
            Number.isFinite(amountValue) &&
            amountValue > 0 &&
            this.method &&
            this.paidAt
        );
    }
}

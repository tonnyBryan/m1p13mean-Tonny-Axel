import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from "../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Boutique } from "../../../../core/models/boutique.model";
import { BoutiqueService } from '../../../../shared/services/boutique.service';
import { AlertComponent } from "../../../../shared/components/ui/alert/alert.component";
import { ToastService } from '../../../../shared/services/toast.service';
import { PaiementAbonnementService } from '../../../../shared/services/paiement-abonnement.service';

@Component({
    selector: 'app-boutique-detail',
    standalone: true,
    imports: [
        CommonModule,
        PageBreadcrumbComponent,
        AlertComponent
        // ModalComponent retiré
    ],
    templateUrl: './boutique-detail.component.html',
    styleUrls: ['./boutique-detail.component.css']
})
export class BoutiqueDetailComponent implements OnInit {
    pageTitle = 'Shop Details';
    boutique: Boutique | null = null;
    isLoading = false;
    isUpdating = false;
    isValidating = false;
    boutiqueId: string | null = null;
    payments: any[] = [];
    paymentsLoading = false;

    // Alert states
    showSuccessAlert = false;
    showErrorAlert = false;
    isSuccessFadingOut = false;
    isErrorFadingOut = false;
    alertMessage = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private boutiqueService: BoutiqueService,
        private toast: ToastService,
        private paiementService: PaiementAbonnementService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id && id !== this.boutiqueId) {
                this.boutiqueId = id;
                this.loadBoutique();
            }
        });
    }

    loadBoutique(): void {
        if (!this.boutiqueId) return;
        this.isLoading = true;
        this.boutiqueService.getBoutiqueById(this.boutiqueId).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res.success) {
                    this.boutique = res.data;
                    this.loadPayments();
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.alertMessage = 'Error loading boutique details';
                this.showErrorAlert = true;
                setTimeout(() => {
                    this.isErrorFadingOut = true;
                    setTimeout(() => {
                        this.showErrorAlert = false;
                        this.isErrorFadingOut = false;
                        this.goBack();
                    }, 300);
                }, 2000);
            }
        });
    }

    toggleActiveStatus(): void {
        if (!this.boutique || !this.boutiqueId || this.isUpdating) return;

        const willActivate = !this.boutique.isActive;

        this.toast.confirm(
            willActivate ? 'Activate Shop' : 'Deactivate Shop',
            willActivate
                ? 'This shop will become visible and accessible to users.'
                : 'This shop will no longer be visible to users.',
            () => this.executeStatusChange(willActivate),
            () => {},
            {
                confirmLabel: willActivate ? 'Activate' : 'Deactivate',
                cancelLabel: 'Cancel',
                variant: willActivate ? 'success' : 'danger',
                position: 'top-center',
                backdrop: true,
            }
        );
    }

    private executeStatusChange(newStatus: boolean): void {
        if (!this.boutiqueId) return;
        this.isUpdating = true;
        this.boutiqueService.updateBoutiqueStatus(this.boutiqueId, newStatus).subscribe({
            next: (res: any) => {
                this.isUpdating = false;
                if (res.success) {
                    this.boutique = res.data;
                    this.alertMessage = `Shop ${newStatus ? 'activated' : 'deactivated'} successfully!`;
                    this.showSuccessAlert = true;
                    this.isSuccessFadingOut = false;
                    setTimeout(() => {
                        this.isSuccessFadingOut = true;
                        setTimeout(() => { this.showSuccessAlert = false; this.isSuccessFadingOut = false; }, 300);
                    }, 5000);
                }
            },
            error: (err: any) => {
                this.isUpdating = false;
                this.alertMessage = 'Error updating shop status. Please try again.';
                this.showErrorAlert = true;
                this.isErrorFadingOut = false;
                setTimeout(() => {
                    this.isErrorFadingOut = true;
                    setTimeout(() => { this.showErrorAlert = false; this.isErrorFadingOut = false; }, 300);
                }, 5000);
            }
        });
    }

    validateBoutique(): void {
        if (!this.boutique || !this.boutiqueId || this.isValidating || this.boutique.isValidated) return;

        this.toast.confirm(
            'Validate Shop',
            'This will validate the shop and start its plan billing immediately.',
            () => this.executeValidation(),
            () => {},
            {
                confirmLabel: 'Validate',
                cancelLabel: 'Cancel',
                variant: 'success',
                position: 'top-center',
                backdrop: true,
            }
        );
    }

    private executeValidation(): void {
        if (!this.boutiqueId) return;
        this.isValidating = true;
        this.boutiqueService.validateBoutique(this.boutiqueId).subscribe({
            next: (res: any) => {
                this.isValidating = false;
                if (res.success) {
                    this.boutique = res.data;
                    this.alertMessage = 'Shop validated successfully!';
                    this.showSuccessAlert = true;
                    this.isSuccessFadingOut = false;
                    setTimeout(() => {
                        this.isSuccessFadingOut = true;
                        setTimeout(() => { this.showSuccessAlert = false; this.isSuccessFadingOut = false; }, 300);
                    }, 5000);
                }
            },
            error: () => {
                this.isValidating = false;
                this.alertMessage = 'Error validating shop. Please try again.';
                this.showErrorAlert = true;
                this.isErrorFadingOut = false;
                setTimeout(() => {
                    this.isErrorFadingOut = true;
                    setTimeout(() => { this.showErrorAlert = false; this.isErrorFadingOut = false; }, 300);
                }, 5000);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/app/boutiques']);
    }

    formatDate(date: Date | string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    formatShortDate(date: Date | string): string {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(date));
    }

    getStatusBgColor(isActive: boolean, isValidated: boolean): string {
        if (!isActive) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        if (!isValidated) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }

    getStatusText(isActive: boolean, isValidated: boolean): string {
        if (!isActive) return 'Inactive';
        if (!isValidated) return 'Pending Validation';
        return 'Active';
    }

    isRunning(): boolean {
        return !!(this.boutique?.isActive && this.boutique?.isValidated);
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
        return `${this.formatShortDate(period.periodStart)} — ${this.formatShortDate(period.periodEnd)}`;
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
        if (!this.boutiqueId) return;
        this.paymentsLoading = true;
        this.paiementService.getPaymentsByBoutique(this.boutiqueId, {
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

    getBillingDay(startDate?: string | null): number {
        if (!startDate) return 0;
        return new Date(startDate).getDate();
    }

    getBillingDaySuffix(startDate?: string | null): string {
        const day = this.getBillingDay(startDate || null);
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    maskCardNumber(cardNumber?: string | null): string {
        if (!cardNumber) return '•••• •••• •••• ••••';
        const cleaned = cardNumber.replace(/\s/g, '');
        const last4 = cleaned.slice(-4);
        const masked = cleaned.slice(0, -4).replace(/\d/g, '•');
        const full = masked + last4;
        return full.match(/.{1,4}/g)?.join(' ') || full;
    }
}

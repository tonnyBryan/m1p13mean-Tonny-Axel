import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from "../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Boutique } from "../../../../core/models/boutique.model";
import { BoutiqueService } from '../../../../shared/services/boutique.service';
import { AlertComponent } from "../../../../shared/components/ui/alert/alert.component";
import { ToastService } from '../../../../shared/services/toast.service';

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
        private toast: ToastService
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
                if (res.success) this.boutique = res.data;
                console.log(this.boutique);
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

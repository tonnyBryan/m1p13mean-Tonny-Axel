import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from "../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Boutique } from "../../../../core/models/boutique.model";
import { BoutiqueService } from '../../../../shared/services/boutique.service';
import { ModalComponent } from "../../../../shared/components/ui/modal/modal.component";
import { AlertComponent } from "../../../../shared/components/ui/alert/alert.component";

@Component({
    selector: 'app-boutique-detail',
    standalone: true,
    imports: [
        CommonModule,
        PageBreadcrumbComponent,
        ModalComponent,
        AlertComponent
    ],
    templateUrl: './boutique-detail.component.html',
    styleUrls: ['./boutique-detail.component.css']
})
export class BoutiqueDetailComponent implements OnInit {
    pageTitle = 'Shop Details';
    boutique: Boutique | null = null;
    isLoading = false;
    isUpdating = false;
    boutiqueId: string | null = null;

    // Modal states
    showConfirmModal = false;
    confirmAction: 'activate' | 'deactivate' | null = null;

    // Alert states
    showSuccessAlert = false;
    showErrorAlert = false;
    isSuccessFadingOut = false;
    isErrorFadingOut = false;
    alertMessage = '';


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private boutiqueService: BoutiqueService
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
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                console.error('Error loading boutique:', err);
                this.alertMessage = 'Error loading boutique details';
                this.showErrorAlert = true;
                this.isErrorFadingOut = false;
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

        this.confirmAction = this.boutique.isActive ? 'deactivate' : 'activate';
        this.showConfirmModal = true;
    }

    confirmStatusChange(): void {
        if (!this.boutique || !this.boutiqueId || !this.confirmAction) return;

        const newStatus = this.confirmAction === 'activate';
        this.showConfirmModal = false;

        this.isUpdating = true;
        this.boutiqueService.updateBoutiqueStatus(this.boutiqueId, newStatus).subscribe({
            next: (res: any) => {
                this.isUpdating = false;
                if (res.success) {
                    this.boutique = res.data;
                    this.alertMessage = `Boutique ${newStatus ? 'activated' : 'deactivated'} successfully!`;
                    this.showSuccessAlert = true;
                    this.isSuccessFadingOut = false;
                    setTimeout(() => {
                        this.isSuccessFadingOut = true;
                        setTimeout(() => {
                            this.showSuccessAlert = false;
                            this.isSuccessFadingOut = false;
                        }, 300);
                    }, 5000);
                }
            },
            error: (err: any) => {
                this.isUpdating = false;
                console.error('Error updating boutique status:', err);
                this.alertMessage = 'Error updating boutique status. Please try again.';
                this.showErrorAlert = true;
                this.isErrorFadingOut = false;
                setTimeout(() => {
                    this.isErrorFadingOut = true;
                    setTimeout(() => {
                        this.showErrorAlert = false;
                        this.isErrorFadingOut = false;
                    }, 300);
                }, 5000);
            }
        });
    }

    cancelStatusChange(): void {
        this.showConfirmModal = false;
        this.confirmAction = null;
    }

    goBack(): void {
        this.router.navigate(['/admin/app/boutiques']);
    }

    formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { AuthService } from '../../../shared/services/auth.service';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { FicheBoutiqueSkeletonComponent } from './fiche-boutique-skeleton/fiche-boutique-skeleton.component';
import { BoutiqueCategoriesComponent } from './boutique-categories/boutique-categories.component';
import { BoutiqueGeneralInfoComponent } from './boutique-general-info/boutique-general-info.component';
import { BoutiqueDeliveryConfigComponent } from './boutique-delivery-config/boutique-delivery-config.component';
import { BoutiqueBillingComponent } from './boutique-billing/boutique-billing.component';

@Component({
    selector: 'app-fiche-boutique',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonComponent,
        FicheBoutiqueSkeletonComponent,
        BoutiqueCategoriesComponent,
        BoutiqueGeneralInfoComponent,
        BoutiqueDeliveryConfigComponent,
        BoutiqueBillingComponent,
    ],
    templateUrl: './fiche-boutique.component.html',
    styleUrls: ['./fiche-boutique.component.css']
})
export class FicheBoutiqueComponent implements OnInit {

    boutique: any = null;
    isLoading = true;

    // ── Tabs
    activeTab: 'general' | 'delivery' | 'categories' | 'billing' = 'general';

    tabs = [
        {
            key: 'general',
            label: 'General',
            icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
        },
        {
            key: 'delivery',
            label: 'Delivery',
            icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>`
        },
        {
            key: 'categories',
            label: 'Categories',
            icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>`
        },
        {
            key: 'billing',
            label: 'Billing',
            icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`
        },
    ] as const;

    // ── Edit modal
    isEditModalOpen = false;
    editName = '';
    editDescription = '';
    editLogo = '';
    selectedLogoFile: File | null = null;
    isGeneralLoading = false;

    // ── Delivery config
    isDeliveryLoading = false;

    constructor(
        private boutiqueService: BoutiqueService,
        private authService: AuthService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.loadBoutique();
    }

    // ════════════════════════════
    //  LOAD
    // ════════════════════════════

    loadBoutique(): void {
        const boutiqueId = this.authService.userHash?.boutiqueId;
        if (!boutiqueId) {
            this.authService.logout();
            this.router.navigate(['/store/signin']);
            return;
        }
        this.isLoading = true;
        this.boutiqueService.getBoutiqueFullById(boutiqueId).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.boutique = res.data;
                    this.initializeEditFields();
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading boutique:', err);
                this.isLoading = false;
            }
        });
    }

    initializeEditFields(): void {
        this.editName = this.boutique.name || '';
        this.editDescription = this.boutique.description || '';
        this.editLogo = this.boutique.logo || '';

        // Delivery config is managed autonomously by BoutiqueDeliveryConfigComponent
    }

    // ════════════════════════════
    //  EDIT MODAL
    // ════════════════════════════

    openEditModal(): void {
        this.initializeEditFields();
        this.selectedLogoFile = null;
        this.isEditModalOpen = true;
    }

    closeEditModal(): void {
        this.isEditModalOpen = false;
    }

    // ════════════════════════════
    //  GENERAL INFO
    // ════════════════════════════

    onLogoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) {
            const file = input.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('Image too large — max 5MB.');
                input.value = '';
                return;
            }
            this.selectedLogoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => { this.editLogo = e.target?.result as string; };
            reader.readAsDataURL(file);
        }
    }

    private normalizeString(s?: string): string {
        return (s || '').trim().replace(/\s+/g, ' ');
    }

    isNameValid(): boolean {
        return this.normalizeString(this.editName).length >= 2;
    }

    hasGeneralChanged(): boolean {
        if (!this.boutique) return false;
        return this.normalizeString(this.boutique.name) !== this.normalizeString(this.editName)
            || (this.boutique.description || '') !== (this.editDescription || '')
            || this.selectedLogoFile !== null;
    }

    get isSaveGeneralDisabled(): boolean {
        return this.isGeneralLoading || !this.hasGeneralChanged() || !this.isNameValid();
    }

    saveGeneralInfo(): void {
        if (this.isSaveGeneralDisabled) return;

        let payload: any;
        if (this.selectedLogoFile) {
            payload = new FormData();
            payload.append('name', this.editName);
            payload.append('description', this.editDescription);
            payload.append('file', this.selectedLogoFile);
        } else {
            payload = { name: this.editName, description: this.editDescription };
        }

        this.isGeneralLoading = true;
        this.boutiqueService.updateBoutique(this.boutique._id, payload).subscribe({
            next: (res: any) => {
                if (res?.success && res?.data) {
                    this.boutique = res.data;
                    this.selectedLogoFile = null;
                    this.initializeEditFields();
                    this.closeEditModal();
                } else {
                    alert(res?.message || 'Failed to update boutique');
                }
                this.isGeneralLoading = false;
            },
            error: (err) => {
                this.initializeEditFields();
                alert(err?.error?.message || 'Error updating boutique');
                this.isGeneralLoading = false;
            }
        });
    }

    // ════════════════════════════
    //  DELIVERY
    // ════════════════════════════


    saveDeliveryConfig(payload: any): void {
        if (!payload) return;
        this.isDeliveryLoading = true;
        this.boutiqueService.updateDeliveryConfig(this.boutique._id, payload).subscribe({
            next: (res: any) => {
                if (res?.success && res?.data) {
                    this.boutique = res.data;
                    this.initializeEditFields();
                } else {
                    alert(res?.message || 'Failed to update delivery config');
                }
                this.isDeliveryLoading = false;
            },
            error: (err) => {
                alert(err?.error?.message || 'Error updating delivery config');
                this.isDeliveryLoading = false;
            }
        });
    }

    // ════════════════════════════
    //  UTILITY
    // ════════════════════════════

    formatDate(dateString: string): string {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import {ButtonComponent} from "../../../shared/components/ui/button/button.component";

@Component({
    selector: 'app-fiche-boutique',
    standalone: true,
    imports: [CommonModule, FormsModule, LabelComponent, InputFieldComponent, ButtonComponent],
    templateUrl: './fiche-boutique.component.html',
    styleUrls: ['./fiche-boutique.component.css']
})
export class FicheBoutiqueComponent implements OnInit {
    boutique: any = null;

    // Active tab
    activeTab: 'general' | 'delivery' = 'general';

    // Edit fields for general info
    editName: string = '';
    editDescription: string = '';
    editLogo: string = '';

    DEFAULT_DELIVERY_DAYS = [
        { _id: 1, day: 1, isActive: true },
        { _id: 2, day: 2, isActive: true },
        { _id: 3, day: 3, isActive: true },
        { _id: 4, day: 4, isActive: true },
        { _id: 5, day: 5, isActive: true },
        { _id: 6, day: 6, isActive: true },
        { _id: 7, day: 7, isActive: true }
    ];



    // Edit fields for delivery config
    editDeliveryConfig: any = {
        isDeliveryAvailable: true,
        orderCutoffTime: '18:00',
        deliveryDays: [...this.DEFAULT_DELIVERY_DAYS],
        deliveryRules: {
            minPrice: 0,
            baseDistanceKm: 0,
            extraPricePerKm: 0
        }
    };

    isGeneralLoading: boolean = false;
    isDeliveryLoading: boolean = false;

    constructor(
        private boutiqueService: BoutiqueService,
    ) {}

    ngOnInit(): void {
        this.loadBoutique();
    }

    loadBoutique(): void {
        // ne pas toucher actuellement
        // const boutiqueId = '69858cfa80bcf553def88fd1';
        const boutiqueId = '6984c9698d7113e9af10e905';
        this.boutiqueService.getBoutiqueFullById(boutiqueId).subscribe({
            next: (res) => {
                console.log('getBoutiqueFullById response:', res);

                if (res && res.data) {
                    this.boutique = res.data;
                    console.log(this.boutique);
                    this.initializeEditFields();
                }

                console.log('Loaded boutique:', this.boutique);
            },
            error: (err) => {
                console.error('Error loading boutique:', err);
            }
        });
    }

    initializeEditFields(): void {
        // Initialize general info
        this.editName = this.boutique.name || '';
        this.editDescription = this.boutique.description || '';
        this.editLogo = this.boutique.logo || '';

        // Initialize delivery config
        if (this.boutique.livraisonConfig) {
            this.editDeliveryConfig = {
                isDeliveryAvailable: this.boutique.livraisonConfig.isDeliveryAvailable ?? true,
                orderCutoffTime: this.boutique.livraisonConfig.orderCutoffTime || '18:00',
                deliveryDays: JSON.parse(JSON.stringify(this.boutique.livraisonConfig.deliveryDays || [])),
                deliveryRules: {
                    minPrice: this.boutique.livraisonConfig.deliveryRules?.minPrice || 0,
                    baseDistanceKm: this.boutique.livraisonConfig.deliveryRules?.baseDistanceKm || 0,
                    extraPricePerKm: this.boutique.livraisonConfig.deliveryRules?.extraPricePerKm || 0
                }
            };
        }
    }

    // ════════════════════════════════════════════
    //  GENERAL INFO FUNCTIONS
    // ════════════════════════════════════════════

    private normalizeString(s?: string): string {
        return (s || '').trim().replace(/\s+/g, ' ');
    }

    isNameValid(): boolean {
        const name = this.normalizeString(this.editName);
        if (!name) return false;
        const words = name.split(' ').filter(w => w.length > 0);
        return words.length >= 3;
    }

    isDeliveryRulesValid(): boolean {
        const r = this.editDeliveryConfig?.deliveryRules || {};
        const minPrice = Number(r.minPrice);
        const baseDistance = Number(r.baseDistanceKm);
        const extra = Number(r.extraPricePerKm);
        // doivent être strictement supérieurs à 0
        return (
            Number.isFinite(minPrice) && minPrice > 0 &&
            Number.isFinite(baseDistance) && baseDistance > 0 &&
            Number.isFinite(extra) && extra > 0
        );
    }

    private deliveryConfigEqual(a: any, b: any): boolean {
        if (!a && !b) return true;
        if (!a || !b) return false;
        // compare isDeliveryAvailable and orderCutoffTime
        if ((a.isDeliveryAvailable ?? false) !== (b.isDeliveryAvailable ?? false)) return false;
        if ((a.orderCutoffTime || '') !== (b.orderCutoffTime || '')) return false;
        // compare deliveryDays deeply (order and values)
        if (JSON.stringify(a.deliveryDays || []) !== JSON.stringify(b.deliveryDays || [])) return false;
        // compare deliveryRules
        if (JSON.stringify(a.deliveryRules || {}) !== JSON.stringify(b.deliveryRules || {})) return false;
        return true;
    }

    hasGeneralChanged(): boolean {
        if (!this.boutique) return false;
        const nameChanged = this.normalizeString(this.boutique.name) !== this.normalizeString(this.editName);
        const descChanged = (this.boutique.description || '') !== (this.editDescription || '');
        const logoChanged = (this.boutique.logo || '') !== (this.editLogo || '');
        return nameChanged || descChanged || logoChanged;
    }

    hasDeliveryChanged(): boolean {
        if (!this.boutique) return false;
        const existing = this.boutique.livraisonConfig || {};
        return !this.deliveryConfigEqual(existing, this.editDeliveryConfig);
    }

    get isSaveGeneralDisabled(): boolean {
        return this.isGeneralLoading || !this.hasGeneralChanged() || !this.isNameValid();
    }

    get isSaveDeliveryDisabled(): boolean {
        return this.isDeliveryLoading || !this.hasDeliveryChanged() || !this.isDeliveryRulesValid();
    }

    saveGeneralInfo(): void {
        if (this.isSaveGeneralDisabled) {
            if (!this.isNameValid()) {
                alert('Shop name must be at least 3 words.');
            }
            return;
        }

        const payload = {
            name: this.editName,
            description: this.editDescription,
            logo: this.editLogo
        };

        console.log('💾 Saving General Info:', payload);

        // Update local state optimistically
        const previous = { name: this.boutique.name, description: this.boutique.description, logo: this.boutique.logo };
        this.boutique.name = this.editName;
        this.boutique.description = this.editDescription;
        this.boutique.logo = this.editLogo;

        this.isGeneralLoading = true
        // Call API
        this.boutiqueService.updateBoutique(this.boutique._id, payload).subscribe({
            next: (res: any) => {
                if (res?.success && res?.data) {
                    // backend returns the updated boutique as data
                    this.boutique = res.data;
                    this.initializeEditFields();
                    console.log('Boutique updated:', this.boutique);
                } else {
                    // revert optimistic update
                    this.boutique.name = previous.name;
                    this.boutique.description = previous.description;
                    this.boutique.logo = previous.logo;
                    const msg = res?.message || 'Failed to update boutique';
                    console.error(msg);
                    alert(msg);
                }
                this.isGeneralLoading = false
            },
            error: (err) => {
                // revert optimistic update
                this.boutique.name = previous.name;
                this.boutique.description = previous.description;
                this.boutique.logo = previous.logo;
                this.initializeEditFields();
                const msg = err?.error?.message || 'Error updating boutique';
                console.error(msg, err);
                alert(msg);
                this.isGeneralLoading = false
            }
        });
    }

    // ════════════════════════════════════════════
    //  DELIVERY CONFIG FUNCTIONS
    // ════════════════════════════════════════════

    toggleGlobalDelivery(): void {
        this.editDeliveryConfig.isDeliveryAvailable = !this.editDeliveryConfig.isDeliveryAvailable;
        console.log('🚚 Global Delivery Toggle:', this.editDeliveryConfig.isDeliveryAvailable);
    }

    toggleDeliveryDay(day: any): void {
        day.isActive = !day.isActive;
    }

    getDayName(dayNumber: number): string {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[dayNumber - 1] || '';
    }

    getActiveDeliveryDaysCount(): number {
        return this.editDeliveryConfig.deliveryDays.filter((d: any) => d.isActive).length;
    }

    calculateExamplePrice(): number {
        const distance = 10;
        const baseDistance = this.editDeliveryConfig.deliveryRules.baseDistanceKm;
        const minPrice = this.editDeliveryConfig.deliveryRules.minPrice;
        const extraPerKm = this.editDeliveryConfig.deliveryRules.extraPricePerKm;

        if (distance <= baseDistance) {
            return minPrice;
        }

        const extraDistance = distance - baseDistance;
        return minPrice + (extraDistance * extraPerKm);
    }

    saveDeliveryConfig(): void {
        if (this.isSaveDeliveryDisabled) {
            if (!this.isDeliveryRulesValid()) {
                alert('Delivery rules must be numeric values strictly greater than 0 (minPrice, baseDistanceKm, extraPricePerKm).');
            }
            return;
        }
        const payload = {
            isDeliveryAvailable: this.editDeliveryConfig.isDeliveryAvailable,
            orderCutoffTime: this.editDeliveryConfig.orderCutoffTime,
            deliveryDays: this.editDeliveryConfig.deliveryDays.map((d: any) => ({
                day: d.day,
                isActive: d.isActive
            })),
            deliveryRules: {
                minPrice: this.editDeliveryConfig.deliveryRules.minPrice,
                baseDistanceKm: this.editDeliveryConfig.deliveryRules.baseDistanceKm,
                extraPricePerKm: this.editDeliveryConfig.deliveryRules.extraPricePerKm
            }
        };

        console.log('🚚 Saving Delivery Config:', payload);

        this.isDeliveryLoading = true;
        this.boutiqueService.updateDeliveryConfig(this.boutique._id, payload).subscribe({
            next: (res: any) => {
                if (res?.success && res?.data) {
                    this.boutique = res.data;
                    this.initializeEditFields();
                } else {
                    const msg = res?.message || 'Failed to update delivery config';
                    console.error(msg);
                    alert(msg);
                }
                this.isDeliveryLoading = false;
            },
            error: (err) => {
                const msg = err?.error?.message || 'Error updating delivery config';
                console.error(msg, err);
                alert(msg);
                this.isDeliveryLoading = false;
            }
        });
    }

    // ════════════════════════════════════════════
    //  UTILITY FUNCTIONS
    // ════════════════════════════════════════════

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
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

    // Edit fields for delivery config
    editDeliveryConfig: any = {
        isDeliveryAvailable: true,
        orderCutoffTime: '18:00',
        deliveryDays: [],
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
        const boutiqueId = '69858cfa80bcf553def88fd1';
        this.boutiqueService.getBoutiqueFullById(boutiqueId).subscribe({
            next: (res) => {
                console.log('getBoutiqueFullById response:', res);

                if (res && res.data) {
                    this.boutique = res.data;
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

    saveGeneralInfo(): void {
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
        console.log(`📅 Toggle Day ${day.day} (${this.getDayName(day.day)}):`, day.isActive);
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
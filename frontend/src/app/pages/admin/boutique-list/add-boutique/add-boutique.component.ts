import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from "../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { User } from '../../../../core/models/user.model';
import { Boutique } from '../../../../core/models/boutique.model';
import { LivraisonConfig, DeliveryDay } from '../../../../core/models/livraison-config.model';
import { BoutiqueService } from '../../../../shared/services/boutique.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { BoxService } from '../../../../shared/services/box.service';
import { Box } from '../../../../core/models/box.model';

@Component({
  selector: 'app-add-boutique',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent
  ],
  templateUrl: './add-boutique.component.html',
  styleUrls: ['./add-boutique.component.css']
})
export class AddBoutiqueComponent implements OnInit {
  pageTitle = 'Add New Shop';
  currentStep = 1;
  totalSteps = 4;

  // Data Models
  // Using Partial because we are building the object step-by-step and standard User model requires id/role which we don't have yet.
  userData: Partial<User> = {
    name: '',
    email: ''
  };

  boutiqueData: Partial<Boutique> = {
    name: '',
    logo: '',
    description: ''
  };

  boxes: Box[] = [];
  selectedBoxId: string | null = null;
  isBoxesLoading = false;
  hasFreeBoxes = true;

  livraisonData: Partial<LivraisonConfig> = {
    isDeliveryAvailable: true,
    deliveryRules: {
      minPrice: 0,
      baseDistanceKm: 0,
      extraPricePerKm: 0
    },
    deliveryDays: [
      { day: 1, isActive: true }, // Lundi
      { day: 2, isActive: true },
      { day: 3, isActive: true },
      { day: 4, isActive: true },
      { day: 5, isActive: true },
      { day: 6, isActive: false }, // Samedi
      { day: 7, isActive: false }  // Dimanche
    ],
    orderCutoffTime: '18:00',
    isActive: true
  };

  // UI state
  logoPreview: string | null = null;
  selectedLogoFile: File | null = null;
  isLoading = false;
  isCreated = false;
  passwordCopied = false;
  daysOfWeek = [
    { id: 1, label: 'Lundi' },
    { id: 2, label: 'Mardi' },
    { id: 3, label: 'Mercredi' },
    { id: 4, label: 'Jeudi' },
    { id: 5, label: 'Vendredi' },
    { id: 6, label: 'Samedi' },
    { id: 7, label: 'Dimanche' }
  ];

  createIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8.5L6.5 13L14 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;

  defaultPassword: string = '';

  constructor(
    private router: Router,
    private boutiqueService: BoutiqueService,
    private boxService: BoxService
  ) { }

  ngOnInit(): void {
    this.loadBoxes();
  }

  loadBoxes(): void {
    this.isBoxesLoading = true;
    this.boxService.getBoxes('all').subscribe({
      next: (res) => {
        this.isBoxesLoading = false;
        if (res && res.success) {
          this.boxes = res.data || [];
          this.hasFreeBoxes = this.boxes.some(b => !b.isOccupied);
        } else {
          this.boxes = [];
          this.hasFreeBoxes = false;
        }
      },
      error: () => {
        this.isBoxesLoading = false;
        this.boxes = [];
        this.hasFreeBoxes = false;
      }
    });
  }

  nextStep(): void {
    if (this.validateStep(this.currentStep)) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  skipStep(): void {
    // Only available if we want to skip optional steps
  }

  validateStep(step: number): boolean {
    switch (step) {
      case 1: // User
        return (this.userData.name?.trim().length ?? 0) > 0 &&
          (this.userData.email?.trim().length ?? 0) > 0 &&
          (this.userData.email?.includes('@') ?? false);
      case 2: // Box
        return this.hasFreeBoxes && !!this.selectedBoxId;
      case 3: // Boutique
        return (this.boutiqueData.name?.trim().length ?? 0) > 0 &&
          ((this.boutiqueData.logo?.trim().length ?? 0) > 0 || !!this.selectedLogoFile) &&
          (this.boutiqueData.description?.trim().length ?? 0) > 0;
      case 4: // Livraison
        if (!this.livraisonData.isDeliveryAvailable) return true;
        const rules = this.livraisonData.deliveryRules;
        if (!rules) return false;

        return rules.minPrice >= 0 &&
          rules.baseDistanceKm >= 0 &&
          rules.extraPricePerKm >= 0 &&
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(this.livraisonData.orderCutoffTime || '');
      default:
        return false;
    }
  }

  onLogoChange(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedLogoFile = file;
      this.boutiqueData.logo = ''; // Clear URL field if file selected
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoUrlChange(url: string | undefined): void {
    const validUrl = url || '';
    this.boutiqueData.logo = validUrl;
    this.logoPreview = validUrl;
    // Clear file selection if URL is manually entered
    if (validUrl) {
      this.selectedLogoFile = null;
    }
  }

  toggleDay(dayId: number): void {
    if (!this.livraisonData.deliveryDays) {
      this.livraisonData.deliveryDays = [];
    }

    const day = this.livraisonData.deliveryDays.find(d => d.day === dayId);
    if (day) {
      day.isActive = !day.isActive;
    } else {
      this.livraisonData.deliveryDays.push({ day: dayId, isActive: true });
    }
  }

  isDayActive(dayId: number): boolean {
    return this.livraisonData.deliveryDays?.find(d => d.day === dayId)?.isActive || false;
  }

  submitForm(): void {
    this.isLoading = true;
    const formData = new FormData();

    // 1. User Data
    formData.append('user', JSON.stringify(this.userData));

    // 2. Boutique Data (excluding logo file content, but including other fields)
    const boutiquePayload = {
      ...this.boutiqueData,
      boxId: this.selectedBoxId
    };
    formData.append('boutique', JSON.stringify(boutiquePayload));

    // 3. Livraison Config
    formData.append('livraisonConfig', JSON.stringify(this.livraisonData));

    // 4. Logo File
    if (this.selectedLogoFile) {
      formData.append('file', this.selectedLogoFile);
    }

    console.log('Submitting FormData...');

    this.boutiqueService.createBoutique(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isCreated = true;
        if (res.success) {
          this.defaultPassword = res.data.defaultPassword;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creating boutique:', err);
        alert(err?.error?.message || 'Une erreur est survenue lors de la création de la boutique.');
      }
    });
  }

  goToList(): void {
    this.router.navigate(['/admin/app/boutiques']);
  }

  cancel(): void {
    this.router.navigate(['/admin/app/boutiques']);
  }

  getStepStatus(step: number): string {
    if (step < this.currentStep) return 'completed';
    if (step === this.currentStep) return 'active';
    return 'inactive';
  }

  selectBox(box: Box): void {
    if (box.isOccupied) return;
    this.selectedBoxId = box._id;
  }

  isSelectedBox(box: Box): boolean {
    return this.selectedBoxId === box._id;
  }

  copyPassword(): void {
    if (this.defaultPassword) {
      navigator.clipboard.writeText(this.defaultPassword).then(() => {
        this.passwordCopied = true;
        setTimeout(() => this.passwordCopied = false, 2000);
      });
    }
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from "@angular/router";
import {StepManagerComponent} from "./step-manager/step-manager.component";
import {StepBoutiqueComponent} from "./step-boutique/step-boutique.component";
import {StepPlanComponent} from "./step-plan/step-plan.component";
import {StepLivraisonComponent} from "./step-livraison/step-livraison.component";
import {StepRecapComponent} from "./step-recap/step-recap.component";

export interface StoreRegisterData {
  manager: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
  boutique: {
    name: string;
    description: string;
    logo: File | null;
    logoPreview: string | null;
  };
  plan: {
    type: 'A' | 'B' | null;
    box: string | null;
    lat: number | null;
    lng: number | null;
  };
  livraison: {
    isDeliveryAvailable: boolean;
    minPrice: number;
    baseDistanceKm: number;
    extraPricePerKm: number;
    deliveryDays: { day: number; label: string; isActive: boolean }[];
    orderCutoffTime: string;
  };
  otpVerified: boolean;
}

@Component({
  selector: 'app-store-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StepManagerComponent,
    StepBoutiqueComponent,
    StepPlanComponent,
    StepLivraisonComponent,
    StepRecapComponent,
  ],
  templateUrl: './store-register.component.html',
})
export class StoreRegisterComponent {
  currentStep = 1;
  totalSteps = 5;

  formData: StoreRegisterData = {
    manager: { firstName: '', lastName: '', email: '', password: '' },
    boutique: { name: '', description: '', logo: null, logoPreview: null },
    plan: { type: null, box: null, lat: null, lng: null },
    livraison: {
      isDeliveryAvailable: true,
      minPrice: 0,
      baseDistanceKm: 0,
      extraPricePerKm: 0,
      deliveryDays: [
        { day: 1, label: 'Monday', isActive: true },
        { day: 2, label: 'Tuesday', isActive: true },
        { day: 3, label: 'Wednesday', isActive: true },
        { day: 4, label: 'Thursday', isActive: true },
        { day: 5, label: 'Friday', isActive: true },
        { day: 6, label: 'Saturday', isActive: false },
        { day: 7, label: 'Sunday', isActive: false },
      ],
      orderCutoffTime: '18:00',
    },
    otpVerified: false,
  };

  steps = [
    { number: 1, label: 'Manager',  sublabel: 'Responsible info' },
    { number: 2, label: 'Boutique', sublabel: 'Store identity' },
    { number: 3, label: 'Plan',     sublabel: 'Choose your plan' },
    { number: 4, label: 'Delivery', sublabel: 'Delivery config' },
    { number: 5, label: 'Review',   sublabel: 'Submit & verify' },
  ];

  animating = false;
  animDirection: 'next' | 'prev' = 'next';

  get progressPercent(): number {
    return Math.round(((this.currentStep - 1) / (this.totalSteps - 1)) * 100);
  }

  get progressLineHeight(): string {
    const percent = (this.currentStep - 1) / (this.totalSteps - 1);
    return `calc(${percent * 100}% )`;
  }

  goNext(): void {
    if (this.currentStep < this.totalSteps) {
      this.triggerAnim('next', () => this.currentStep++);
    }
  }

  goPrev(): void {
    if (this.currentStep > 1) {
      this.triggerAnim('prev', () => this.currentStep--);
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      const dir = step > this.currentStep ? 'next' : 'prev';
      this.triggerAnim(dir, () => this.currentStep = step);
    }
  }

  private triggerAnim(dir: 'next' | 'prev', change: () => void): void {
    this.animDirection = dir;
    this.animating = true;
    setTimeout(() => {
      change();
      this.scrollToTop();
      this.animating = false;
    }, 200);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
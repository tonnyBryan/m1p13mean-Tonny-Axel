import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface LivraisonData {
  isDeliveryAvailable: boolean;
  minPrice: number;
  baseDistanceKm: number;
  extraPricePerKm: number;
  deliveryDays: { day: number; label: string; isActive: boolean }[];
  orderCutoffTime: string;
}

@Component({
  selector: 'app-step-livraison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-livraison.component.html',
})
export class StepLivraisonComponent {
  @Input() data!: LivraisonData;
  @Output() dataChange = new EventEmitter<LivraisonData>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  get activeDaysCount(): number {
    return this.data.deliveryDays.filter(d => d.isActive).length;
  }

  get isValid(): boolean {
    if (!this.data.isDeliveryAvailable) return true;
    return this.activeDaysCount >= 1
        && this.data.minPrice >= 0
        && this.data.baseDistanceKm >= 0
        && this.data.extraPricePerKm >= 0
        && !!this.data.orderCutoffTime;
  }

  toggleDay(index: number): void {
    this.data.deliveryDays[index].isActive = !this.data.deliveryDays[index].isActive;
    this.dataChange.emit(this.data);
  }

  get isFreeDelivery(): boolean {
    return this.data.minPrice === 0 && this.data.extraPricePerKm === 0;
  }

  submit(): void {
    if (!this.isValid) return;
    this.dataChange.emit(this.data);
    this.next.emit();
  }
}
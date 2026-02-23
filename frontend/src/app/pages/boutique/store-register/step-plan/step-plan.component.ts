import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {LeafletMapComponent} from "../../../../shared/components/common/leaflet-map/leaflet-map.component";

export const BOXES = [
  { id: 'BOX-01', label: 'Box 01', price: 20000, taken: false },
  { id: 'BOX-02', label: 'Box 02', price: 20000, taken: false },
  { id: 'BOX-03', label: 'Box 03', price: 25000, taken: false },
  { id: 'BOX-04', label: 'Box 04', price: 25000, taken: false },
  { id: 'BOX-05', label: 'Box 05', price: 30000, taken: true },
  { id: 'BOX-06', label: 'Box 06', price: 30000, taken: true },
  { id: 'BOX-07', label: 'Box 07', price: 35000, taken: true },
  { id: 'BOX-08', label: 'Box 08', price: 35000, taken: true },
  { id: 'BOX-09', label: 'Box 09', price: 40000, taken: true },
  { id: 'BOX-10', label: 'Box 10', price: 40000, taken: true },
];

export const PLAN_A_PRICE = 15000;
export const PLAN_B_HOSTING_PRICE = 8000;

@Component({
  selector: 'app-step-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, LeafletMapComponent],
  templateUrl: './step-plan.component.html',
})
export class StepPlanComponent {
  @Input() data: { type: 'A' | 'B' | null; box: string | null; lat: number | null; lng: number | null } = {
    type: null, box: null, lat: null, lng: null
  };
  @Output() dataChange = new EventEmitter<any>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  boxes = BOXES;
  planAPrice = PLAN_A_PRICE;
  planBHostingPrice = PLAN_B_HOSTING_PRICE;

  get selectedBox() {
    return this.boxes.find(b => b.id === this.data.box) || null;
  }

  get totalPlanB(): number {
    return this.planBHostingPrice + (this.selectedBox?.price || 0);
  }

  get isValid(): boolean {
    if (!this.data.type) return false;
    if (this.data.type === 'A') return this.data.lat !== null && this.data.lng !== null;
    if (this.data.type === 'B') return this.data.box !== null;
    return false;
  }

  selectPlan(type: 'A' | 'B'): void {
    this.data.type = type;
    this.data.box = null;
    this.data.lat = null;
    this.data.lng = null;
    this.dataChange.emit(this.data);
  }

  selectBox(boxId: string): void {
    this.data.box = boxId;
    this.dataChange.emit(this.data);
  }

  onMapClick(event: { lat: number; lng: number }): void {
    this.data.lat = event.lat;
    this.data.lng = event.lng;
    this.dataChange.emit(this.data);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-MG') + ' Ar';
  }

  submit(): void {
    if (!this.isValid) return;
    this.dataChange.emit(this.data);
    this.next.emit();
  }
}
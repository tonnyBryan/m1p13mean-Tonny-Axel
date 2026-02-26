import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeafletMapComponent } from "../../../../shared/components/common/leaflet-map/leaflet-map.component";
import {PlanDetailModalComponent} from "./plan-detail-modal/plan-detail-modal.component";

export const BOXES = [
  { id: 'BOX-01', label: 'Box 01', price: 20000, taken: false },
  { id: 'BOX-02', label: 'Box 02', price: 20000, taken: false },
  { id: 'BOX-03', label: 'Box 03', price: 20000, taken: false },
  { id: 'BOX-04', label: 'Box 04', price: 20000, taken: false },
  { id: 'BOX-05', label: 'Box 05', price: 20000, taken: true },
  { id: 'BOX-06', label: 'Box 06', price: 20000, taken: true },
  { id: 'BOX-07', label: 'Box 07', price: 20000, taken: true },
  { id: 'BOX-08', label: 'Box 08', price: 20000, taken: true },
  { id: 'BOX-09', label: 'Box 09', price: 20000, taken: true },
  { id: 'BOX-10', label: 'Box 10', price: 20000, taken: true },
];

export const PLAN_A_PRICE = 15000;
export const PLAN_B_HOSTING_PRICE = 28000;

export interface PaymentInfo {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

@Component({
  selector: 'app-step-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, LeafletMapComponent, PlanDetailModalComponent],
  templateUrl: './step-plan.component.html',
})
export class StepPlanComponent {
  @Input() data: {
    type: 'A' | 'B' | null;
    box: string | null;
    lat: number | null;
    lng: number | null;
    payment: PaymentInfo | null;
  } = { type: null, box: null, lat: null, lng: null, payment: null };

  @Output() dataChange = new EventEmitter<any>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  boxes = BOXES;
  planAPrice = PLAN_A_PRICE;
  planBHostingPrice = PLAN_B_HOSTING_PRICE;

  paymentInfo: PaymentInfo = { cardNumber: '', cardName: '', expiryDate: '', cvv: '' };

  showModal = false;
  modalPlan: 'A' | 'B' | null = null;

  openModal(plan: 'A' | 'B', event: Event): void {
    event.stopPropagation();
    this.modalPlan = plan;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalPlan = null;
  }

  get firstAvailableBox() {
    return this.boxes.find(b => !b.taken) || null;
  }

  get selectedBox() {
    return this.boxes.find(b => b.id === this.data.box) || null;
  }

  /** Prix affiché sur la carte Plan B = hosting + première box dispo (ou box sélectionnée) */
  get planBDisplayPrice(): number {
    const box = this.selectedBox || this.firstAvailableBox;
    return this.planBHostingPrice + (box?.price || 0);
  }

  get totalPlanB(): number {
    return this.planBHostingPrice + (this.selectedBox?.price || 0);
  }

  get isCardValid(): boolean {
    return this.isValidCardNumber(this.paymentInfo.cardNumber)
        && this.isValidCardName(this.paymentInfo.cardName)
        && this.isValidExpiryDate(this.paymentInfo.expiryDate)
        && this.isValidCVV(this.paymentInfo.cvv);
  }

  get isValid(): boolean {
    if (!this.data.type) return false;
    if (this.data.type === 'A') return this.data.lat !== null && this.data.lng !== null && this.isCardValid;
    if (this.data.type === 'B') return this.data.box !== null;
    return false;
  }

  selectPlan(type: 'A' | 'B'): void {
    this.data.type = type;
    this.data.lat = null;
    this.data.lng = null;
    this.data.payment = null;
    this.paymentInfo = { cardNumber: '', cardName: '', expiryDate: '', cvv: '' };

    // Auto-sélectionner la première box disponible pour Plan B
    if (type === 'B') {
      const first = this.firstAvailableBox;
      this.data.box = first ? first.id : null;
    } else {
      this.data.box = null;
    }

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
    if (this.data.type === 'A') {
      this.data.payment = { ...this.paymentInfo };
    }
    this.dataChange.emit(this.data);
    this.next.emit();
  }

  // ── Card helpers ──────────────────────────────
  formatCardNumber(event: any): void {
    const value = event.target.value.replace(/\s/g, '');
    this.paymentInfo.cardNumber = value.match(/.{1,4}/g)?.join(' ') || value;
  }

  formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\//g, '');
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
    this.paymentInfo.expiryDate = value;
  }

  formatCardName(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.paymentInfo.cardName = input.value;
  }

  getCardType(): string | null {
    const number = this.paymentInfo.cardNumber.replace(/\s/g, '');
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    return null;
  }

  getCardTypeIcon(): string {
    switch (this.getCardType()) {
      case 'visa': return 'https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg';
      case 'mastercard': return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg';
      case 'amex': return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg';
      default: return '';
    }
  }

  isValidCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s/g, '');
    if (!/^\d{15,16}$/.test(digits)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  isValidCardName(name: string): boolean {
    return /^[A-Z '-]{3,}$/.test(name.trim());
  }

  isValidExpiryDate(expiry: string): boolean {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    return year > currentYear || (year === currentYear && month >= currentMonth);
  }

  isValidCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }
}
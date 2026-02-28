import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeafletMapComponent } from "../../../../shared/components/common/leaflet-map/leaflet-map.component";
import { PlanDetailModalComponent } from "./plan-detail-modal/plan-detail-modal.component";
import { BoxService } from '../../../../shared/services/box.service';
import { CentreService } from '../../../../shared/services/centre.service';
import { Box } from '../../../../core/models/box.model';

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
export class StepPlanComponent implements OnInit {
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

  // ── Données dynamiques ──
  boxes: Box[] = [];
  isBoxesLoading = false;
  planAPrice = 0;
  planBPrice = 0;   // prix hosting Plan B (du centre)
  isCentreLoading = false;

  paymentInfo: PaymentInfo = { cardNumber: '', cardName: '', expiryDate: '', cvv: '' };

  showModal = false;
  modalPlan: 'A' | 'B' | null = null;

  constructor(
      private boxService: BoxService,
      private centreService: CentreService
  ) {}

  ngOnInit(): void {
    this.loadCentre();
    this.loadBoxes();
  }

  // ── Loaders ──────────────────────────────────────────────────────────

  loadCentre(): void {
    this.isCentreLoading = true;
    this.centreService.getCentreCommercial().subscribe({
      next: (res: any) => {
        this.isCentreLoading = false;
        if (res?.success && res?.data) {
          this.planAPrice = res.data.planAPrice ?? 0;
          this.planBPrice = res.data.planBPrice ?? 0;
        }
      },
      error: () => { this.isCentreLoading = false; }
    });
  }

  loadBoxes(): void {
    this.isBoxesLoading = true;
    this.boxService.getBoxes('vide').subscribe({
      next: (res: any) => {
        this.isBoxesLoading = false;
        this.boxes = res?.success ? (res.data ?? []) : [];
        // Auto-sélectionner la première box dispo si Plan B déjà choisi
        if (this.data.type === 'B' && !this.data.box && this.firstAvailableBox) {
          this.data.box = this.firstAvailableBox._id;
          this.dataChange.emit(this.data);
        }
      },
      error: () => {
        this.isBoxesLoading = false;
        this.boxes = [];
      }
    });
  }

  // ── Getters ──────────────────────────────────────────────────────────

  get firstAvailableBox(): Box | null {
    return this.boxes.find(b => !b.isOccupied) ?? null;
  }

  get selectedBox(): Box | null {
    return this.boxes.find(b => b._id === this.data.box) ?? null;
  }

  get planBDisplayPrice(): number {
    const box = this.selectedBox || this.firstAvailableBox;
    return this.planBPrice + (box?.pricePerMonth || 0);
  }

  get totalPlanB(): number {
    return this.planBPrice + (this.selectedBox?.pricePerMonth || 0);
  }

  get isLoading(): boolean {
    return this.isCentreLoading || this.isBoxesLoading;
  }

  // ── Actions ──────────────────────────────────────────────────────────

  openModal(plan: 'A' | 'B', event: Event): void {
    event.stopPropagation();
    this.modalPlan = plan;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalPlan = null;
  }

  selectPlan(type: 'A' | 'B'): void {
    this.data.type = type;
    this.data.lat = null;
    this.data.lng = null;
    this.data.payment = null;
    this.paymentInfo = { cardNumber: '', cardName: '', expiryDate: '', cvv: '' };

    if (type === 'B') {
      this.data.box = this.firstAvailableBox?._id ?? null;
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

  // ── Validation ───────────────────────────────────────────────────────

  get isCardValid(): boolean {
    return this.isValidCardNumber(this.paymentInfo.cardNumber)
        && this.isValidCardName(this.paymentInfo.cardName)
        && this.isValidExpiryDate(this.paymentInfo.expiryDate)
        && this.isValidCVV(this.paymentInfo.cvv);
  }

  get isValid(): boolean {
    if (!this.data.type) return false;
    if (this.data.type === 'A') return this.data.lat !== null && this.data.lng !== null && this.isCardValid;
    if (this.data.type === 'B') return !!this.data.box;
    return false;
  }

  submit(): void {
    if (!this.isValid) return;
    if (this.data.type === 'A') {
      this.data.payment = { ...this.paymentInfo };
    }
    this.dataChange.emit(this.data);
    this.next.emit();
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-MG') + ' Ar';
  }

  // ── Card helpers ──────────────────────────────────────────────────────

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
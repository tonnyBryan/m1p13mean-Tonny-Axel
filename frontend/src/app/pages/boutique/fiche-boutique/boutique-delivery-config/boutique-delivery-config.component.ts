import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-boutique-delivery-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './boutique-delivery-config.component.html',
})
export class BoutiqueDeliveryConfigComponent implements OnChanges {

  @Input() boutique: any = null;
  @Input() isDeliveryLoading = false;

  /** Emits the normalized payload when user saves */
  @Output() saveDelivery = new EventEmitter<any>();

  // ── Local editable copy (never shared with parent)
  config: any = {
    isDeliveryAvailable: true,
    orderCutoffTime: '18:00',
    deliveryDays: [],
    deliveryRules: { minPrice: 0, baseDistanceKm: 0, extraPricePerKm: 0 }
  };

  // ── Serialized snapshot of the original state
  private _original = '';

  // ────────────────────────────────────────
  //  Derived flags
  // ────────────────────────────────────────

  get hasChanged(): boolean {
    return JSON.stringify(this._normalize(this.config)) !== this._original;
  }

  get isRulesValid(): boolean {
    const r = this.config?.deliveryRules || {};
    const ok = (x: any) => Number.isFinite(Number(x)) && Number(x) >= 0;
    return ok(r.minPrice) && ok(r.baseDistanceKm) && ok(r.extraPricePerKm);
  }

  get isDaysValid(): boolean {
    if (!this.config?.isDeliveryAvailable) return true;
    return this.getActiveDaysCount() > 0;
  }

  get isFreeDelivery(): boolean {
    const r = this.config?.deliveryRules || {};
    return Number(r.minPrice) === 0 && Number(r.extraPricePerKm) === 0;
  }

  get isSaveDisabled(): boolean {
    return this.isDeliveryLoading || !this.hasChanged || !this.isRulesValid || !this.isDaysValid;
  }

  // ────────────────────────────────────────
  //  Lifecycle
  // ────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['boutique'] && this.boutique) {
      this._initFromBoutique();
    }
  }

  private _initFromBoutique(): void {
    const src = this.boutique?.livraisonConfig;
    // Deep-copy so we never mutate the parent's reference
    this.config = {
      isDeliveryAvailable: src?.isDeliveryAvailable ?? true,
      orderCutoffTime: src?.orderCutoffTime || '18:00',
      deliveryDays: JSON.parse(JSON.stringify(src?.deliveryDays || [])),
      deliveryRules: {
        minPrice: src?.deliveryRules?.minPrice ?? 0,
        baseDistanceKm: src?.deliveryRules?.baseDistanceKm ?? 0,
        extraPricePerKm: src?.deliveryRules?.extraPricePerKm ?? 0,
      }
    };
    // Take the snapshot AFTER init so baseline == current state
    this._original = JSON.stringify(this._normalize(this.config));
  }

  // Strips _id and other irrelevant fields — only what matters for comparison & save
  private _normalize(c: any) {
    return {
      isDeliveryAvailable: c.isDeliveryAvailable,
      orderCutoffTime: c.orderCutoffTime,
      deliveryDays: (c.deliveryDays || []).map((d: any) => ({
        day: d.day,
        isActive: d.isActive
      })),
      deliveryRules: {
        minPrice: Number(c.deliveryRules?.minPrice),
        baseDistanceKm: Number(c.deliveryRules?.baseDistanceKm),
        extraPricePerKm: Number(c.deliveryRules?.extraPricePerKm),
      }
    };
  }

  // ────────────────────────────────────────
  //  Local actions (no parent involvement)
  // ────────────────────────────────────────

  toggleGlobalDelivery(): void {
    this.config.isDeliveryAvailable = !this.config.isDeliveryAvailable;
  }

  toggleDay(day: any): void {
    day.isActive = !day.isActive;
  }

  getDayLabel(dayNumber: number): string {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayNumber - 1] || '';
  }

  getActiveDaysCount(): number {
    return (this.config?.deliveryDays || []).filter((d: any) => d.isActive).length;
  }

  // ────────────────────────────────────────
  //  Save
  // ────────────────────────────────────────

  save(): void {
    if (this.isSaveDisabled) return;
    this.saveDelivery.emit(this._normalize(this.config));
  }
}

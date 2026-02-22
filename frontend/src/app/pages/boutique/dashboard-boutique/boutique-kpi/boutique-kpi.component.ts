import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface KpiData {
  pendingOrdersCount: number;
  activeOrdersCount: number;
  caToday: {
    total: number;
    direct: number;
    fromOrder: number;
  };
  lowStock: {
    total: number;
    items: any[];
  };
}

@Component({
  selector: 'app-boutique-kpi',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-kpi.component.html',
})
export class BoutiqueKpiComponent implements OnChanges {

  @Input() data: any = null;
  @Input() isLoading = true;

  kpi: KpiData | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.kpi = {
        pendingOrdersCount: this.data.pendingOrdersCount,
        activeOrdersCount: this.data.activeOrdersCount,
        caToday: this.data.caToday,
        lowStock: this.data.lowStock,
      };
    }
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
  }
}
import { Component } from '@angular/core';
import {BoutiqueKpiComponent} from "./boutique-kpi/boutique-kpi.component";
import {BoutiqueDashboardService} from "../../../shared/services/boutique-dashboard.service";
import {ToastService} from "../../../shared/services/toast.service";
import {BoutiqueOrdersComponent} from "./boutique-orders/boutique-orders.component";
import {BoutiqueLowStockComponent} from "./boutique-low-stock/boutique-low-stock.component";
import {BoutiqueRatingsComponent} from "./boutique-ratings/boutique-ratings.component";
import {BoutiqueAnalyticsComponent} from "./boutique-analytics/boutique-analytics.component";

@Component({
  selector: 'app-dashboard-boutique',
  imports: [
    BoutiqueKpiComponent,
    BoutiqueOrdersComponent,
    BoutiqueLowStockComponent,
    BoutiqueRatingsComponent,
    BoutiqueAnalyticsComponent
  ],
  templateUrl: './dashboard-boutique.component.html',
  styleUrl: './dashboard-boutique.component.css',
})
export class DashboardBoutiqueComponent {
  realtimeData: any = null;
  isLoading = true;

  constructor(
      private dashboardService: BoutiqueDashboardService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getRealtime().subscribe({
      next: (res) => {
        if (res.success) {
          this.realtimeData = res.data;
          console.log(this.realtimeData);
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load dashboard.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load dashboard.', 0);
        this.isLoading = false;
      }
    });
  }
}

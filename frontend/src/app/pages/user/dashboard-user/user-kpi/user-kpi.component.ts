import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {UserDashboardService} from "../../../../shared/services/user-dashboard.service";
import {ToastService} from "../../../../shared/services/toast.service";

interface KpiData {
  totalOrders: number;
  deliveryOrders: number;
  pickupOrders: number;
  totalSpent: number;
  totalDeliveryFees: number;
  wishlistCount: number;
}

@Component({
  selector: 'app-user-kpi',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-kpi.component.html',
})
export class UserKpiComponent implements OnInit {

  kpi: KpiData | null = null;
  isLoading = true;

  constructor(
      private dashboardService: UserDashboardService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getKpi().subscribe({
      next: (res) => {
        if (res.success) {
          this.kpi = res.data;
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load KPI data.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load KPI data.', 0);
        this.isLoading = false;
      }
    });
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' Ar';
  }
}
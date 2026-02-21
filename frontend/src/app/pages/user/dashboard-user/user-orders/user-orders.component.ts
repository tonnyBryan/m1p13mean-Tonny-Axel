import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserDashboardService } from '../../../../shared/services/user-dashboard.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface Order {
  id: string;
  boutiqueName: string;
  boutiqueLogo: string | null;
  date: Date;
  totalAmount: number;
  deliveryFee: number;
  status: string;
}

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.css',
})
export class UserOrdersComponent implements OnInit {

  activeOrders: Order[] = [];
  lastSuccessfulOrder: Order | null = null;
  isLoading = true;

  constructor(
      private dashboardService: UserDashboardService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.dashboardService.getOrders().subscribe({
      next: (res) => {
        if (res.success) {
          this.activeOrders = res.data.activeOrders.map((o: any) => this.mapOrder(o));
          this.lastSuccessfulOrder = res.data.lastSuccessfulOrder
              ? this.mapOrder(res.data.lastSuccessfulOrder)
              : null;
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load orders.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load orders.', 0);
        this.isLoading = false;
      }
    });
  }

  private mapOrder(o: any): Order {
    return {
      id: o._id,
      boutiqueName: o.boutique?.name ?? 'Unknown',
      boutiqueLogo: o.boutique?.logo ?? null,
      date: new Date(o.updatedAt),
      totalAmount: o.totalAmount,
      deliveryFee: o.deliveryAddress?.price ?? 0,
      status: o.status,
    };
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  getStatusConfig(status: string): { label: string; classes: string } {
    const map: Record<string, { label: string; classes: string }> = {
      paid:       { label: 'Paid',       classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
      accepted:   { label: 'Accepted',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      delivering: { label: 'Delivering', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
      success:    { label: 'Delivered',  classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    };
    return map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }
}
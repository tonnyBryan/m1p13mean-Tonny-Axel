import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-boutique-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-orders.component.html',
})
export class BoutiqueOrdersComponent {

  @Input() orders: any[] = [];
  @Input() isLoading = true;

  getStatusConfig(status: string): { label: string; classes: string } {
    const map: Record<string, { label: string; classes: string }> = {
      paid:       { label: 'Paid',       classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
      accepted:   { label: 'Accepted',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      delivering: { label: 'Delivering', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
      success:    { label: 'Delivered',  classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      canceled:   { label: 'Canceled',   classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    };
    return map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(date));
  }
}
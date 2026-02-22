import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';

@Component({
  selector: 'app-boutique-low-stock',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-low-stock.component.html',
})
export class BoutiqueLowStockComponent {

  constructor(protected router : Router) {
  }

  @Input() items: { total: number; items: any[] } | null = null;
  @Input() isLoading = true;

  getStockColor(stock: number): string {
    if (stock === 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (stock <= 2) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
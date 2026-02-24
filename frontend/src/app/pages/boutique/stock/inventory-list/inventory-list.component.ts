import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, PageBreadcrumbComponent],
    template: `
    <div class="mx-auto max-w-7xl">
        <app-page-breadcrumb pageTitle="Inventaires" [breadcrumbs]="[
            { label: 'Store', link: '/store/app' },
            { label: 'Stock' },
            { label: 'Inventaires' }
        ]"></app-page-breadcrumb>

        <div class="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
            <div class="flex flex-col items-center gap-4">
                <div class="rounded-full bg-gray-50 p-6 dark:bg-white/5">
                    <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Module Inventaire</h3>
                <p class="max-w-md text-gray-500 dark:text-gray-400">
                    Cette fonctionnalité est en cours de développement. Elle permettra de réaliser des comptages de stock et de générer automatiquement des mouvements de régularisation.
                </p>
                <button routerLink="/store/app/stock/mouvements" class="mt-4 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-all">
                    Voir les mouvements de stock
                </button>
            </div>
        </div>
    </div>
  `
})
export class InventoryListComponent { }

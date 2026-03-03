import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-kpi',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-kpi.component.html'
})
export class AdminKpiComponent {
    @Input() stats: any = null;
    @Input() isLoading = true;

    formatPrice(price: number): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'Ar',
            minimumFractionDigits: 0
        }).format(price || 0);
    }
}

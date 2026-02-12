import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VenteService } from '../../../shared/services/vente.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { Vente } from '../../../core/models/vente.model';

@Component({
    selector: 'app-vente-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, BadgeComponent],
    templateUrl: './vente-list.component.html',
})
export class VenteListComponent implements OnInit {
    ventes: Vente[] = [];
    pagination = {
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        limit: 10
    };

    filters = {
        status: '',
        paymentMethod: '',
        startDate: '',
        endDate: ''
    };

    isLoading = false;

    constructor(private venteService: VenteService) { }

    ngOnInit(): void {
        this.loadVentes();
    }

    loadVentes(): void {
        this.isLoading = true;

        const params: any = {
            page: this.pagination.page,
            limit: this.pagination.limit,
            sort: '-saleDate'
        };

        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.paymentMethod) params.paymentMethod = this.filters.paymentMethod;

        // Date filtering (advancedResults supports $gte, $lte via [gte], [lte])
        if (this.filters.startDate) params['saleDate[gte]'] = this.filters.startDate;
        if (this.filters.endDate) params['saleDate[lte]'] = this.filters.endDate;

        this.venteService.getVentesList(params).subscribe({
            next: (res) => {
                this.ventes = res.data.items;
                this.pagination = res.data.pagination;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    onFilterChange(): void {
        this.pagination.page = 1;
        this.loadVentes();
    }

    resetFilters(): void {
        this.filters = {
            status: '',
            paymentMethod: '',
            startDate: '',
            endDate: ''
        };
        this.onFilterChange();
    }

    changePage(page: number): void {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.page = page;
        this.loadVentes();
    }

    getStatusColor(status: string): any {
        switch (status) {
            case 'paid': return 'success';
            case 'draft': return 'warning';
            case 'canceled': return 'error';
            default: return 'light';
        }
    }

    getPaymentMethodIcon(method: string): string {
        switch (method) {
            case 'cash': return 'Cash';
            case 'mobile_money': return 'Mobile';
            case 'card': return 'Carte';
            default: return method;
        }
    }
}

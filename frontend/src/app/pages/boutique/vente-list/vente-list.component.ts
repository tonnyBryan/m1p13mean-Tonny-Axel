import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VenteService } from '../../../shared/services/vente.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { Vente } from '../../../core/models/vente.model';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { DatePickerComponent } from '../../../shared/components/form/date-picker/date-picker.component';

@Component({
    selector: 'app-vente-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        PageBreadcrumbComponent,
        InputFieldComponent,
        SelectComponent,
        DatePickerComponent
    ],
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

    Math = Math;

    filters = {
        status: '',
        paymentMethod: '',
        startDate: '',
        endDate: '',
        clientName: '',
        minAmount: null,
        maxAmount: null,
        saleType: '',
        origin: '' // NEW: Origin filter
    };

    statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'paid', label: 'Paid' },
        { value: 'draft', label: 'Draft' },
        { value: 'canceled', label: 'Canceled' }
    ];

    paymentMethodOptions = [
        { value: '', label: 'All Methods' },
        { value: 'cash', label: 'Cash' },
        { value: 'mobile_money', label: 'Mobile Money' },
        { value: 'card', label: 'Card' }
    ];

    saleTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'dine-in', label: 'Dine-in' },
        { value: 'delivery', label: 'Delivery' }
    ];

    // NEW: Origin options
    originOptions = [
        { value: '', label: 'All Origins' },
        { value: 'direct', label: 'Direct' },
        { value: 'order', label: 'Order' }
    ];

    isLoading = false;
    isSkeletonLoading = true;

    constructor(private venteService: VenteService) { }

    ngOnInit(): void {
        this.loadVentes();
        this.loadStats();
    }

    stats = {
        totalDocs: 0,
        todayDocs: 0,
        monthDocs: 0,
        pendingDocs: 0
    };

    loadStats(): void {
        this.venteService.getVenteStats().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.stats = res.data;
                }
            },
            error: (err: any) => console.error(err)
        });
    }

    loadVentes(): void {
        // FIX #4: Show skeleton on every filter change
        this.isLoading = true;
        this.isSkeletonLoading = true;

        const params: any = {
            page: this.pagination.page,
            limit: this.pagination.limit,
            sort: '-saleDate'
        };

        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.paymentMethod) params.paymentMethod = this.filters.paymentMethod;
        if (this.filters.saleType) params.saleType = this.filters.saleType;
        if (this.filters.origin) params.origin = this.filters.origin; // NEW: Origin filter

        if (this.filters.clientName) {
            params['client.name[regex]'] = this.filters.clientName;
            params['client.name[options]'] = 'i';
        }

        if (this.filters.minAmount) params['totalAmount[gte]'] = this.filters.minAmount;
        if (this.filters.maxAmount) params['totalAmount[lte]'] = this.filters.maxAmount;

        if (this.filters.startDate) params['saleDate[gte]'] = this.filters.startDate;
        if (this.filters.endDate) params['saleDate[lte]'] = this.filters.endDate;

        this.venteService.getVentesList(params).subscribe({
            next: (res) => {
                this.ventes = res.data.items;
                this.pagination = res.data.pagination;
                this.isLoading = false;
                this.isSkeletonLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this.isSkeletonLoading = false;
            }
        });
    }

    onFilterChange(): void {
        this.pagination.page = 1;
        this.loadVentes();
    }

    onSelectChange(key: string, value: string): void {
        (this.filters as any)[key] = value;
        this.onFilterChange();
    }

    onDateChange(key: string, event: any): void {
        if (event && event.dateStr) {
            (this.filters as any)[key] = event.dateStr;
            this.onFilterChange();
        }
    }

    onInputChange(key: string, value: any): void {
        (this.filters as any)[key] = value;
        this.onFilterChange();
    }

    resetFilters(): void {
        this.filters = {
            status: '',
            paymentMethod: '',
            startDate: '',
            endDate: '',
            clientName: '',
            minAmount: null,
            maxAmount: null,
            saleType: '',
            origin: ''
        };
        this.onFilterChange();
    }

    changePage(page: number): void {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.page = page;
        this.loadVentes();
    }

    // Keep legacy methods for badges (not used anymore but kept for compatibility)
    getStatusColor(status: string): any {
        switch (status) {
            case 'paid': return 'success';
            case 'draft': return 'warning';
            case 'canceled': return 'error';
            default: return 'light';
        }
    }

    getSaleTypeColor(type: string): any {
        switch (type) {
            case 'dine-in': return 'info';
            case 'takeaway': return 'warning';
            case 'delivery': return 'success';
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
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
        BadgeComponent,
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
        saleType: '' // New filter
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
        { value: 'takeaway', label: 'Takeaway' },
        { value: 'delivery', label: 'Delivery' }
    ];

    isLoading = false;
    isSkeletonLoading = true; // For skeleton display

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
        // Placeholder for stats loading. 
        // In a real scenario, this would call a service method like this.venteService.getVenteStats()
        // For now, I will derive what I can or just calculate from valid API if available, 
        // but since pagination is server-side, I can't calculate 'Total' from 'items'.
        // I will use a service call.
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
        this.isLoading = true;

        // Show skeleton only on initial load or full reload, not pagination if possible? 
        // Or usually skeleton replaces table. Let's keep it simple.
        if (this.ventes.length === 0) this.isSkeletonLoading = true;

        const params: any = {
            page: this.pagination.page,
            limit: this.pagination.limit,
            sort: '-saleDate'
        };

        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.paymentMethod) params.paymentMethod = this.filters.paymentMethod;
        if (this.filters.saleType) params.saleType = this.filters.saleType;

        // Backend regex search for client name using 'populate' logic? 
        // Actually, advancedResults might not support deep regex on populated fields easily out of the box 
        // unless backend supports it. Providing 'client' string might imply searching by ID. 
        // If client is stored as Object, searching by name requires specific backend logic. 
        // For now, let's send what we can. If client name is just a string in 'client.name' (denormalized) it works.
        // But in Vente model 'client' is Object with name. 
        // Let's assume user wants us to try passing a param the backend might handle or we add it later.
        // Wait, earlier 'clientSearch' used 'name[regex]'. That was on UserProfile.
        // Vente has embedded client object `{ name, ... }`. So we can search `client.name`.
        // Mongoose advancedResults usually handles dot notation if configured.
        if (this.filters.clientName) {
            // Using dot notation for client name search if backend supports it via advancedResults or specific logic
            params['client.name[regex]'] = this.filters.clientName;
            params['client.name[options]'] = 'i';
        }

        if (this.filters.minAmount) params['totalAmount[gte]'] = this.filters.minAmount;
        if (this.filters.maxAmount) params['totalAmount[lte]'] = this.filters.maxAmount;

        // Date filtering
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

    // Handlers for reusable components
    onSelectChange(key: string, value: string): void {
        (this.filters as any)[key] = value;
        this.onFilterChange();
    }

    onDateChange(key: string, event: any): void {
        // Flatpickr emits { selectedDates, dateStr, instance }
        // We use dateStr
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
            saleType: ''
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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockMovementService } from '../../../../shared/services/stock-movement.service';
import { ProductService } from '../../../../shared/services/product.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { SelectComponent } from '../../../../shared/components/form/select/select.component';
import { DatePickerComponent } from '../../../../shared/components/form/date-picker/date-picker.component';
import { StockMovement } from '../../../../core/models/stock-movement.model';

@Component({
    selector: 'app-stock-mouvements-list',
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
    templateUrl: './stock-mouvements-list.component.html',
})
export class StockMouvementsListComponent implements OnInit {
    movements: StockMovement[] = [];
    products: any[] = [];
    pagination = {
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        limit: 10
    };

    Math = Math;

    filters = {
        product: '',
        type: '',
        source: '',
        startDate: '',
        endDate: '',
        note: ''
    };

    typeOptions = [
        { value: '', label: 'Tous les types' },
        { value: 'IN', label: 'Entrée (IN)' },
        { value: 'OUT', label: 'Sortie (OUT)' }
    ];

    sourceOptions = [
        { value: '', label: 'Toutes les sources' },
        { value: 'manual', label: 'Manuelle' },
        { value: 'inventory', label: 'Inventaire' }
    ];

    productOptions: { value: string; label: string }[] = [{ value: '', label: 'Tous les produits' }];

    isLoading = false;
    isSkeletonLoading = true;

    constructor(
        private stockService: StockMovementService,
        private productService: ProductService
    ) { }

    ngOnInit(): void {
        this.loadProducts();
        this.loadMovements();
    }

    loadProducts(): void {
        this.productService.getProducts({ limit: 1000 }).subscribe({
            next: (res) => {
                this.products = res.data.items;
                this.productOptions = [
                    { value: '', label: 'Tous les produits' },
                    ...this.products.map(p => ({ value: p._id, label: p.name }))
                ];
            },
            error: (err) => console.error(err)
        });
    }

    loadMovements(): void {
        this.isLoading = true;
        this.isSkeletonLoading = true;

        const params: any = {
            page: this.pagination.page,
            limit: this.pagination.limit,
            sort: '-createdAt'
        };

        if (this.filters.product) params.product = this.filters.product;
        if (this.filters.type) params.type = this.filters.type;
        if (this.filters.source) params.source = this.filters.source;
        if (this.filters.startDate) params['createdAt[gte]'] = this.filters.startDate;
        if (this.filters.endDate) params['createdAt[lte]'] = this.filters.endDate;
        if (this.filters.note) {
            params['note[regex]'] = this.filters.note;
            params['note[options]'] = 'i';
        }

        this.stockService.getStockMovementList(params).subscribe({
            next: (res) => {
                this.movements = res.data.items;
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
        this.loadMovements();
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
            product: '',
            type: '',
            source: '',
            startDate: '',
            endDate: '',
            note: ''
        };
        this.onFilterChange();
    }

    changePage(page: number): void {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.page = page;
        this.loadMovements();
    }

    getTypeColor(type: string): string {
        return type === 'IN' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
    }
}

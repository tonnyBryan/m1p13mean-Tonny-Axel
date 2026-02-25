import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { StockMovementService } from '../../../../shared/services/stock-movement.service';
import { ProductService } from '../../../../shared/services/product.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { SelectComponent } from '../../../../shared/components/form/select/select.component';
import { DatePickerComponent } from '../../../../shared/components/form/date-picker/date-picker.component';
import { StockMovement } from '../../../../core/models/stock-movement.model';
import { Product } from '../../../../core/models/product.model';

@Component({
    selector: 'app-stock-mouvements-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        PageBreadcrumbComponent,
        SelectComponent,
        DatePickerComponent
    ],
    templateUrl: './stock-mouvements-list.component.html',
})
export class StockMouvementsListComponent implements OnInit {
    movements: StockMovement[] = [];
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
        endDate: ''
    };

    // ── Product autocomplete ──────────────────────────────────────
    productSearchQuery = '';
    productSearchResults: Product[] = [];
    showProductDropdown = false;
    isSearchingProduct = false;
    selectedProductLabel = '';
    productSearchSubject = new Subject<string>();
    productSearchMode: 'name' | 'sku' = 'name';

    typeOptions = [
        { value: '', label: 'All types' },
        { value: 'IN', label: 'IN' },
        { value: 'OUT', label: 'OUT' }
    ];

    sourceOptions = [
        { value: '', label: 'All sources' },
        { value: 'manual', label: 'Manual' },
        { value: 'inventory', label: 'Inventory' },
        { value: 'sale', label: 'Sale' }
    ];

    isLoading = false;
    isSkeletonLoading = true;

    constructor(
        private stockService: StockMovementService,
        private productService: ProductService,
        private elementRef: ElementRef
    ) {}

    ngOnInit(): void {
        this.loadMovements();
        this.initProductSearch();
    }

    // ── Product search autocomplete ───────────────────────────────
    private initProductSearch(): void {
        this.productSearchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (term.length < 2) {
                    this.productSearchResults = [];
                    this.showProductDropdown = false;
                    this.isSearchingProduct = false;
                    return of({ data: { items: [] } });
                }

                this.isSearchingProduct = true;
                this.showProductDropdown = false;

                const params: any = { isActive: true, limit: 20 };
                if (this.productSearchMode === 'sku') {
                    params['sku[regex]'] = term;
                    params['sku[options]'] = 'i';
                } else {
                    params['name[regex]'] = term;
                    params['name[options]'] = 'i';
                }

                return this.productService.getProducts(params);
            })
        ).subscribe((res: any) => {
            this.isSearchingProduct = false;
            this.productSearchResults = res?.data?.items || [];
            this.showProductDropdown = this.productSearchResults.length > 0;
        });
    }

    onProductSearchInput(event: any): void {
        const value = event.target.value;
        this.productSearchQuery = value;

        // If user clears input, reset filter
        if (!value) {
            this.clearProductFilter();
            return;
        }

        this.productSearchSubject.next(value);
    }

    selectProductFilter(product: Product): void {
        this.filters.product = product._id as string;
        this.selectedProductLabel = product.name;
        this.productSearchQuery = product.name;
        this.showProductDropdown = false;
        this.productSearchResults = [];
        this.onFilterChange();
    }

    clearProductFilter(): void {
        this.filters.product = '';
        this.selectedProductLabel = '';
        this.productSearchQuery = '';
        this.productSearchResults = [];
        this.showProductDropdown = false;
        this.onFilterChange();
    }

    setProductSearchMode(mode: 'name' | 'sku'): void {
        this.productSearchMode = mode;
        this.productSearchQuery = '';
        this.productSearchResults = [];
        this.showProductDropdown = false;
    }

    // Close dropdown when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.showProductDropdown = false;
        }
    }

    // ── Movements ─────────────────────────────────────────────────
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

    resetFilters(): void {
        this.filters = { product: '', type: '', source: '', startDate: '', endDate: '' };
        this.clearProductFilter();
    }

    changePage(page: number): void {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.page = page;
        this.loadMovements();
    }
}
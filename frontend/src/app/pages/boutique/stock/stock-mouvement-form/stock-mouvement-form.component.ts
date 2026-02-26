import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StockMovementService } from '../../../../shared/services/stock-movement.service';
import { ProductService } from '../../../../shared/services/product.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { Product } from '../../../../core/models/product.model';
import { StockMovementCreate } from '../../../../core/models/stock-movement.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import {SelectComponent} from "../../../../shared/components/form/select/select.component";

@Component({
    selector: 'app-stock-mouvement-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, SelectComponent],
    templateUrl: './stock-mouvement-form.component.html',
})
export class StockMouvementFormComponent implements OnInit {
    items: (StockMovementCreate & { productDetails?: Product })[] = [];
    boutiqueId = '';

    searchSubject = new Subject<string>();
    searchResults: Product[] = [];
    showResults = false;
    isSearching = false;
    searchMode: 'name' | 'sku' = 'name';

    isSaving = false;
    errorMessage = '';

    constructor(
        private stockService: StockMovementService,
        private productService: ProductService,
        private authService: AuthService,
        private router: Router,
        private toastService: ToastService
    ) {}

    ngOnInit(): void {
        const userHash = this.authService.userHash;
        if (userHash) {
            this.boutiqueId = userHash.boutiqueId || '';
        }

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (term.length < 2) {
                    this.searchResults = [];
                    this.showResults = false;
                    this.isSearching = false;
                    return of({ data: { items: [] } });
                }

                this.isSearching = true;
                this.showResults = false;

                const params: any = { isActive: true, boutique: this.boutiqueId };

                if (this.searchMode === 'sku') {
                    params['sku[regex]'] = term;
                    params['sku[options]'] = 'i';
                } else {
                    params['name[regex]'] = term;
                    params['name[options]'] = 'i';
                }

                return this.productService.getProducts(params);
            })
        ).subscribe((res: any) => {
            this.isSearching = false;
            this.searchResults = res?.data?.items || [];
            this.showResults = this.searchResults.length > 0;
        });
    }

    onProductSearch(event: any): void {
        this.searchSubject.next(event.target.value);
    }

    setSearchMode(mode: 'name' | 'sku'): void {
        this.searchMode = mode;
        this.searchResults = [];
        this.showResults = false;
        const searchInput = document.getElementById('productSearch') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
    }

    selectProduct(product: Product): void {
        this.items.push({
            product: product._id as string,
            type: 'IN',
            quantity: 1,
            note: '',
            productDetails: product
        });

        this.showResults = false;
        this.searchResults = [];
        const searchInput = document.getElementById('productSearch') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
    }

    removeItem(index: number): void {
        this.items.splice(index, 1);
    }

    setItemType(item: StockMovementCreate & { productDetails?: Product }, value: string): void {
        item.type = value as 'IN' | 'OUT';
    }

    // ── Stock after calculation ───────────────────────────────────
    getStockAfter(item: StockMovementCreate & { productDetails?: Product }): number {
        const stockReal = item.productDetails?.stockReal ?? 0;
        const qty = Number(item.quantity) || 0;
        return item.type === 'IN' ? stockReal + qty : stockReal - qty;
    }

    isStockAfterNegative(item: StockMovementCreate & { productDetails?: Product }): boolean {
        return item.type === 'OUT' && this.getStockAfter(item) < 0;
    }

    hasAnyNegativeStock(): boolean {
        return this.items.some(item => this.isStockAfterNegative(item));
    }

    get countIN(): number { return this.items.filter(i => i.type === 'IN').length; }
    get countOUT(): number { return this.items.filter(i => i.type === 'OUT').length; }

    // ── Submit ────────────────────────────────────────────────────
    submitMovements(): void {
        if (this.items.length === 0) {
            this.errorMessage = 'Please add at least one product.';
            return;
        }

        for (const item of this.items) {
            if (!item.quantity || item.quantity <= 0) {
                this.errorMessage = `Quantity for "${item.productDetails?.name}" must be greater than 0.`;
                return;
            }
            if (this.isStockAfterNegative(item)) {
                this.errorMessage = `Insufficient stock for "${item.productDetails?.name}". Stock after would be negative.`;
                return;
            }
        }

        this.isSaving = true;
        this.errorMessage = '';

        const payload: StockMovementCreate[] = this.items.map(item => ({
            product: item.product,
            type: item.type,
            quantity: item.quantity,
            note: item.note
        }));

        this.stockService.createStockMovements(this.boutiqueId, payload).subscribe({
            next: () => {
                this.isSaving = false;
                this.toastService.success('Success', 'Stock movements saved successfully');
                this.router.navigate(['/store/app/stock/mouvements']);
            },
            error: (err) => {
                this.isSaving = false;
                this.errorMessage = err.error?.message || 'An error occurred while saving movements.';
                this.toastService.error('Error', this.errorMessage);
            }
        });
    }
}
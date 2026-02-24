import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StockMovementService } from '../../../../shared/services/stock-movement.service';
import { ProductService } from '../../../../shared/services/product.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Product } from '../../../../core/models/product.model';
import { StockMovementCreate } from '../../../../core/models/stock-movement.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-stock-mouvement-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, ButtonComponent],
    templateUrl: './stock-mouvement-form.component.html',
})
export class StockMouvementFormComponent implements OnInit {
    items: (StockMovementCreate & { productDetails?: Product })[] = [];
    boutiqueId = '';

    searchSubject = new Subject<string>();
    searchResults: Product[] = [];
    showResults = false;

    isSaving = false;
    errorMessage = '';

    constructor(
        private stockService: StockMovementService,
        private productService: ProductService,
        private authService: AuthService,
        private router: Router,
        private toastService: ToastService
    ) { }

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
                    return [];
                }
                return this.productService.getProducts({
                    'name[regex]': term,
                    'name[options]': 'i',
                    isActive: true,
                    boutique: this.boutiqueId
                });
            })
        ).subscribe((res: any) => {
            this.searchResults = res?.data?.items || [];
            this.showResults = this.searchResults.length > 0;
        });
    }

    onProductSearch(event: any): void {
        this.searchSubject.next(event.target.value);
    }

    selectProduct(product: Product): void {
        // Check if already in list? Maybe not, could have same product with different reasons
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

    submitMovements(): void {
        if (this.items.length === 0) {
            this.errorMessage = 'Veuillez ajouter au moins un produit.';
            return;
        }

        // Validation: Quantité positive
        for (const item of this.items) {
            if (!item.quantity || item.quantity <= 0) {
                this.errorMessage = `La quantité pour ${item.productDetails?.name} doit être positive.`;
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
            next: (res) => {
                this.isSaving = false;
                this.toastService.success('Succès', 'Mouvements enregistrés avec succès');
                this.router.navigate(['/store/app/stock/mouvements']);
            },
            error: (err) => {
                this.isSaving = false;
                this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement des mouvements.';
                // If it's the "Manaova inventaire" error, show as warning/error
                this.toastService.error('Erreur', this.errorMessage);
            }
        });
    }
}

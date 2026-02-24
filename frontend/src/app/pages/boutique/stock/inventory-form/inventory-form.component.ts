import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../../../shared/services/inventory.service';
import { ProductService } from '../../../../shared/services/product.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { Product } from '../../../../core/models/product.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-inventory-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, ButtonComponent],
    templateUrl: './inventory-form.component.html',
})
export class InventoryFormComponent implements OnInit {
    items: { product: string; countedQuantity: number; stockBefore: number; productDetails: Product }[] = [];
    boutiqueId = '';
    note = '';

    searchSubject = new Subject<string>();
    searchResults: Product[] = [];
    showResults = false;

    isSaving = false;
    errorMessage = '';

    constructor(
        private inventoryService: InventoryService,
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
        // Avoid duplicates in the same inventory session
        const exists = this.items.find(item => item.product === product._id);
        if (exists) {
            this.toastService.warning('Attention', `${product.name} est déjà dans la liste.`);
        } else {
            this.items.push({
                product: product._id as string,
                countedQuantity: product.stock || 0,
                stockBefore: product.stock || 0,
                productDetails: product
            });
        }

        this.showResults = false;
        this.searchResults = [];
        const searchInput = document.getElementById('productSearch') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
    }

    removeItem(index: number): void {
        this.items.splice(index, 1);
    }

    submitInventory(): void {
        if (this.items.length === 0) {
            this.errorMessage = 'Veuillez ajouter au moins un produit.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';

        const payload = this.items.map(item => ({
            product: item.product,
            countedQuantity: item.countedQuantity,
            stockBefore: item.stockBefore
        }));

        this.inventoryService.createInventory(this.boutiqueId, this.note, payload).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.toastService.success('Succès', 'Inventaire enregistré avec succès');
                this.router.navigate(['/store/app/stock/inventaire']);
            },
            error: (err) => {
                this.isSaving = false;
                this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement de l\'inventaire.';
                this.toastService.error('Erreur', this.errorMessage);
            }
        });
    }
}

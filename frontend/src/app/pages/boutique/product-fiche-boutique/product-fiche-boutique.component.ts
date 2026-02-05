import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute} from "@angular/router";
import {StoreService} from "../../../shared/services/store.service";
import {ProductSkeletonComponent} from "../../../shared/components/product/product-skeleton/product-skeleton.component";
import {ProductErrorComponent} from "../../../shared/components/product/product-error/product-error.component";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";

interface Category {
    _id: string;
    name: string;
}

interface Product {
    _id: string;
    boutique: string;
    name: string;
    description: string;
    regularPrice: number;
    salePrice: number;
    sku: string;
    stock: number;
    minOrderQty: number;
    maxOrderQty: number;
    category: Category;
    tags: string[];
    images: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

@Component({
    selector: 'app-product-fiche-boutique',
    imports: [CommonModule, ProductSkeletonComponent, ProductErrorComponent, PageBreadcrumbComponent],
    templateUrl: './product-fiche-boutique.component.html',
    styleUrls: ['./product-fiche.css']
})
export class ProductFicheBoutiqueComponent implements OnInit {

    product!: Product;
    isLoading = false;
    errorMessage: string | null = null;

    selectedImageIndex: number = 0;
    showCopiedSku: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private storeService: StoreService
    ) {}

    ngOnInit(): void {
        const productId = this.route.snapshot.paramMap.get('id');

        if (productId) {
            this.loadProduct(productId);
        }
    }

    loadProduct(productId: string): void {
        this.isLoading = true;
        this.errorMessage = null;
        // this.product = null;

        this.storeService.getProductById(productId).subscribe({
            next: (res: any) => {
                this.isLoading = false;

                if (!res.success || !res.data) {
                    this.errorMessage = res.message || 'Produit introuvable';
                    return;
                }

                this.product = res.data;
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage =
                    err?.error?.message || 'Erreur lors du chargement du produit';
            }
        });
    }


    // ════════════════════════════════════════════
    //  IMAGE GALLERY
    // ════════════════════════════════════════════

    get selectedImage(): string {
        return this.product.images[this.selectedImageIndex];
    }

    selectImage(index: number): void {
        this.selectedImageIndex = index;
    }

    nextImage(): void {
        this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
    }

    previousImage(): void {
        this.selectedImageIndex =
            this.selectedImageIndex === 0
                ? this.product.images.length - 1
                : this.selectedImageIndex - 1;
    }

    // ════════════════════════════════════════════
    //  COMPUTED
    // ════════════════════════════════════════════

    get discountPercent(): number {
        if (this.product.regularPrice > this.product.salePrice) {
            return Math.round(
                ((this.product.regularPrice - this.product.salePrice) / this.product.regularPrice) * 100
            );
        }
        return 0;
    }

    get stockStatus(): 'in-stock' | 'low-stock' | 'out-of-stock' {
        if (this.product.stock === 0) return 'out-of-stock';
        if (this.product.stock <= 10) return 'low-stock';
        return 'in-stock';
    }

    // ════════════════════════════════════════════
    //  BOUTIQUE ACTIONS (Gestion)
    // ════════════════════════════════════════════

    editProduct(): void {
        console.log('Edit product:', this.product._id);
        // → Redirection vers formulaire d'édition ou modal
    }

    deleteProduct(): void {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${this.product.name}" ?`)) {
            console.log('Delete product:', this.product._id);
            // → Appel API de suppression
        }
    }

    toggleActiveStatus(): void {
        console.log('Toggle active status:', !this.product.isActive);
        // → Appel API pour activer/désactiver
        // this.product.isActive = !this.product.isActive;
    }

    copySku(): void {
        navigator.clipboard.writeText(this.product.sku).then(() => {
            this.showCopiedSku = true;
            setTimeout(() => {
                this.showCopiedSku = false;
            }, 2000);
        });
    }

    duplicateProduct(): void {
        console.log('Duplicate product:', this.product._id);
        // → Créer une copie du produit
    }

    // ════════════════════════════════════════════
    //  UTILITIES
    // ════════════════════════════════════════════

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from "@angular/router";
import {StoreService} from "../../../shared/services/store.service";
import {Product} from "../../../core/models/product.model";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";

@Component({
    selector: 'app-product-fiche-user',
    imports: [CommonModule, PageBreadcrumbComponent],
    templateUrl: './product-fiche-user.component.html',
    styleUrls: ['./product-fiche-user.css']
})
export class ProductFicheUserComponent implements OnInit {
    pageTitle: string = 'Product details';
    product: Product | null = null;
    idStore: string = '';

    selectedImageIndex: number = 0;
    quantity: number = 1;
    showCopiedSku: boolean = false;

    constructor(private route : ActivatedRoute, private router : Router, private storeService : StoreService ) {
    }

    ngOnInit(): void {
        const idStore = this.route.snapshot.paramMap.get('idStore');
        const idProduct = this.route.snapshot.paramMap.get('idProduct');

        if (idStore === null) {
            this.router.navigate(['/v1/stores']);
            return;
        } else if (idProduct === null) {
            this.router.navigate([`/v1/stores/${idStore}`]);
            return;
        }

        this.idStore = idStore;
        this.loadProduct(idProduct, idStore);
    }

    loadProduct(productId : string, storeId : string): void {
        this.storeService.getProductById(productId).subscribe({
            next: (res: any) => {
                if (!res.success || !res.data) {
                    // this.errorMessage = res.message || 'Product not found';
                    return;
                }

                if (res.data.boutique != storeId) {
                    throw new Error("Product does not belong to the specified store");
                }

                this.product = res.data;

                setTimeout(() => {
                    this.animateImageEntry();
                }, 100);
            },
            error: (err) => {
                // this.errorMessage =
                //     err?.error?.message || 'Error fetching product';
                console.error(err);
            }
        });
    }

    get p(): Product {
        if (!this.product) {
            throw new Error('Product not loaded yet');
        }
        return this.product;
    }


    // ════════════════════════════════════════════
    //  IMAGE GALLERY
    // ════════════════════════════════════════════

    get selectedImage(): string {
        return this.p.images[this.selectedImageIndex];
    }

    selectImage(index: number): void {
        if (index !== this.selectedImageIndex) {
            this.selectedImageIndex = index;
            this.animateImageEntry();
        }
    }

    nextImage(): void {
        this.selectedImageIndex = (this.selectedImageIndex + 1) % this.p.images.length;
        this.animateImageEntry();
    }

    previousImage(): void {
        this.selectedImageIndex =
            this.selectedImageIndex === 0
                ? this.p.images.length - 1
                : this.selectedImageIndex - 1;
        this.animateImageEntry();
    }

    private animateImageEntry(): void {
        // Simple fade-in effect handled by CSS
    }

    // ════════════════════════════════════════════
    //  PRICE & DISCOUNT
    // ════════════════════════════════════════════

    get discountPercent(): number {
        if (this.p.regularPrice > this.p.salePrice) {
            return Math.round(
                ((this.p.regularPrice - this.p.salePrice) / this.p.regularPrice) * 100
            );
        }
        return 0;
    }

    get totalPrice(): number {
        return this.p.salePrice * this.quantity;
    }

    get savings(): number {
        return (this.p.regularPrice - this.p.salePrice) * this.quantity;
    }

    // ════════════════════════════════════════════
    //  QUANTITY
    // ════════════════════════════════════════════

    incrementQuantity(): void {
        if (this.quantity < this.p.maxOrderQty && this.quantity < this.p.stock) {
            this.quantity++;
        }
    }

    decrementQuantity(): void {
        if (this.quantity > this.p.minOrderQty) {
            this.quantity--;
        }
    }

    get canIncrement(): boolean {
        return this.quantity < this.p.maxOrderQty && this.quantity < this.p.stock;
    }

    get canDecrement(): boolean {
        return this.quantity > this.p.minOrderQty;
    }

    // ════════════════════════════════════════════
    //  STOCK STATUS
    // ════════════════════════════════════════════

    get stockStatus(): 'in-stock' | 'low-stock' | 'out-of-stock' {
        if (this.p.stock === 0) return 'out-of-stock';
        if (this.p.stock <= 10) return 'low-stock';
        return 'in-stock';
    }

    get stockLabel(): string {
        switch (this.stockStatus) {
            case 'out-of-stock': return 'Out of Stock';
            case 'low-stock': return `Only ${this.p.stock} left!`;
            case 'in-stock': return `In Stock (${this.p.stock} available)`;
        }
    }

    // ════════════════════════════════════════════
    //  ACTIONS
    // ════════════════════════════════════════════

    addToCart(): void {
        console.log('Add to cart:', {
            productId: this.p._id,
            quantity: this.quantity,
            price: this.totalPrice
        });
        // → Votre logique d'ajout au panier
    }

    buyNow(): void {
        console.log('Buy now:', {
            productId: this.p._id,
            quantity: this.quantity
        });
        // → Redirection vers checkout
    }

    copySku(): void {
        navigator.clipboard.writeText(this.p.sku).then(() => {
            this.showCopiedSku = true;
            setTimeout(() => {
                this.showCopiedSku = false;
            }, 2000);
        });
    }

    shareProduct(): void {
        if (navigator.share) {
            navigator.share({
                title: this.p.name,
                text: this.p.description,
                url: window.location.href
            });
        } else {
            // Fallback: copier le lien
            navigator.clipboard.writeText(window.location.href);
        }
    }

    toggleFavorite(): void {
        console.log('Toggle favorite');
        // → Votre logique de favoris
    }

    // ════════════════════════════════════════════
    //  UTILITIES
    // ════════════════════════════════════════════

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
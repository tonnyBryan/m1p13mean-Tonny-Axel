import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from "@angular/router";
import {StoreService} from "../../../shared/services/store.service";
import {Product} from "../../../core/models/product.model";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { CommandeService } from '../../../shared/services/commande.service';
import { AuthService } from '../../../shared/services/auth.service';
import {ToastService} from "../../../shared/services/toast.service";

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

    // UI states for add-to-cart flow
    isAddingToCart: boolean = false;
    addedToCartSuccess: boolean = false;
    addToCartErrorMessage: string | null = null;

    constructor(private route : ActivatedRoute, private router : Router, private storeService : StoreService , private commandeService: CommandeService, private toast: ToastService) {
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
                    this.router.navigate(['/v1/stores']);
                    return;
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
        // this.toast.warning('Low stock', 'Only 3 items remaining!');
        // this.toast.success('Order placed!', 'Your order has been successfully placed.');
        // this.toast.error('Payment failed', 'Please check your card details and try again.');
        // this.toast.info('New feature', 'Check out our new dark mode!');
        // this.toast.show('info', 'Item added to cart', 'View your cart now', 0, 'top-right', {
        //     label: 'View Cart',
        //     onClick: () => this.router.navigate(['/cart'])
        // });

        
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
        if (!this.product) return;
        const productId = this.product._id;
        const qty = this.quantity > 0 ? this.quantity : 1;

        // Reset states
        this.isAddingToCart = true;
        this.addedToCartSuccess = false;
        this.addToCartErrorMessage = null;

        this.commandeService.addToCart(productId, qty).subscribe({
            next: (res) => {
                this.isAddingToCart = false;
                if (res?.success) {
                    this.addedToCartSuccess = true;
                    this.commandeService.refreshDraftCount().subscribe();

                    this.toast.show('info', 'Item added to cart', 'View your cart now', 0, 'bottom-right', {
                        label: 'View Cart',
                        onClick: () => this.router.navigate(['/cart'])
                    });

                    // Reset after 3 seconds
                    setTimeout(() => {
                        this.addedToCartSuccess = false;
                    }, 3000);

                    console.log('Added to cart', res.data);
                } else {
                    const msg = res?.message || 'Unable to add to cart';
                    this.addToCartErrorMessage = msg;
                    setTimeout(() => {
                        this.addToCartErrorMessage = null;
                    }, 3000);
                }
            },
            error: (err) => {
                this.isAddingToCart = false;
                console.error('Add to cart error:', err);
                const message = err?.error?.message || err?.message || 'Error adding to cart';
                this.addToCartErrorMessage = message;
                setTimeout(() => {
                    this.addToCartErrorMessage = null;
                }, 3000);
            }
        });
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
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
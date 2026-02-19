import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from "@angular/router";
import {StoreService} from "../../../shared/services/store.service";
import {Product} from "../../../core/models/product.model";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { CommandeService } from '../../../shared/services/commande.service';
import {ToastService} from "../../../shared/services/toast.service";
import {SessionService} from "../../../shared/services/session.service";
import {WishlistService} from "../../../shared/services/wishlist.service";
import {ProductNoteUserComponent} from "./product-note-user/product-note-user.component";

@Component({
    selector: 'app-product-fiche-user',
    imports: [CommonModule, PageBreadcrumbComponent, ProductNoteUserComponent],
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

    isWishlisted = false;
    isTogglingWishlist = false;
    showHeartPulse = false;
    showHeartParticles = false;

    constructor(private route : ActivatedRoute, private router : Router, private storeService : StoreService , private commandeService: CommandeService, private toast: ToastService, private session : SessionService, private wishlistService: WishlistService ) {
    }

    ngOnInit(): void {
        const idStore = this.route.snapshot.paramMap.get('idStore');
        const idProduct = this.route.snapshot.paramMap.get('idProduct');

        if (idStore === null) {
            this.toast.warning('Error','Invalid URL: missing store ID');
            this.router.navigate(['/v1/stores']);
            return;
        } else if (idProduct === null) {
            this.router.navigate([`/v1/stores/${idStore}`]);
            this.toast.warning('Error','Invalid URL: missing product ID');
            return;
        }

        this.idStore = idStore;
        this.loadProduct(idProduct, idStore);
    }

    toggleFavorite(): void {
        if (!this.product || this.isTogglingWishlist) return;

        this.isTogglingWishlist = true;

        if (this.isWishlisted) {
            // Remove animation
            this.showHeartPulse = true;
            setTimeout(() => this.showHeartPulse = false, 600);

            this.wishlistService.removeFromWishlist(this.product._id).subscribe({
                next: () => {
                    this.isWishlisted = false;
                    this.isTogglingWishlist = false;
                },
                error: () => {
                    this.isTogglingWishlist = false;
                    this.toast.error('Error', 'Failed to remove from wishlist');
                }
            });
        } else {
            // Add animation with particles
            this.showHeartPulse = true;
            this.showHeartParticles = true;

            setTimeout(() => {
                this.showHeartPulse = false;
                this.showHeartParticles = false;
            }, 600);

            this.wishlistService.addToWishlist(this.product._id).subscribe({
                next: (res) => {
                    this.isWishlisted = true;
                    this.isTogglingWishlist = false;
                    this.toast.success('Success', 'Added to wishlist');
                },
                error: (err) => {
                    this.isTogglingWishlist = false;
                    this.toast.error('Error', err.error?.message || 'Failed to add to wishlist');
                }
            });
        }
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
                if (this.product) {
                    this.isWishlisted = this.product.isMyWishlist;
                }

                setTimeout(() => {
                    this.animateImageEntry();
                }, 100);
            },
            error: (err) => {
                console.error(err);
                if (err.error && err.error.message) {
                    this.toast.error('Error',err.error.message,0);
                } else {
                    this.toast.error('Error','An error occurred while fetching product',0);
                }
            }
        });
    }

    get p(): Product {
        if (!this.product) {
            throw new Error('Product not loaded yet');
        }
        return this.product;
    }

    get isEmailVerified(): boolean {
        return this.session.currentUser?.isEmailVerified === true;
    }

    goToVerifyEmail(): void {
        this.router.navigate(['/v1/verify-email']);
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
        if (this.quantity < this.p.maxOrderQty && this.quantity < this.p.stockReal) {
            this.quantity++;
        }
    }

    decrementQuantity(): void {
        if (this.quantity > this.p.minOrderQty) {
            this.quantity--;
        }
    }

    get canIncrement(): boolean {
        return this.quantity < this.p.maxOrderQty && this.quantity < this.p.stockReal;
    }

    get canDecrement(): boolean {
        return this.quantity > this.p.minOrderQty;
    }

    // ════════════════════════════════════════════
    //  STOCK STATUS
    // ════════════════════════════════════════════

    get stockStatus(): 'in-stock' | 'low-stock' | 'out-of-stock' {
        if (this.p.stockReal === 0) return 'out-of-stock';
        if (this.p.stockReal <= 10) return 'low-stock';
        return 'in-stock';
    }

    get stockLabel(): string {
        switch (this.stockStatus) {
            case 'out-of-stock': return 'Out of Stock';
            case 'low-stock': return `Only ${this.p.stockReal} left!`;
            case 'in-stock': return `In Stock (${this.p.stockReal} available)`;
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
        if (!this.product) return;
        const productId = this.product._id;
        const qty = this.quantity > 0 ? this.quantity : 1;

        this.commandeService.directBuy(productId, qty).subscribe({
            next: (res) => {
                if (res?.success) {
                    this.commandeService.refreshDraftCount().subscribe();
                    console.log('direct buy', res.data);
                    this.router.navigate(['/v1/cart/checkout']);
                }
            },
            error: (err) => {
                console.error('buy error:', err);
                const message = err?.error?.message || err?.message || 'Error buying item';
                this.toast.error("Error", message);
            }
        });
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
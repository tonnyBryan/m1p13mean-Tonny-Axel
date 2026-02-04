import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    selector: 'app-product-fiche-user',
    imports: [CommonModule],
    templateUrl: './product-fiche-user.component.html',
    styleUrls: ['./product-fiche-user.css']
})
export class ProductFicheUserComponent implements OnInit {

    product: Product = {
        _id: "65f1c2a9e12b4c0012a45abc",
        boutique: "65f0a1b8d92c3f0011b22aaa",
        name: "Chaussure Sport Air Max",
        description: "Chaussure de sport confortable, idéale pour la course et l'usage quotidien.",
        regularPrice: 120,
        salePrice: 95,
        sku: "AIRMAX-2025-BLK-42",
        stock: 48,
        minOrderQty: 1,
        maxOrderQty: 3,
        category: {
            _id: "65e9b8d21a4c7f0019cc1122",
            name: "Chaussures"
        },
        tags: ["sport", "chaussure", "airmax", "nike"],
        images: [
            "https://cdn.maboutique.com/products/airmax-1.jpg",
            "https://cdn.maboutique.com/products/airmax-2.jpg",
            "https://cdn.maboutique.com/products/airmax-3.jpg"
        ],
        isActive: true,
        createdAt: "2025-02-04T10:30:00.000Z",
        updatedAt: "2025-02-04T10:30:00.000Z"
    };

    selectedImageIndex: number = 0;
    quantity: number = 1;
    showCopiedSku: boolean = false;

    ngOnInit(): void {
        // Simulate image loading animation
        setTimeout(() => {
            this.animateImageEntry();
        }, 100);
    }

    // ════════════════════════════════════════════
    //  IMAGE GALLERY
    // ════════════════════════════════════════════

    get selectedImage(): string {
        return this.product.images[this.selectedImageIndex];
    }

    selectImage(index: number): void {
        if (index !== this.selectedImageIndex) {
            this.selectedImageIndex = index;
            this.animateImageEntry();
        }
    }

    nextImage(): void {
        this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
        this.animateImageEntry();
    }

    previousImage(): void {
        this.selectedImageIndex =
            this.selectedImageIndex === 0
                ? this.product.images.length - 1
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
        if (this.product.regularPrice > this.product.salePrice) {
            return Math.round(
                ((this.product.regularPrice - this.product.salePrice) / this.product.regularPrice) * 100
            );
        }
        return 0;
    }

    get totalPrice(): number {
        return this.product.salePrice * this.quantity;
    }

    get savings(): number {
        return (this.product.regularPrice - this.product.salePrice) * this.quantity;
    }

    // ════════════════════════════════════════════
    //  QUANTITY
    // ════════════════════════════════════════════

    incrementQuantity(): void {
        if (this.quantity < this.product.maxOrderQty && this.quantity < this.product.stock) {
            this.quantity++;
        }
    }

    decrementQuantity(): void {
        if (this.quantity > this.product.minOrderQty) {
            this.quantity--;
        }
    }

    get canIncrement(): boolean {
        return this.quantity < this.product.maxOrderQty && this.quantity < this.product.stock;
    }

    get canDecrement(): boolean {
        return this.quantity > this.product.minOrderQty;
    }

    // ════════════════════════════════════════════
    //  STOCK STATUS
    // ════════════════════════════════════════════

    get stockStatus(): 'in-stock' | 'low-stock' | 'out-of-stock' {
        if (this.product.stock === 0) return 'out-of-stock';
        if (this.product.stock <= 10) return 'low-stock';
        return 'in-stock';
    }

    get stockLabel(): string {
        switch (this.stockStatus) {
            case 'out-of-stock': return 'Out of Stock';
            case 'low-stock': return `Only ${this.product.stock} left!`;
            case 'in-stock': return `In Stock (${this.product.stock} available)`;
        }
    }

    // ════════════════════════════════════════════
    //  ACTIONS
    // ════════════════════════════════════════════

    addToCart(): void {
        console.log('Add to cart:', {
            productId: this.product._id,
            quantity: this.quantity,
            price: this.totalPrice
        });
        // → Votre logique d'ajout au panier
    }

    buyNow(): void {
        console.log('Buy now:', {
            productId: this.product._id,
            quantity: this.quantity
        });
        // → Redirection vers checkout
    }

    copySku(): void {
        navigator.clipboard.writeText(this.product.sku).then(() => {
            this.showCopiedSku = true;
            setTimeout(() => {
                this.showCopiedSku = false;
            }, 2000);
        });
    }

    shareProduct(): void {
        if (navigator.share) {
            navigator.share({
                title: this.product.name,
                text: this.product.description,
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
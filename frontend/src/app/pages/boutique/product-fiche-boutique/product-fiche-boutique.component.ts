import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute} from "@angular/router";
import {StoreService} from "../../../shared/services/store.service";
import {ProductSkeletonComponent} from "../../../shared/components/product/product-skeleton/product-skeleton.component";
import {ProductErrorComponent} from "../../../shared/components/product/product-error/product-error.component";
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ProductService } from '../../../shared/services/product.service';
import {Product} from "../../../core/models/product.model";
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { FormsModule } from '@angular/forms';


@Component({
    selector: 'app-product-fiche-boutique',
    imports: [CommonModule, ProductSkeletonComponent, ProductErrorComponent, PageBreadcrumbComponent, ModalComponent, ButtonComponent, LabelComponent, InputFieldComponent, FormsModule],
    templateUrl: './product-fiche-boutique.component.html',
    styleUrls: ['./product-fiche.css']
})
export class ProductFicheBoutiqueComponent implements OnInit {
    pageTitle = 'Product Overview';

    product!: Product;
    isLoading = false;
    errorMessage: string | null = null;

    selectedImageIndex: number = 0;
    showCopiedSku: boolean = false;

    // Edit modal state
    isEditModalOpen: boolean = false;
    // form fields for edit
    editName: string = '';
    editDescription: string = '';
    editRegularPrice: number | null = null;
    editSalePrice: number | null = null;
    editMinOrderQty: number = 1;
    editMaxOrderQty: number = 1;
    editSku: string = '';

    // tags for edit
    editTags: string[] = [];
    editCurrentTag: string = '';

    // images for edit (only URLs supported here)
    editPreviewImages: { url: string; source: 'url' }[] = [];
    editImageUrls: string[] = [];
    editCurrentImageUrl: string = '';

    editSubmitted: boolean = false;
    editLoading: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private storeService: StoreService,
        private productService: ProductService
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

    // image gallery helpers (existing)
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

    // ═════════════════════
    // Edit product modal
    // ═════════════════════

    editProduct(): void {
        // Open modal and prefill fields
        this.openEditModal();
    }

    openEditModal(): void {
        if (!this.product) return;

        this.editName = this.product.name || '';
        this.editDescription = this.product.description || '';
        this.editRegularPrice = this.product.regularPrice ?? null;
        this.editSalePrice = this.product.salePrice ?? null;
        this.editMinOrderQty = this.product.minOrderQty ?? 1;
        this.editMaxOrderQty = this.product.maxOrderQty ?? this.editMinOrderQty;
        this.editSku = this.product.sku || '';

        this.editTags = Array.isArray(this.product.tags) ? [...this.product.tags] : [];
        this.editCurrentTag = '';

        this.editPreviewImages = (Array.isArray(this.product.images) ? this.product.images.map(url => ({ url, source: 'url' as const })) : []);
        this.editImageUrls = this.editPreviewImages.map(i => i.url);
        this.editCurrentImageUrl = '';

        this.editSubmitted = false;
        this.isEditModalOpen = true;
    }

    closeEditModal(): void {
        this.isEditModalOpen = false;
    }

    // tags
    addEditTag(): void {
        const t = this.editCurrentTag.trim().toLowerCase();
        if (t && !this.editTags.includes(t)) this.editTags.push(t);
        this.editCurrentTag = '';
    }

    onEditTagKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            this.addEditTag();
        }
    }

    removeEditTag(index: number): void {
        this.editTags.splice(index, 1);
    }

    // images by URL (edit supports URL only to keep backend simple)
    addEditImageUrl(): void {
        const url = this.editCurrentImageUrl.trim();
        if (!url) return;
        if (!this.editPreviewImages.some(img => img.url === url)) {
            this.editPreviewImages.push({ url, source: 'url' });
            this.editImageUrls.push(url);
        }
        this.editCurrentImageUrl = '';
    }

    onEditImageUrlKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addEditImageUrl();
        }
    }

    removeEditImage(index: number): void {
        const img = this.editPreviewImages[index];
        if (!img) return;
        const urlIndex = this.editImageUrls.indexOf(img.url);
        if (urlIndex > -1) this.editImageUrls.splice(urlIndex, 1);
        this.editPreviewImages.splice(index, 1);
    }

    // validate
    get isEditFormValid(): boolean {
        return (
            this.editName.trim().length > 0 &&
            this.editDescription.trim().length > 0 &&
            this.editRegularPrice !== null &&
            this.editRegularPrice > 0 &&
            this.editMinOrderQty >= 1 &&
            this.editMaxOrderQty >= this.editMinOrderQty &&
            this.editPreviewImages.length > 0
        );
    }

    saveEdit(): void {
        this.editSubmitted = true;
        if (!this.isEditFormValid) return;

        this.editLoading = true;

        const payload: any = {
            name: this.editName.trim(),
            description: this.editDescription.trim(),
            regularPrice: this.editRegularPrice,
            salePrice: this.editSalePrice,
            minOrderQty: this.editMinOrderQty,
            maxOrderQty: this.editMaxOrderQty,
            sku: this.editSku,
            tags: this.editTags,
            images: this.editPreviewImages.map(i => i.url)
        };

        this.productService.updateProduct(this.product._id, payload).subscribe({
            next: (res: any) => {
                this.editLoading = false;
                if (res?.success && res?.data) {
                    this.product = res.data;
                    this.isEditModalOpen = false;
                } else {
                    alert(res?.message || 'Failed to update product');
                }
            },
            error: (err) => {
                this.editLoading = false;
                alert(err?.error?.message || 'Error updating product');
            }
        });
    }

    deleteProduct(): void {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${this.product.name}" ?`)) {
            console.log('Delete product:', this.product._id);
            // → Appel API de suppression
        }
    }

    toggleActiveStatus(): void {
        const newStatus = !this.product.isActive;
        const previous = this.product.isActive;
        this.product.isActive = newStatus;

        this.productService.toggleActive(this.product._id, newStatus).subscribe({
            next: (res: any) => {
                if (!res?.success) {
                    this.product.isActive = previous;
                    console.error('Failed to toggle product status', res);
                }
            },
            error: (err) => {
                this.product.isActive = previous;
                console.error('Error toggling product status', err);
            }
        });
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

    toggleSalePrice(): void {
        const newIsSale = !this.product.isSale;
        const previous = this.product.isSale;
        // Optimistic update
        this.product.isSale = newIsSale;

        this.productService.toggleSalePrice(this.product._id, newIsSale).subscribe({
            next: (res: any) => {
                if (!res?.success) {
                    this.product.isSale = previous;
                    console.error('Failed to toggle sale flag', res);
                    return;
                }
            },
            error: (err) => {
                this.product.isSale = previous;
                console.error('Error toggling sale flag', err);
            }
        });
    }

}


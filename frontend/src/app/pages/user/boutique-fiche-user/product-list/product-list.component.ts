import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../shared/services/product.service';
import { Router } from '@angular/router';
import {ToastService} from "../../../../shared/services/toast.service";
import {RatingStarComponent} from "../../../../shared/components/common/rating-star/rating-star.component";
import {CategoryService} from "../../../../shared/services/category.service";

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RatingStarComponent],
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
    @Input() boutiqueId: string = '';

    products: any[] = [];
    isLoading = false;

    // Pagination
    currentPage = 1;
    totalPages = 0;
    totalDocs = 0;
    itemsPerPage = 12;

    // Filters
    searchTerm = '';
    sortBy = '-createdAt';
    onSaleOnly = false;
    minPrice: number | null = null;
    maxPrice: number | null = null;
    minRating: number = 0;

    categories: any[] = [];
    selectedCategories: string[] = [];

    // Filter panel state
    showFilters = false;

    constructor(
        private productService: ProductService,
        private router: Router,
        private toast : ToastService,
        private categoryService: CategoryService,
    ) {}

    ngOnInit(): void {
        if (this.boutiqueId) {
            this.loadCategories();
            this.loadProducts();
        }
    }

    loadCategories(): void {
        this.categoryService.getCategories({ boutique: this.boutiqueId, limit: 100, sort: 'name' , isActive: true  }).subscribe({
            next: (res) => { if (res.success) this.categories = res.data.items || []; },
            error: () => {}
        });
    }

    loadProducts(): void {
        this.isLoading = true;

        const params: any = {
            boutique: this.boutiqueId,
            isActive: true,
            page: this.currentPage,
            limit: this.itemsPerPage,
            sort: this.sortBy
        };

        if (this.searchTerm) {
            params['name[regex]'] = this.searchTerm;
            params['name[options]'] = 'i';
        }

        if (this.onSaleOnly) {
            params.isSale = true;
        }

        if (this.selectedCategories.length > 0) {
            params['category[in]'] = this.selectedCategories.join(',');
        }

        if (this.minPrice !== null && this.minPrice > 0) {
            params['minPrice'] = this.minPrice;
        }

        if (this.maxPrice !== null && this.maxPrice > 0) {
            params['maxPrice'] = this.maxPrice;
        }

        if (this.minRating && this.minRating > 0) {
            params['avgRating[gte]'] = this.minRating;
        }

        this.productService.getProducts(params).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.success && res?.data) {
                    this.products = res.data.items || [];
                    console.log(this.products);
                    const pagination = res.data.pagination || {};
                    this.currentPage = pagination.page || 1;
                    this.totalDocs = pagination.totalDocs || 0;
                    this.totalPages = pagination.totalPages || 0;
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading products:', err);
                if (err.error && err.error.message) {
                    this.toast.error('Error',err.error.message, 0);
                } else {
                    this.toast.error('Error','An error occurred while fetching products', 0);
                }
            }
        });
    }

    onCategoryChange(catId: string): void {
        if (catId === 'all') {
            this.selectedCategories = [];
        } else {
            const idx = this.selectedCategories.indexOf(catId);
            if (idx === -1) {
                this.selectedCategories.push(catId);
            } else {
                this.selectedCategories.splice(idx, 1);
            }
        }
        this.currentPage = 1;
        this.loadProducts();
    }

    isCategorySelected(catId: string): boolean {
        return this.selectedCategories.includes(catId);
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadProducts();
    }

    onSortChange(sort: string): void {
        this.sortBy = sort;
        this.currentPage = 1;
        this.loadProducts();
    }

    toggleSaleFilter(): void {
        this.onSaleOnly = !this.onSaleOnly;
        this.currentPage = 1;
        this.loadProducts();
    }

    applyPriceFilter(): void {
        this.currentPage = 1;
        this.loadProducts();
    }

    setMinRating(rating: number): void {
        this.minRating = rating;
        this.currentPage = 1;
        // now send the filter to the API
        this.loadProducts();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.onSaleOnly = false;
        this.minPrice = null;
        this.maxPrice = null;
        this.minRating = 0;
        this.sortBy = '-createdAt';
        this.currentPage = 1;
        this.selectedCategories = [];
        this.loadProducts();
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    calculateDiscount(product: any): number {
        if (!product.isSale || !product.salePrice || !product.regularPrice) return 0;
        const discount = ((product.regularPrice - product.salePrice) / product.regularPrice) * 100;
        return Math.round(discount);
    }

    getPrice(product: any): number {
        return product.isSale && product.salePrice ? product.salePrice : product.regularPrice;
    }

    viewProduct(productId: string): void {
        this.router.navigate(['/v1/stores', this.boutiqueId, 'products', productId]);
    }

    // Use dynamic avgRating from product
    getProductRating(product: any): number {
        return product?.avgRating ? Math.round(product.avgRating) : 0;
    }

    getProductVotes(product: any): string {
        const nbVote = product?.totalRatings || 0;

        if (nbVote > 0) {
            return nbVote + (nbVote === 1 ? ' person rated' : ' people rated');
        }

        return 'No ratings yet';
    }


    protected readonly Math = Math;
}
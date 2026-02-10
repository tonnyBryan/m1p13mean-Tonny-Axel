import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../shared/services/product.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
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
    sortBy = '-createdAt'; // newest first
    onSaleOnly = false;

    constructor(
        private productService: ProductService,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (this.boutiqueId) {
            this.loadProducts();
        }
    }

    loadProducts(): void {
        this.isLoading = true;

        const params: any = {
            boutique: this.boutiqueId,
            isActive: true, // Only show active products
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

        this.productService.getProducts(params).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.success && res?.data) {
                    this.products = res.data.items || [];
                    const pagination = res.data.pagination || {};
                    this.currentPage = pagination.page || 1;
                    this.totalDocs = pagination.totalDocs || 0;
                    this.totalPages = pagination.totalPages || 0;
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading products:', err);
            }
        });
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

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProducts();
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

    addToCart(product: any): void {
        // TODO: Implement add to cart functionality
        console.log('Add to cart:', product);
        alert(`Added "${product.name}" to cart!`);
    }

    viewProduct(productId: string): void {

        this.router.navigate([
            '/v1/stores',
            this.boutiqueId,
            'products',
            productId
        ]);
    }

}
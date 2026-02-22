import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PageBreadcrumbComponent} from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';
import {ActivatedRoute, Router} from '@angular/router';
import {ProductService} from '../../../shared/services/product.service';
import {FormsModule} from '@angular/forms';
import {Product} from "../../../core/models/product.model";

@Component({
    selector: 'product-list-boutique',
    standalone: true,
    imports: [
        CommonModule,
        PageBreadcrumbComponent,
        ButtonComponent,
        FormsModule
    ],
    templateUrl: './product-list-boutique.component.html',
    styles: ``
})
export class ProductListBoutiqueComponent implements OnInit {
    addIcon = `<svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-5"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.77692 3.24224C9.91768 3.17186 10.0834 3.17186 10.2241 3.24224L15.3713 5.81573L10.3359 8.33331C10.1248 8.43888 9.87626 8.43888 9.66512 8.33331L4.6298 5.81573L9.77692 3.24224ZM3.70264 7.0292V13.4124C3.70264 13.6018 3.80964 13.775 3.97903 13.8597L9.25016 16.4952L9.25016 9.7837C9.16327 9.75296 9.07782 9.71671 8.99432 9.67496L3.70264 7.0292ZM10.7502 16.4955V9.78396C10.8373 9.75316 10.923 9.71683 11.0067 9.67496L16.2984 7.0292V13.4124C16.2984 13.6018 16.1914 13.775 16.022 13.8597L10.7502 16.4955ZM9.41463 17.4831L9.10612 18.1002C9.66916 18.3817 10.3319 18.3817 10.8949 18.1002L16.6928 15.2013C17.3704 14.8625 17.7984 14.17 17.7984 13.4124V6.58831C17.7984 5.83076 17.3704 5.13823 16.6928 4.79945L10.8949 1.90059C10.3319 1.61908 9.66916 1.61907 9.10612 1.90059L9.44152 2.57141L9.10612 1.90059L3.30823 4.79945C2.63065 5.13823 2.20264 5.83076 2.20264 6.58831V13.4124C2.20264 14.17 2.63065 14.8625 3.30823 15.2013L9.10612 18.1002L9.41463 17.4831Z" fill="currentColor"></path></svg>`;

    // pagination & stats
    Math = Math;
    itemsPerPage = 10;
    currentPage = 1;
    totalDocs = 0;
    totalPages = 0;

    products: Product[] = [];
    loading = false;
    error = '';

    // Filters
    searchTerm = '';
    statusFilter = 'all'; // all, active, inactive
    saleFilter = 'all'; // all, true, false
    stockFilter = 'all'; // all, in-stock, low-stock, out-of-stock


    constructor(
        private router: Router,
        private productService: ProductService,
        private route : ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['stockFilter']) {
                this.stockFilter = params['stockFilter'];
            }
            this.loadProducts();
        });
    }

    loadProducts(params: any = {}): void {
        this.loading = true;
        this.error = '';

        // base params
        params.page = this.currentPage;
        params.limit = this.itemsPerPage;
        params.sort = '-createdAt';

        if (this.searchTerm) {
            params['name[regex]'] = this.searchTerm;
            params['name[options]'] = 'i';
        }

        if (this.stockFilter !== 'all') {
            params['stockFilter'] = this.stockFilter;
        }

        if (this.statusFilter !== 'all') {
            if (this.statusFilter === 'active') {
                params.isActive = true;
            } else if (this.statusFilter === 'inactive') {
                params.isActive = false;
            }
        }

        if (this.saleFilter !== 'all') {
            if (this.saleFilter === 'true') {
                params.isSale = true;
            } else if (this.saleFilter === 'false') {
                params.isSale = false;
            }
        }

        this.productService.getProducts(params).subscribe({
            next: (res) => {
                this.loading = false;
                if (res?.success) {
                    this.products = res.data.items || [];
                    const pagination = res.data.pagination || { page: 1, totalDocs: 0, totalPages: 0 };
                    this.currentPage = pagination.page || 1;
                    this.totalDocs = pagination.totalDocs || 0;
                    this.totalPages = pagination.totalPages || 0;
                } else {
                    this.products = res?.data ?? res ?? [];
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.message || 'Error loading products';
            }
        });
    }

    onStockFilterChange(filter: string): void {
        this.stockFilter = filter;
        this.currentPage = 1;
        this.loadProducts();
    }

    onSearch(term: string): void {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadProducts();
    }

    onStatusFilterChange(filter: string): void {
        this.statusFilter = filter;
        this.currentPage = 1;
        this.loadProducts();
    }

    onSaleFilterChange(filter: string): void {
        this.saleFilter = filter;
        this.currentPage = 1;
        this.loadProducts();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProducts();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadProducts();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadProducts();
        }
    }

    addProduct(): void {
        this.router.navigate(['/store/app/products/add']);
    }

    viewProduct(productId: string | number): void {
        this.router.navigate(['/store/app/products', productId]);
    }

    editProduct(product: any): void {
        console.log('Edit product', product._id);
    }

    deleteProduct(product: any): void {
        if (confirm('Are you sure you want to delete this product?')) {
            console.log('Delete product', product._id);
        }
    }

    getStatusBgColor(isActive: boolean): string {
        if (!isActive) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }

    getStatusText(isActive: boolean): string {
        return isActive ? 'Active' : 'Inactive';
    }

    getSaleBadgeClasses(isSale: boolean): string {
        if (isSale) {
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        }
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }

    getSaleText(isSale: boolean): string {
        return isSale ? 'On Sale' : 'Regular';
    }

    formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    getStockStatus(product: any): 'in-stock' | 'low-stock' | 'out-of-stock' {
        if (product?.stockReal === 0) return 'out-of-stock';
        if (product?.stockReal <= 5) return 'low-stock';
        return 'in-stock';
    }

    getStockBadgeClasses(status: string): string {
        if (status === 'in-stock') {
            return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400';
        }
        if (status === 'low-stock') {
            return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400';
        }
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
    }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { VenteService } from '../../../shared/services/vente.service';
import { ProductService } from '../../../shared/services/product.service';
import { AuthService } from '../../../shared/services/auth.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { UserProfileService } from '../../../shared/services/user-profile.service';
import { Vente, VenteItem, VenteClient } from '../../../core/models/vente.model';
import { Product } from '../../../core/models/product.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

@Component({
    selector: 'app-vente-directe',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent, ButtonComponent],
    templateUrl: './vente-directe.component.html',
    styleUrl: './vente-directe.component.css'
})
export class VenteDirecteComponent implements OnInit {
    vente: Vente = {
        client: { name: '', phoneNumber: '', email: '', _id: null },
        items: [],
        paymentMethod: 'cash',
        saleType: 'dine-in',
        saleDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        status: 'draft',
        boutique: '',
        seller: ''
    };

    // Autocomplete logic
    searchSubject = new Subject<string>();
    searchResults: Product[] = [];
    showResults = false;

    isLoading = false;
    isSaving = false;
    isEditMode = false;
    successMessage = '';
    errorMessage = '';

    // Client Search Logic
    showClientModal = false;
    clientSearchTerm = '';
    clientSearchResults: any[] = [];
    isSearchingClients = false;
    clientSearchSubject = new Subject<string>();

    constructor(
        private venteService: VenteService,
        private productService: ProductService,
        private authService: AuthService,
        private userProfileService: UserProfileService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        const userHash = this.authService.userHash;
        if (userHash) {
            this.vente.boutique = userHash.boutiqueId || '';
            this.vente.seller = userHash.id || '';
        }

        // Check for ID in path params or query params
        const saleId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');

        // Also subscribe to query params changes in case of navigation within same component
        this.route.queryParams.subscribe(params => {
            const id = params['id'];
            if (id && id !== this.vente._id) {
                this.loadSale(id);
            }
        });

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id && id !== this.vente._id) {
                this.loadSale(id);
            }
        });

        if (saleId) {
            this.loadSale(saleId);
        }

        // Setup product autocomplete
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
                    boutique: this.vente.boutique
                });
            })
        ).subscribe((res: any) => {
            this.searchResults = res?.data?.items || res?.data || [];
            this.showResults = this.searchResults.length > 0;
        });

        // Setup client search
        this.clientSearchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length === 0) {
                    return of(null);
                }
                this.isSearchingClients = true;
                return this.userProfileService.getUserProfiles({
                    'name[regex]': term,
                    'name[options]': 'i',
                    role: 'user'
                });
            })
        ).subscribe({
            next: (res: any) => {
                if (res === null) {
                    this.clientSearchResults = [];
                    this.isSearchingClients = false;
                    return;
                }

                // The API returns { data: { items: [...], pagination: ... } }
                this.clientSearchResults = res?.data?.items || res?.data || [];
                // If it's still not an array (e.g. just one object), make it an array
                if (!Array.isArray(this.clientSearchResults)) {
                    this.clientSearchResults = [];
                }
                this.isSearchingClients = false;
            },
            error: (err) => {
                console.error('Error searching clients', err);
                this.isSearchingClients = false;
            }
        });
    }

    loadSale(id: string): void {
        this.isLoading = true;
        this.venteService.getVenteById(id).subscribe({
            next: (res) => {
                const sale = res.data;
                console.log('Loaded sale:', sale);
                if (sale.status !== 'draft') {
                    // If not draft, redirect to detail page
                    this.router.navigate(['/store/app/vente-liste', id]);
                    return;
                }

                // Map items to ensure productDetails is populated for display
                // Backend populate('items.product') means item.product is an object
                if (sale.items) {
                    sale.items = sale.items.map((item: any) => {
                        // If product is populated, it's an object. 
                        // We need to keep product ID in 'product' for logic, and details in 'productDetails' for UI
                        if (typeof item.product === 'object' && item.product !== null) {
                            return {
                                ...item,
                                productDetails: item.product,
                                product: item.product._id // Set product to ID string for consistency
                            };
                        }
                        return item;
                    });
                }

                this.vente = sale;
                this.isEditMode = true;
                this.isLoading = false;

                // Format date for input[type=date]
                if (this.vente.saleDate) {
                    this.vente.saleDate = new Date(this.vente.saleDate).toISOString().split('T')[0];
                }
            },
            error: (err) => {
                this.errorMessage = "Error loading sale";
                this.isLoading = false;
            }
        });
    }

    onProductSearch(event: any): void {
        this.searchSubject.next(event.target.value);
    }

    selectProduct(product: Product): void {
        const existingIndex = this.vente.items?.findIndex(item =>
            (typeof item.product === 'string' ? item.product : (item.product as any)._id) === product._id
        );

        const price = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;

        if (existingIndex !== undefined && existingIndex >= 0) {
            if (this.vente.items) {
                this.vente.items[existingIndex].quantity += 1;
                this.vente.items[existingIndex].totalPrice = this.vente.items[existingIndex].quantity * this.vente.items[existingIndex].unitPrice;
            }
        } else {
            const newItem: VenteItem = {
                product: product._id as string,
                quantity: 1,
                unitPrice: price,
                totalPrice: price,
                isSale: !!product.isSale,
                productDetails: product
            };
            this.vente.items?.push(newItem);
        }

        this.calculateTotal();
        this.showResults = false;
        this.searchResults = [];
        (document.getElementById('productSearch') as HTMLInputElement).value = '';
    }

    removeItem(index: number): void {
        this.vente.items?.splice(index, 1);
        this.calculateTotal();
    }

    updateQuantity(index: number, qty: number): void {
        if (this.vente.items && this.vente.items[index]) {
            const newQty = qty < 1 ? 1 : qty;
            this.vente.items[index].quantity = newQty;
            this.vente.items[index].totalPrice = newQty * this.vente.items[index].unitPrice;
            this.calculateTotal();
        }
    }

    updateUnitPrice(index: number, price: number): void {
        if (this.vente.items && this.vente.items[index]) {
            this.vente.items[index].unitPrice = price;
            this.vente.items[index].totalPrice = this.vente.items[index].quantity * price;
            this.calculateTotal();
        }
    }

    calculateTotal(): void {
        this.vente.totalAmount = this.vente.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
    }

    // Removed dead code: saveVente, payVente, cancelVente

    createSale(): void {
        if (!this.vente.client?.name) {
            this.errorMessage = 'Client name is required';
            return;
        }
        if (!this.vente.items || this.vente.items.length === 0) {
            this.errorMessage = 'Add at least one product';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';

        // Prepare payload (removing helper properties)
        const payload = { ...this.vente };
        payload.items = payload.items?.map(item => {
            const { productDetails, ...rest } = item;
            return rest;
        });

        const successCallback = (res: any) => {
            this.isSaving = false;
            if (res.success) {
                // Redirect to detail page
                this.router.navigate(['/store/app/vente-liste', res.data._id]);
            }
        };

        const errorCallback = (err: any) => {
            this.isSaving = false;
            this.errorMessage = err.error?.message || 'Error saving sale';
        };

        if (this.isEditMode && this.vente._id) {
            this.venteService.updateVente(this.vente._id, payload).subscribe({
                next: successCallback,
                error: errorCallback
            });
        } else {
            // Pass boutiqueId and sellerId explicitly
            const finalPayload = {
                ...payload,
                boutiqueId: this.vente.boutique,
                sellerId: this.vente.seller
            };

            this.venteService.createVente(finalPayload).subscribe({
                next: successCallback,
                error: errorCallback
            });
        }
    }

    resetForm(): void {
        this.isEditMode = false;
        this.vente = {
            client: { name: '', phoneNumber: '', email: '', _id: null },
            items: [],
            paymentMethod: 'cash',
            saleType: 'dine-in',
            saleDate: new Date().toISOString().split('T')[0],
            totalAmount: 0,
            status: 'draft',
            boutique: '',
            seller: ''
        };
        const userHash = this.authService.userHash;
        if (userHash) {
            this.vente.boutique = userHash.boutiqueId || '';
            this.vente.seller = userHash.id || '';
        }
        this.successMessage = '';
        this.errorMessage = '';
        this.router.navigate(['/store/app/vente-liste/add']);
    }

    // Client modal methods
    openClientModal(): void {
        this.showClientModal = true;
        this.clientSearchTerm = '';
        this.clientSearchResults = [];
        this.isSearchingClients = false;
    }

    closeClientModal(): void {
        this.showClientModal = false;
    }

    onClientSearchForModal(event: any): void {
        this.clientSearchSubject.next(event.target.value);
    }

    selectClient(client: any): void {
        console.log('Selected client', client);
        this.vente.client = {
            _id: client.id || client._id,
            name: client.name,
            email: client.email || '',
            phoneNumber: client.profile?.phoneNumber || client.phoneNumber || ''
        };
        // Reset manual input trigger if needed? No, ngModel handles it.
        this.closeClientModal();
    }
}

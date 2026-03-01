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
        seller: '',
        origin: 'direct'
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

    // ── Client field touch tracking (lazy validation)
    nameTouched = false;
    phoneTouched = false;

    // ── Validation rules
    private readonly NAME_MAX = 60;
    // Forbidden chars in names: digits + special symbols (allow letters, spaces, hyphens, apostrophes, dots)
    private readonly NAME_FORBIDDEN = /[0-9$"#@!%^&*()_+=\[\]{};:<>?/\\|`~]/;
    // Madagascar: +261 XX XX XXX XX  (total digits after +261: 9)
    //   Accepts: +261 XX XX XXX XX, 0XX XX XXX XX, or international formats
    //   Generic fallback: any phone with 7-15 digits and optional +, spaces, hyphens
    private readonly PHONE_MG = /^(\+261|0)(\s?\d){9}$/;
    private readonly PHONE_INTL = /^\+?[0-9][\s\-0-9]{6,18}$/;

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

        const saleId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');

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
                this.clientSearchResults = res?.data?.items || res?.data || [];
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
                if (sale.status !== 'draft') {
                    this.router.navigate(['/store/app/vente-liste', id]);
                    return;
                }

                if (sale.items) {
                    sale.items = sale.items.map((item: any) => {
                        if (typeof item.product === 'object' && item.product !== null) {
                            return {
                                ...item,
                                productDetails: item.product,
                                // Preserve stockReal from populated product
                                stockReal: item.product.stockReal ?? item.product.stock ?? 9999,
                                product: item.product._id
                            };
                        }
                        return item;
                    });
                }

                this.vente = sale;
                this.isEditMode = true;
                this.isLoading = false;

                if (this.vente.saleDate) {
                    this.vente.saleDate = new Date(this.vente.saleDate).toISOString().split('T')[0];
                }
            },
            error: (err) => {
                this.errorMessage = 'Error loading sale';
                this.isLoading = false;
            }
        });
    }

    onProductSearch(event: any): void {
        this.searchSubject.next(event.target.value);
    }

    selectProduct(product: Product): void {
        const productId = product._id as string;
        // stockReal = available stock (stock - stockEngaged), fallback to stock
        const stockReal = (product as any).stockReal ?? (product as any).stock ?? 9999;
        const existingIndex = this.vente.items?.findIndex(item =>
            (typeof item.product === 'string' ? item.product : (item.product as any)._id) === productId
        );

        const price = product.isSale && product.salePrice ? product.salePrice : product.regularPrice;

        if (existingIndex !== undefined && existingIndex >= 0) {
            if (this.vente.items) {
                const item = this.vente.items[existingIndex];
                // Cap at stockReal
                const newQty = Math.min(item.quantity + 1, stockReal);
                item.quantity = newQty;
                item.totalPrice = newQty * item.unitPrice;
            }
        } else {
            // Only add if stock available
            if (stockReal <= 0) {
                this.errorMessage = `"${product.name}" is out of stock.`;
                setTimeout(() => this.errorMessage = '', 3000);
                this.showResults = false;
                this.searchResults = [];
                (document.getElementById('productSearch') as HTMLInputElement).value = '';
                return;
            }
            const newItem: VenteItem = {
                product: productId,
                quantity: 1,
                unitPrice: price,
                totalPrice: price,
                isSale: !!product.isSale,
                productDetails: product,
                // Store stockReal on the item for UI enforcement
                stockReal: stockReal
            } as any;
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
            const item = this.vente.items[index] as any;
            const maxQty: number = item.stockReal ?? 9999;
            // Clamp: min 1, max stockReal
            const newQty = Math.max(1, Math.min(qty, maxQty));
            item.quantity = newQty;
            item.totalPrice = newQty * item.unitPrice;
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

    /** Returns true if + button should be disabled for this item */
    isAtMaxStock(item: any): boolean {
        const max = item.stockReal ?? 9999;
        return item.quantity >= max;
    }

    /** Returns remaining stock available for an item */
    remainingStock(item: any): number {
        const max = item.stockReal ?? 9999;
        return Math.max(0, max - item.quantity);
    }

    // ════════════════════════════
    //  VALIDATION
    // ════════════════════════════

    get nameError(): string | null {
        const name = (this.vente.client?.name || '').trim();
        if (!name) return 'Full name is required';
        if (this.NAME_FORBIDDEN.test(name)) return 'Name contains invalid characters ($, #, @, digits…)';
        if (name.length < 2) return 'Name must be at least 2 characters';
        if (name.length > this.NAME_MAX) return `Name must be ${this.NAME_MAX} characters or fewer`;
        return null;
    }

    get phoneError(): string | null {
        const phone = (this.vente.client?.phoneNumber || '').trim();
        if (!phone) return 'Phone number is required';
        // Strip spaces and hyphens for length check
        const stripped = phone.replace(/[\s\-]/g, '');
        if (this.PHONE_MG.test(stripped) || this.PHONE_INTL.test(stripped)) return null;
        return 'Invalid format — e.g. +261 34 12 345 67 or 034 12 345 67';
    }

    get isClientValid(): boolean {
        return this.nameError === null && this.phoneError === null;
    }

    get isFormReadyToSubmit(): boolean {
        return this.isClientValid && (this.vente.items?.length || 0) > 0;
    }

    createSale(): void {
        // Mark all fields as touched to show errors
        this.nameTouched = true;
        this.phoneTouched = true;

        if (!this.isClientValid) {
            this.errorMessage = this.nameError || this.phoneError || 'Invalid client information';
            return;
        }
        if (!this.vente.items || this.vente.items.length === 0) {
            this.errorMessage = 'Add at least one product';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';

        // Prepare payload (strip UI-only properties)
        const payload = { ...this.vente };
        payload.items = payload.items?.map((item: any) => {
            const { productDetails, stockReal, ...rest } = item;
            return rest;
        });

        const successCallback = (res: any) => {
            this.isSaving = false;
            if (res.success) {
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
            seller: '',
            origin: 'direct'
        };
        const userHash = this.authService.userHash;
        if (userHash) {
            this.vente.boutique = userHash.boutiqueId || '';
            this.vente.seller = userHash.id || '';
        }
        this.successMessage = '';
        this.errorMessage = '';
        this.nameTouched = false;
        this.phoneTouched = false;
        this.router.navigate(['/store/app/vente-liste/add']);
    }

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
        this.vente.client = {
            _id: client.id || client._id,
            name: client.name,
            email: client.email || '',
            phoneNumber: client.profile?.phoneNumber || client.phoneNumber || ''
        };
        // Reset touch state so re-populated fields don't show errors immediately
        this.nameTouched = false;
        this.phoneTouched = false;
        this.closeClientModal();
    }
}
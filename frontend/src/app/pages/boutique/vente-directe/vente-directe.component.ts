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

        const saleId = this.route.snapshot.paramMap.get('id');
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
                if (sale.status !== 'draft') {
                    this.router.navigate(['/store/app/vente-detail', id]);
                    return;
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
                this.errorMessage = "Erreur lors du chargement de la vente";
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

    saveVente(): void {
        if (!this.vente.client?.name) {
            this.errorMessage = 'Le nom du client est requis';
            return;
        }
        if (!this.vente.items || this.vente.items.length === 0) {
            this.errorMessage = 'Ajoutez au moins un produit';
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

        if (this.isEditMode && this.vente._id) {
            this.venteService.updateVente(this.vente._id, payload).subscribe({
                next: (res) => {
                    this.isSaving = false;
                    this.successMessage = 'Vente mise à jour avec succès';
                },
                error: (err) => {
                    this.isSaving = false;
                    this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour';
                }
            });
        } else {
            // Pass boutiqueId and sellerId explicitly as expected by controller
            const finalPayload = {
                ...payload,
                boutiqueId: this.vente.boutique,
                sellerId: this.vente.seller
            };

            this.venteService.createVente(finalPayload).subscribe({
                next: (res) => {
                    this.isSaving = false;
                    if (res.success) {
                        this.successMessage = 'Vente enregistrée en brouillon';
                        this.vente._id = res.data._id;
                        this.vente.status = 'draft';
                        this.isEditMode = true;
                    }
                },
                error: (err) => {
                    this.isSaving = false;
                    this.errorMessage = err.error?.message || 'Erreur lors de l’enregistrement';
                }
            });
        }
    }

    payVente(): void {
        if (!this.vente._id) {
            this.saveVente();
            return;
        }

        this.venteService.updateStatus(this.vente._id, 'paid').subscribe({
            next: (res) => {
                if (res.success) {
                    this.vente.status = 'paid';
                    this.successMessage = 'Vente payée avec succès';
                }
            },
            error: (err) => {
                this.errorMessage = err.error?.message || 'Erreur lors du paiement';
            }
        });
    }

    cancelVente(): void {
        if (!this.vente._id) return;

        if (confirm('Êtes-vous sûr de vouloir annuler cette vente ?')) {
            this.venteService.updateStatus(this.vente._id, 'canceled').subscribe({
                next: (res) => {
                    if (res.success) {
                        this.vente.status = 'canceled';
                        this.successMessage = 'Vente annulée';
                    }
                },
                error: (err) => {
                    this.errorMessage = err.error?.message || 'Erreur lors de l’annulation';
                }
            });
        }
    }

    getInvoice(): void {
        if (!this.vente._id) return;
        this.venteService.getInvoice(this.vente._id).subscribe({
            next: (res) => {
                alert('Facture générée ! (Simulation)');
            }
        });
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
        this.router.navigate(['/store/app/vente-directe']);
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

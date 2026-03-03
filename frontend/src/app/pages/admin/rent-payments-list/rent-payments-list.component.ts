import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PaiementAbonnementService } from '../../../shared/services/paiement-abonnement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BoutiqueService } from '../../../shared/services/boutique.service';

@Component({
    selector: 'app-rent-payments-list',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './rent-payments-list.component.html',
    styleUrl: './rent-payments-list.component.css'
})
export class RentPaymentsListComponent implements OnInit {
    pageTitle = 'Rent Payments';
    Math = Math;

    itemsPerPage = 10;
    currentPage = 1;
    totalDocs = 0;
    totalPages = 0;
    payments: any[] = [];
    isLoading = false;

    // Filters
    searchTerm = '';
    methodFilter = 'all'; // all, cash, mobile_money, card
    boutiqueFilter = 'all'; // boutique id
    boutiqueOptions: any[] = [];
    isLoadingBoutiques = false;

    constructor(
        private paiementService: PaiementAbonnementService,
        private boutiqueService: BoutiqueService,
        private toast: ToastService
    ) {}

    ngOnInit(): void {
        this.loadBoutiqueOptions();
        this.loadPayments();
    }

    loadBoutiqueOptions(): void {
        this.isLoadingBoutiques = true;
        this.boutiqueService.getBoutiques({ limit: 200, sort: 'name' }).subscribe({
            next: (res) => {
                this.boutiqueOptions = res?.data?.items || res?.data || [];
                this.isLoadingBoutiques = false;
            },
            error: () => {
                this.boutiqueOptions = [];
                this.isLoadingBoutiques = false;
            }
        });
    }

    loadPayments(): void {
        this.isLoading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            sort: '-paidAt'
        };

        if (this.methodFilter !== 'all') {
            params.method = this.methodFilter;
        }

        if (this.boutiqueFilter !== 'all') {
            params.boutique = this.boutiqueFilter;
        } else if (this.searchTerm) {
            // search by boutique name via populate field (not supported in advancedResults),
            // fallback to name search in boutiques list by id if term looks like id
            const term = this.searchTerm.trim();
            if (/^[0-9a-fA-F]{24}$/.test(term)) {
                params.boutique = term;
            }
        }

        this.paiementService.getPayments(params).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.success) {
                    this.payments = res.data.items || [];
                    const pagination = res.data.pagination || { page: 1, totalDocs: 0, totalPages: 0 };
                    this.currentPage = pagination.page || 1;
                    this.totalDocs = pagination.totalDocs || 0;
                    this.totalPages = pagination.totalPages || 0;
                } else {
                    this.toast.error('Error', res?.message || 'Failed to load payments.', 0);
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.toast.error('Error', err?.error?.message || 'Failed to load payments.', 0);
            }
        });
    }

    onSearch(term: string): void {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadPayments();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadPayments();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadPayments();
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadPayments();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadPayments();
        }
    }

    formatDate(date: string): string {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(date));
    }
}

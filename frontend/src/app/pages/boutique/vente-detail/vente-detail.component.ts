import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VenteService } from '../../../shared/services/vente.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ToastService } from '../../../shared/services/toast.service';
import { Vente } from '../../../core/models/vente.model';

@Component({
    selector: 'app-vente-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, PageBreadcrumbComponent],
    templateUrl: './vente-detail.component.html',
    styleUrl: './vente-detail.component.css'
})
export class VenteDetailComponent implements OnInit {
    vente: Vente | null = null;
    isLoading = false;
    isPayLoading = false;
    isCancelLoading = false;
    isInvoiceLoading = false;

    constructor(
        private route: ActivatedRoute,
        private venteService: VenteService,
        private toast: ToastService,
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) this.loadVente(id);
        });
    }

    loadVente(id: string): void {
        this.isLoading = true;
        this.venteService.getVenteById(id).subscribe({
            next: (res) => {
                this.vente = res.data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    // ── Helpers

    getProduct(item: any): any {
        return typeof item.product === 'object' ? item.product : item.productDetails;
    }

    getSeller(): any {
        return this.vente?.seller as any;
    }

    getBoutique(): any {
        return this.vente?.boutique as any;
    }

    getOrderLink(): string {
        const orderId = typeof this.vente?.order === 'object'
            ? (this.vente.order as any)._id
            : this.vente?.order;
        return `/store/app/orders/${orderId}`;
    }

    // Returns CSS classes for the status badge
    statusBadgeClass(status: string): string {
        switch (status) {
            case 'paid':     return 'status-paid';
            case 'draft':    return 'status-draft';
            case 'canceled': return 'status-canceled';
            default:         return 'status-default';
        }
    }

    statusLabel(status: string): string {
        switch (status) {
            case 'paid':     return '✓ Paid';
            case 'draft':    return '◎ Draft';
            case 'canceled': return '✕ Canceled';
            default:         return status;
        }
    }

    // ── Actions

    payVente(): void {
        if (!this.vente?._id) return;
        this.isPayLoading = true;
        this.venteService.updateStatus(this.vente._id, 'paid').subscribe({
            next: (res) => {
                if (res.success) {
                    this.vente!.status = 'paid';
                    this.toast.success("Success",'Sale marked as paid');
                }
                this.isPayLoading = false;
            },
            error: () => {
                this.toast.error("Error",'Failed to update status');
                this.isPayLoading = false;
            }
        });
    }

    cancelVente(): void {
        if (!this.vente?._id) return;
        this.toast.confirm(
            'Cancel this sale?',
            'This action cannot be undone. The sale will be marked as canceled.',
            () => {
                this.isCancelLoading = true;
                this.venteService.updateStatus(this.vente!._id!, 'canceled').subscribe({
                    next: (res) => {
                        if (res.success) {
                            this.vente!.status = 'canceled';
                            this.toast.warning('Warning','Sale has been canceled');
                        }
                        this.isCancelLoading = false;
                    },
                    error: () => {
                        this.toast.error('Error','Failed to cancel sale');
                        this.isCancelLoading = false;
                    }
                });
            },
            () => { /* dismissed */ },
            {
                confirmLabel: 'Yes, cancel sale',
                cancelLabel: 'Keep it',
                variant: 'danger',
                position: 'top-center',
                backdrop: true,
            }
        );
    }

    getInvoice(): void {
        const venteId = this.vente?._id;
        if (!venteId) return;
        this.isInvoiceLoading = true;
        this.venteService.getInvoice(venteId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `facture-${venteId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.isInvoiceLoading = false;
            },
            error: (err) => {
                console.error('Error downloading invoice', err);
                this.toast.error('Error','Unable to download invoice');
                this.isInvoiceLoading = false;
            }
        });
    }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { VenteService } from '../../../shared/services/vente.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { Vente } from '../../../core/models/vente.model';

@Component({
    selector: 'app-vente-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, PageBreadcrumbComponent, BadgeComponent, ButtonComponent],
    templateUrl: './vente-detail.component.html',
})
export class VenteDetailComponent implements OnInit {
    vente: Vente | null = null;
    isLoading = false;

    constructor(
        private route: ActivatedRoute,
        private venteService: VenteService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadVente(id);
        }
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

    getStatusColor(status: string): any {
        switch (status) {
            case 'paid': return 'success';
            case 'draft': return 'warning';
            case 'canceled': return 'error';
            default: return 'light';
        }
    }

    getProduct(item: any): any {
        return item.product as any;
    }

    getSeller(): any {
        return this.vente?.seller as any;
    }

    getBoutique(): any {
        return this.vente?.boutique as any;
    }

    payVente(): void {
        if (!this.vente?._id) return;
        this.venteService.updateStatus(this.vente._id, 'paid').subscribe({
            next: (res) => {
                if (res.success) {
                    this.vente!.status = 'paid';
                }
            }
        });
    }

    cancelVente(): void {
        if (!this.vente?._id) return;
        if (confirm('Êtes-vous sûr de vouloir annuler cette vente ?')) {
            this.venteService.updateStatus(this.vente._id, 'canceled').subscribe({
                next: (res) => {
                    if (res.success) {
                        this.vente!.status = 'canceled';
                    }
                }
            });
        }
    }

    getInvoice(): void {
        if (!this.vente?._id) return;
        this.venteService.getInvoice(this.vente._id).subscribe({
            next: (res) => {
                // Wait for data to be sure and then print
                setTimeout(() => {
                    window.print();
                }, 300);
            }
        });
    }
}

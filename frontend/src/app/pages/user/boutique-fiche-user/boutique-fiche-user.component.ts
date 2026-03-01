import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { ActivatedRoute, Router } from "@angular/router";
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { BoutiqueSkeletonComponent } from "./boutique-skeleton/boutique-skeleton.component";
import { BoutiqueDetailsComponent } from "./boutique-details/boutique-details.component";
import { ProductListComponent } from "./product-list/product-list.component";
import {ToastService} from "../../../shared/services/toast.service";

@Component({
    selector: 'app-boutique-fiche-user',
    standalone: true,
    imports: [
        CommonModule,
        PageBreadcrumbComponent,
        BoutiqueSkeletonComponent,
        BoutiqueDetailsComponent,
        ProductListComponent,
        BoutiqueSkeletonComponent
    ],
    templateUrl: './boutique-fiche-user.component.html',
    styleUrls: ['./boutique-fiche-user.component.css']
})
export class BoutiqueFicheUserComponent implements OnInit {
    pageTitle = 'Shop info';
    boutiqueName = 'Shop';
    boutique: any = null;
    isLoading = false;

    constructor(
        private boutiqueService: BoutiqueService,
        private router: Router,
        private route: ActivatedRoute,
        private toast : ToastService
    ) {}

    ngOnInit(): void {
        const boutiqueId = this.route.snapshot.paramMap.get('id');
        if (!boutiqueId) {
            this.router.navigate(['/v1/stores']);
            return;
        }

        this.loadBoutique(boutiqueId);
    }

    loadBoutique(boutiqueId: string): void {
        this.isLoading = true;
        this.boutiqueService.getBoutiqueFullById(boutiqueId).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res && res.success && res.data) {
                    this.boutique = res.data;
                    this.boutiqueName = this.boutique.name || 'Shop';
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading boutique:', err);
                this.router.navigate(['/v1/stores']);
                if (err.error && err.error.message) {
                    this.toast.error('Error',err.error.message);
                } else {
                    this.toast.error('Error','An error occurred while fetching store');
                }
            }
        });
    }
}
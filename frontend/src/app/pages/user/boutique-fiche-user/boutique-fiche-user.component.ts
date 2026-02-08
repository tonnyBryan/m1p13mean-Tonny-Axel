import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";

@Component({
    selector: 'app-boutique-fiche-user',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageBreadcrumbComponent],
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
        private route: ActivatedRoute
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
                    console.log(this.boutique);
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading boutique:', err);
                this.router.navigate(['/v1/stores']);
            }
        });
    }

    getDayName(dayNumber: number): string {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[dayNumber] || '';
    }

    isDeliveryAvailableToday(): boolean {
        if (!this.boutique?.livraisonConfig?.deliveryDays) return false;

        const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const apiDay = jsDay === 0 ? 7 : jsDay;
        const todayDelivery = this.boutique.livraisonConfig.deliveryDays.find((d: any) => d.day === apiDay);
        return todayDelivery?.isActive || false;
    }

    getCurrentDayName(): string {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const apiDay = today === 0 ? 7 : today;
        return this.getDayName(apiDay);
    }
}
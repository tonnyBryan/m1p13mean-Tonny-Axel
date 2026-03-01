import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RatingStarComponent} from "../../../../shared/components/common/rating-star/rating-star.component";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-boutique-details',
    standalone: true,
    imports: [CommonModule, RatingStarComponent, RouterLink],
    templateUrl: './boutique-details.component.html',
    styleUrls: ['./boutique-details.component.css']
})
export class BoutiqueDetailsComponent {
    @Input() boutique: any = null;

    onDeliveryToggle(event: Event): void {
        if (!this.boutique?.livraisonConfig?.isDeliveryAvailable) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    getDayName(dayNumber: number): string {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[dayNumber] || '';
    }

    isDeliveryAvailableToday(): boolean {
        if (!this.boutique?.livraisonConfig?.deliveryDays) return false;

        const jsDay = new Date().getDay();
        const apiDay = jsDay === 0 ? 7 : jsDay;
        const todayDelivery = this.boutique.livraisonConfig.deliveryDays.find((d: any) => d.day === apiDay);

        return todayDelivery?.isActive || false;
    }

    getCurrentDayName(): string {
        const today = new Date().getDay();
        const apiDay = today === 0 ? 7 : today;
        return this.getDayName(apiDay - 1);
    }
}

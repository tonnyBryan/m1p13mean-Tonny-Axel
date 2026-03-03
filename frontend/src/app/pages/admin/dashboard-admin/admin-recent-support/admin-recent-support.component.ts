import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-recent-support',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-recent-support.component.html'
})
export class AdminRecentSupportComponent {
    @Input() requests: any[] = [];
    @Input() isLoading = true;

    formatDate(date: string): string {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 60) return `il y a ${minutes} min`;
        if (hours < 24) return `il y a ${hours} h`;
        return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
    }
}

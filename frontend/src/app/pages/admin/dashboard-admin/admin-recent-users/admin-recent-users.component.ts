import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-recent-users',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-recent-users.component.html'
})
export class AdminRecentUsersComponent {
    @Input() users: any[] = [];
    @Input() isLoading = true;

    formatDate(date: string): string {
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

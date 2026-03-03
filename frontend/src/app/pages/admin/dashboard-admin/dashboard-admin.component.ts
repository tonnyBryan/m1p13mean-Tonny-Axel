import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from '../../../shared/services/admin-dashboard.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdminKpiComponent } from './admin-kpi/admin-kpi.component';
import { AdminRecentUsersComponent } from './admin-recent-users/admin-recent-users.component';
import { AdminRecentSupportComponent } from './admin-recent-support/admin-recent-support.component';
import { AdminAnalyticsComponent } from './admin-analytics/admin-analytics.component';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-dashboard-admin',
    standalone: true,
    imports: [
        CommonModule,
        AdminKpiComponent,
        AdminRecentUsersComponent,
        AdminRecentSupportComponent,
        AdminAnalyticsComponent,
        RouterModule
    ],
    templateUrl: './dashboard-admin.component.html',
    styleUrl: './dashboard-admin.component.css'
})
export class DashboardAdminComponent implements OnInit {
    realtimeData: any = null;
    isLoading = true;

    constructor(
        private dashboardService: AdminDashboardService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;
        this.dashboardService.getRealtime().subscribe({
            next: (res) => {
                if (res.success) {
                    this.realtimeData = res.data;
                } else {
                    this.toast.error('Error', res.message ?? 'Failed to load dashboard.', 0);
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.toast.error('Error', err?.error?.message ?? 'Failed to load dashboard.', 0);
                this.isLoading = false;
            }
        });
    }
}

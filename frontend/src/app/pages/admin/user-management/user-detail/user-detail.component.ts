import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { UserProfile } from '../../../../core/models/user-profile.model';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule, PageBreadcrumbComponent],
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
    pageTitle = 'User Details';
    profile: UserProfile | null = null;
    isLoading = true;

    get isActive(): boolean {
        if (this.profile && this.profile.user && typeof this.profile.user !== 'string') {
            return this.profile.user.isActive;
        }
        return false;
    }

    getRole(user: any): string {
        if (user && typeof user !== 'string') {
            return user.role;
        }
        return 'User';
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private profileService: UserProfileService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadProfile(id);
            } else {
                this.router.navigate(['/admin/app/users']);
            }
        });
    }

    loadProfile(id: string): void {
        this.isLoading = true;
        this.profileService.getUserProfileById(id).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) {
                    this.profile = res.data;
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading profile:', err);
                this.toast.error('Load Failed', 'Error loading user profile');
                this.router.navigate(['/admin/app/users']);
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/app/users']);
    }

    async toggleStatus(): Promise<void> {
        if (!this.profile || !this.profile.user) return;

        const userId = typeof this.profile.user === 'string' ? this.profile.user : (this.profile.user._id || this.profile.user.id);
        const currentStatus = typeof this.profile.user === 'string' ? false : this.profile.user.isActive;

        if (!userId) return;

        const confirmed = await this.toast.confirmAsync(
            currentStatus ? 'Deactivate Account' : 'Activate Account',
            `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this account?`,
            { variant: currentStatus ? 'danger' : 'success' }
        );

        if (confirmed) {
            this.profileService.updateUserStatus(userId, !currentStatus).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.toast.success(
                            'Status Updated',
                            `Account has been ${!currentStatus ? 'activated' : 'deactivated'} successfully.`
                        );
                        // Reload profile to get updated status
                        this.loadProfile(userId);
                    }
                },
                error: (err) => {
                    console.error('Error updating status:', err);
                    this.toast.error('Update Failed', 'Error updating account status');
                }
            });
        }
    }
}

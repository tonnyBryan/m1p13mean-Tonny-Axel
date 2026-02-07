import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { UserProfile } from '../../../../core/models/user-profile.model';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent],
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
    pageTitle = 'User Details';
    profile: UserProfile | null = null;
    isLoading = true;

    getRole(user: any): string {
        if (user && typeof user !== 'string') {
            return user.role;
        }
        return 'User';
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private profileService: UserProfileService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadProfile(id);
        } else {
            this.router.navigate(['/admin/app/users']);
        }
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
                alert('Error loading profile');
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
}

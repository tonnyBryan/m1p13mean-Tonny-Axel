import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
    pageTitle = 'User Management';
    users: any[] = [];
    isLoading = false;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalDocs = 0;
    totalPages = 0;
    Math = Math;

    // Filters
    searchTerm = '';
    statusFilter = 'all'; // all, active, inactive
    startDate = '';
    endDate = '';

    constructor(
        private profileService: UserProfileService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadProfiles();
    }

    loadProfiles(): void {
        this.isLoading = true;
        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            sort: '-createdAt'
        };

        if (this.searchTerm) {
            // Search by user name
            params['name[regex]'] = this.searchTerm;
            params['name[options]'] = 'i';
        }

        if (this.statusFilter !== 'all') {
            params.isActive = this.statusFilter === 'active';
        }

        if (this.startDate) {
            params['createdAt[gte]'] = this.startDate;
        }

        if (this.endDate) {
            params['createdAt[lte]'] = this.endDate;
        }

        this.profileService.getUserProfiles(params).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) {
                    this.users = res.data.items;
                    this.totalDocs = res.data.pagination.totalDocs;
                    this.totalPages = res.data.pagination.totalPages;
                    this.currentPage = res.data.pagination.page;
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading profiles:', err);
            }
        });
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadProfiles();
    }

    onFilterChange(filter: string): void {
        this.statusFilter = filter;
        this.currentPage = 1;
        this.loadProfiles();
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProfiles();
        }
    }

    viewProfile(id: string): void {
        this.router.navigate(['/admin/app/users', id]);
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

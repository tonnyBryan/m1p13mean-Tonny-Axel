import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header-user',
    imports: [
        CommonModule,
        RouterModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        UserDropdownComponent,
    ],
    templateUrl: './app-header-user.component.html',
})
export class AppHeaderUserComponent implements OnInit {
    isApplicationMenuOpen = false;
    readonly isMobileOpen$;

    hasProfile: boolean | null = null; // null = not loaded, false = no profile, true = has profile
    isProfileLoading = false;

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    constructor(
        public sidebarService: SidebarService,
        private userService: UserService,
        private authService: AuthService
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {
        // Only check profile if user is logged in and has role 'user'
        const user = this.authService.user;
        if (user) {
            this.loadMyProfile();
        } else {
            this.hasProfile = true; // non-user roles are considered as having no warning
        }
    }

    loadMyProfile() {
        this.isProfileLoading = true;
        this.userService.getMyProfile().subscribe({
            next: (res) => {
                this.isProfileLoading = false;
                if (res && res.success) {
                    this.hasProfile = !!res.data; // null data => false
                } else {
                    // If API returns success:true with message 'Profile not found' and data:null
                    this.hasProfile = !!res.data;
                }
            },
            error: (err) => {
                this.isProfileLoading = false;
                console.error('Error fetching profile', err);
                // In case of error assume no profile so user is prompted to fill it
                this.hasProfile = false;
            }
        });
    }

    handleToggle() {
        if (window.innerWidth >= 1280) {
            this.sidebarService.toggleExpanded();
        } else {
            this.sidebarService.toggleMobileOpen();
        }
    }

    toggleApplicationMenu() {
        this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
    }

    ngAfterViewInit() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            this.searchInput?.nativeElement.focus();
        }
    };
}

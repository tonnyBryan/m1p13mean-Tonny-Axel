import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user/user-dropdown/user-dropdown.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import {UserCartComponent} from "../../components/header/user/user-cart/user-cart.component";
import {ToastService} from "../../services/toast.service";
import {UserProfileService} from "../../services/user-profile.service";

@Component({
    selector: 'app-header-user',
    imports: [
        CommonModule,
        RouterModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        UserDropdownComponent,
        UserCartComponent,
    ],
    templateUrl: './app-header-user.component.html',
})
export class AppHeaderUserComponent implements OnInit {
    isApplicationMenuOpen = false;
    readonly isMobileOpen$;

    hasProfile: boolean | null = null; // null = not loaded, false = no profile, true = has profile
    isProfileLoading = false;
    hasError = false;

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    constructor(
        public sidebarService: SidebarService,
        private userService: UserService,
        private authService: AuthService,
        private toast : ToastService,
        private profileService : UserProfileService
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {
        this.profileService.hasProfile$.subscribe(value => {
            if (value !== null) {
                this.hasProfile = value;
            }
        });

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
                const hasProfile = !!res?.data;
                this.hasProfile = hasProfile;
                this.profileService.setHasProfile(hasProfile);
            },
            error: (err) => {
                this.isProfileLoading = false;
                this.hasError = true;
                console.error('Error fetching profile', err);
                this.hasProfile = false;
                this.profileService.setHasProfile(false);

                if (err.error && err.error.message) {
                    this.toast.error('Error',err.error.message,0);
                } else {
                    this.toast.error('Error','An error occurred while header profile',0);
                }
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

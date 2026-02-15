import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import {AdminDropdownComponent} from "../../components/header/admin-dropdown/admin-dropdown.component";
import {User} from "../../../core/models/user.model";
import {UserService} from "../../services/user.service";
import {ToastService} from "../../services/toast.service";

@Component({
    selector: 'app-header-admin',
    imports: [
        CommonModule,
        RouterModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        AdminDropdownComponent,
    ],
    templateUrl: './app-header-admin.component.html',
})
export class AppHeaderAdminComponent implements OnInit {
    isApplicationMenuOpen = false;
    readonly isMobileOpen$;

    user: User | null = null;


    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    constructor(
        public sidebarService: SidebarService, private userService: UserService, private toast: ToastService
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {
        this.loadUser();
    }

    loadUser() {
        this.userService.getUser(null).subscribe({
            next: (res) => {
                console.log(res);
                if (res.success) {
                    this.user = res.data;
                }
            },
            error: (err) => {
                console.error('Error fetching user', err);

                if (err.error && err.error.message) {
                    this.toast.error('Error', err.error.message, 0);
                } else {
                    this.toast.error('Error', 'An error occurred while header user', 0);
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

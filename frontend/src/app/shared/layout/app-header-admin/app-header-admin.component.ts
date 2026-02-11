import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import {AdminDropdownComponent} from "../../components/header/admin-dropdown/admin-dropdown.component";

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

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    constructor(
        public sidebarService: SidebarService,
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {

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

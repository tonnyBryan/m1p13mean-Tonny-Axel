import {Component, ElementRef, ViewChild, OnInit, OnDestroy} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import {AdminDropdownComponent} from "../../components/header/admin-dropdown/admin-dropdown.component";
import {User} from "../../../core/models/user.model";
import {UserService} from "../../services/user.service";
import {distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {SessionService} from "../../services/session.service";

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
export class AppHeaderAdminComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    isApplicationMenuOpen = false;
    readonly isMobileOpen$;

    user: User | null = null;

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    constructor(
        public sidebarService: SidebarService, private userService: UserService, private session: SessionService
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {
        console.log("adminn");
        this.userService.loadUser();

        this.session.user$
        .pipe(
            distinctUntilChanged((a, b) => a?._id === b?._id)
        )
        .subscribe(user => {
            this.user = user;
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
        this.destroy$.next();
        this.destroy$.complete();
        // document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            this.searchInput?.nativeElement.focus();
        }
    };
}

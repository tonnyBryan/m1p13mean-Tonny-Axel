import {Component, ElementRef, ViewChild, OnInit, OnDestroy, HostListener} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { AdminDropdownComponent } from "../../components/header/admin-dropdown/admin-dropdown.component";
import { User } from "../../../core/models/user.model";
import { UserService } from "../../services/user.service";
import { SearchService } from "../../services/search.service";
import { distinctUntilChanged, Subject, takeUntil, debounceTime } from "rxjs";
import { SessionService } from "../../services/session.service";
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-header-admin',
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        AdminDropdownComponent,
    ],
    templateUrl: './app-header-admin.component.html',
})
export class AppHeaderAdminComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    isApplicationMenuOpen = false;
    readonly isMobileOpen$;

    user: User | null = null;

    searchQuery = '';
    searchResults: any[] = [];
    isSearching = false;
    showDropdown = false;

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
    @ViewChild('searchDropdown') searchDropdown!: ElementRef;

    constructor(
        public sidebarService: SidebarService,
        private userService: UserService,
        private session: SessionService,
        private searchService: SearchService,
        private router: Router
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {
        this.userService.loadUser();

        this.session.user$
            .pipe(distinctUntilChanged((a, b) => a?._id === b?._id))
            .subscribe(user => { this.user = user; });

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(query => {
            if (query.length >= 2) {
                this.performSearch(query);
            } else {
                this.searchResults = [];
                this.showDropdown = false;
            }
        });
    }

    onSearchInput() {
        this.searchSubject.next(this.searchQuery);
        if (this.searchQuery.length >= 2) {
            this.showDropdown = true;
        }
    }

    performSearch(query: string) {
        this.isSearching = true;
        this.searchService.searchForAdmin(query).subscribe({
            next: (res: any) => {
                this.searchResults = res.results || [];
                this.isSearching = false;
                this.showDropdown = true;
            },
            error: () => { this.isSearching = false; }
        });
    }

    navigateToResult(result: any) {
        this.router.navigate([result.link]);
        this.searchQuery = '';
        this.searchResults = [];
        this.showDropdown = false;
    }

    closeSearch() {
        this.showDropdown = false;
    }

    getTypeBadgeClass(type: string): string {
        const classes: Record<string, string> = {
            user: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            boutique: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            support: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        };
        return classes[type] || 'bg-gray-100 text-gray-600';
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
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            this.searchInput?.nativeElement.focus();
            this.showDropdown = this.searchQuery.length >= 2;
        }
        if (event.key === 'Escape') {
            this.showDropdown = false;
        }
    };

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const input = this.searchInput?.nativeElement;
        const dropdown = this.searchDropdown?.nativeElement;
        if (input && dropdown &&
            !input.contains(event.target as Node) &&
            !dropdown.contains(event.target as Node)) {
            this.showDropdown = false;
        }
    }
}
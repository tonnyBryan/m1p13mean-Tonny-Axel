import {Component, ElementRef, ViewChild, OnInit, HostListener, OnDestroy} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user/user-dropdown/user-dropdown.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserCartComponent } from "../../components/header/user/user-cart/user-cart.component";
import { ToastService } from "../../services/toast.service";
import { UserProfileService } from "../../services/user-profile.service";
import { SearchService } from "../../services/search.service";
import { ResultSearch } from "../../../core/models/search.model";
import { Router } from '@angular/router';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {User} from "../../../core/models/user.model";
import {SessionService} from "../../services/session.service";
import {WishlistService} from "../../services/wishlist.service";
import {UserWishlistComponent} from "../../components/header/user/user-wishlist/user-wishlist.component";

@Component({
    selector: 'app-header-user',
    imports: [
        CommonModule,
        RouterModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        UserDropdownComponent,
        UserCartComponent,
        UserWishlistComponent,
    ],
    templateUrl: './app-header-user.component.html',
})
export class AppHeaderUserComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    isApplicationMenuOpen = false;
    readonly isMobileOpen$;

    hasProfile: boolean | null = null;
    isProfileLoading = false;
    hasError = false;

    user: User | null = null;

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
    @ViewChild('searchDropdown') searchDropdown!: ElementRef<HTMLDivElement>;

    searchResults: ResultSearch[] = [];
    isSearching = false;
    showSearchDropdown = false;
    searchQuery = '';
    private searchSubject = new Subject<string>();

    constructor(
        public sidebarService: SidebarService,
        private userService: UserService,
        private toast: ToastService,
        private profileService: UserProfileService,
        private searchService: SearchService,
        private router: Router,
        private session : SessionService,
        private wishlistService : WishlistService
    ) {
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    }

    ngOnInit() {
        this.profileService.hasProfile$.subscribe(value => {
            if (value !== null) {
                this.hasProfile = value;
            }
        });

        this.userService.loadUser();

        this.session.user$
        .pipe(
            distinctUntilChanged((a, b) => a?._id === b?._id)
        )
        .subscribe(user => {
            this.user = user;

            if (user && user.role === 'user' && !user.isEmailVerified) {
                this.toast.show(
                    'warning',
                    'Email Not Verified',
                    'Please verify your email to access all features.',
                    0,
                    'top-right',
                    {
                        label: 'Verify Now',
                        onClick: () => this.router.navigate(['/v1/verify-email'])
                    }
                );
            } else {
                // this.toast.clear();
            }
        });

        this.loadMyProfile();
        this.wishlistService.loadWishlist().subscribe();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.performSearch(query);
        });
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
                    this.toast.error('Error', err.error.message, 0);
                } else {
                    this.toast.error('Error', 'An error occurred while header profile', 0);
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

    // ngOnDestroy() {
    //     document.removeEventListener('keydown', this.handleKeyDown);
    //     this.searchSubject.complete();
    // }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            this.searchInput?.nativeElement.focus();
        }

        // Close dropdown with Escape
        if (event.key === 'Escape') {
            this.closeSearchDropdown();
        }
    };

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        const clickedInside = this.searchInput?.nativeElement.contains(event.target as Node) ||
            this.searchDropdown?.nativeElement?.contains(event.target as Node);

        if (!clickedInside) {
            this.closeSearchDropdown();
        }
    }

    onSearchInput(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchQuery = input.value.trim();

        if (this.searchQuery.length === 0) {
            this.closeSearchDropdown();
            return;
        }

        if (this.searchQuery.length < 2) {
            return; // Minimum 2 characters
        }

        this.searchSubject.next(this.searchQuery);
    }


    performSearch(query: string) {
        if (!query || query.length < 2) {
            this.closeSearchDropdown();
            return;
        }

        this.isSearching = true;
        this.showSearchDropdown = true;

        this.searchService.globalSearch(query).subscribe({
            next: (res) => {
                console.log('Global search results:', res);
                this.isSearching = false;
                if (res.success) {
                    this.searchResults = res.data;
                }
            },
            error: (err) => {
                this.isSearching = false;
                console.error('Error fetching search results', err);
                const msg = err.error.message;
                this.toast.error('Search Error', msg, 3000);
            }
        });
    }


    navigateToResult(result: ResultSearch) {
        this.router.navigate([result.link]);
        this.closeSearchDropdown();
        this.searchQuery = '';
        this.searchInput.nativeElement.value = '';
    }

    closeSearchDropdown() {
        this.showSearchDropdown = false;
        this.searchResults = [];
    }


    getResultIcon(type: string): string {
        return type === 'product' ? '📦' : '🏪';
    }


    searchGlobal() {
        const query = this.searchInput.nativeElement.value.trim();
        if (!query) {
            this.toast.warning('Search', 'Please enter a search term', 2000);
            return;
        }
        this.performSearch(query);
    }
}
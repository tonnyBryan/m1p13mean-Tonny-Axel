import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { BoutiqueDropdownComponent } from "../../components/header/boutique-dropdown/boutique-dropdown.component";
import { User } from "../../../core/models/user.model";
import { UserService } from "../../services/user.service";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import { SessionService } from "../../services/session.service";
import { SearchService } from "../../services/search.service";
import { Router } from "@angular/router";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: 'app-header-boutique',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    BoutiqueDropdownComponent,
  ],
  templateUrl: './app-header-boutique.component.html',
})
export class AppHeaderBoutiqueComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  isApplicationMenuOpen = false;
  readonly isMobileOpen$;

  user: User | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchDropdown') searchDropdown!: ElementRef<HTMLDivElement>;

  searchResults: any[] = [];
  isSearching = false;
  showSearchDropdown = false;
  searchQuery = '';

  constructor(
      public sidebarService: SidebarService,
      private userService: UserService,
      private session: SessionService,
      private searchService: SearchService,
      private router: Router,
      private toast: ToastService,
  ) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    this.userService.loadUser();
    this.session.user$
        .pipe(distinctUntilChanged((a, b) => a?._id === b?._id))
        .subscribe(user => { this.user = user; });

    this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
    ).subscribe(query => this.performSearch(query));
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
    }
    if (event.key === 'Escape') this.closeSearchDropdown();
  };

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const inside = this.searchInput?.nativeElement.contains(event.target as Node) ||
        this.searchDropdown?.nativeElement?.contains(event.target as Node);
    if (!inside) this.closeSearchDropdown();
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value.trim();
    this.searchQuery = query;
    if (!query) { this.closeSearchDropdown(); return; }
    if (query.length < 2) return;
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (!query || query.length < 2) { this.closeSearchDropdown(); return; }
    this.isSearching = true;
    this.showSearchDropdown = true;

    this.searchService.searchForBoutique(query).subscribe({
      next: (res) => {
        this.isSearching = false;
        if (res.success) this.searchResults = res.data;
      },
      error: (err) => {
        this.isSearching = false;
        this.toast.error('Search Error', err?.error?.message ?? 'Search failed.', 3000);
      }
    });
  }

  navigateToResult(result: any) {
    this.router.navigate([result.link]);
    this.closeSearchDropdown();
    this.searchQuery = '';
    this.searchInput.nativeElement.value = '';
  }

  closeSearchDropdown() {
    this.showSearchDropdown = false;
    this.searchResults = [];
  }

  getTypeBadgeClass(type: string): string {
    const map: any = {
      product: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      order: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      sale: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    };
    return map[type] || 'bg-gray-100 text-gray-700';
  }

  handleToggle() {
    if (window.innerWidth >= 1280) this.sidebarService.toggleExpanded();
    else this.sidebarService.toggleMobileOpen();
  }

  toggleApplicationMenu() {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }
}
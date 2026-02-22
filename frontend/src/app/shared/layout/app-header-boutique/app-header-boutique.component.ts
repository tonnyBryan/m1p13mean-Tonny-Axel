import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import {BoutiqueDropdownComponent} from "../../components/header/boutique-dropdown/boutique-dropdown.component";
import {User} from "../../../core/models/user.model";
import {UserService} from "../../services/user.service";
import {distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {SessionService} from "../../services/session.service";
import {UserDropdownComponent} from "../../components/header/user/user-dropdown/user-dropdown.component";

@Component({
  selector: 'app-header-boutique',
    imports: [
        CommonModule,
        RouterModule,
        ThemeToggleButtonComponent,
        NotificationDropdownComponent,
        BoutiqueDropdownComponent,
        UserDropdownComponent,
    ],
  templateUrl: './app-header-boutique.component.html',
})
export class AppHeaderBoutiqueComponent implements OnInit, OnDestroy{
  private destroy$ = new Subject<void>();

  isApplicationMenuOpen = false;
  readonly isMobileOpen$;

  user: User | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(public sidebarService: SidebarService, private userService: UserService, private session : SessionService) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    console.log("boutiqueee");
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

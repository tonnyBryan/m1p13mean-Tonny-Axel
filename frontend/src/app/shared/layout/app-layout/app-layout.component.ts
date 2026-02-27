import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { filter, Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AppHeaderUserComponent } from '../app-header-user/app-header-user.component';
import { AppHeaderBoutiqueComponent } from '../app-header-boutique/app-header-boutique.component';
import { AppHeaderAdminComponent } from '../app-header-admin/app-header-admin.component';
import { JwtPayload } from '../../../core/models/jwtPayload.model';
import { SocketService } from '../../services/socket.service';
import {ChatWidgetComponent} from "../../components/chatbot/chat-widget/chat-widget.component";

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    AppHeaderComponent,
    AppSidebarComponent,
    BackdropComponent,
    AppHeaderUserComponent,
    AppHeaderBoutiqueComponent,
    AppHeaderAdminComponent,
    ChatWidgetComponent,
  ],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent implements OnInit {
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;
  userToken$!: Observable<JwtPayload | null>;

  constructor(
      public  sidebarService: SidebarService,
      private authService: AuthService,
      private router: Router,
      private socketService: SocketService,
  ) {
    this.isExpanded$   = this.sidebarService.isExpanded$;
    this.isHovered$    = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit() {
    this.userToken$ = this.authService.userToken$;

    this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }));

    if (this.authService.isLoggedIn() && this.authService.userHash?.id) {
      this.socketService.connect(this.authService.userHash.id);
    }
  }
}
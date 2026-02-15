import {Component, OnInit} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import {Observable} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {AppHeaderUserComponent} from "../app-header-user/app-header-user.component";
import {AppHeaderBoutiqueComponent} from "../app-header-boutique/app-header-boutique.component";
import {AppHeaderAdminComponent} from "../app-header-admin/app-header-admin.component";
import {JwtPayload} from "../../../core/models/jwtPayload.model";

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
    AppHeaderAdminComponent
  ],
  templateUrl: './app-layout.component.html',
})

export class AppLayoutComponent implements OnInit {
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;
  userToken$!: Observable<JwtPayload | null>;


  constructor(public sidebarService: SidebarService, private authService : AuthService) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit() {
    this.userToken$ = this.authService.userToken$;
  }

  get containerClasses() {
    return [
      'flex-1',
      'transition-all',
      'duration-300',
      'ease-in-out',
      (this.isExpanded$ || this.isHovered$) ? 'xl:ml-[290px]' : 'xl:ml-[90px]',
      this.isMobileOpen$ ? 'ml-0' : ''
    ];
  }



}

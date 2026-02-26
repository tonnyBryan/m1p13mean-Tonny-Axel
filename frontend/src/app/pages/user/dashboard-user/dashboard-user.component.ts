import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {UserSummaryComponent} from "./user-summary/user-summary.component";
import {UserKpiComponent} from "./user-kpi/user-kpi.component";
import {UserOrdersComponent} from "./user-orders/user-orders.component";
import {UserWishlistComponent} from "./user-wishlist/user-wishlist.component";

@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserSummaryComponent,
    UserKpiComponent,
    UserOrdersComponent,
    UserWishlistComponent,
  ],
  templateUrl: './dashboard-user.component.html',
})
export class DashboardUserComponent {}
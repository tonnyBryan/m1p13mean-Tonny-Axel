import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../../../services/wishlist.service';
import {NgClass} from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: 'app-user-wishlist',
  standalone: true,
  imports: [NgClass],
  templateUrl: './user-wishlist.component.html',
  styleUrls: ['./user-wishlist.component.css']
})
export class UserWishlistComponent implements OnInit, OnDestroy {
  wishlistCount = 0;
  hasItems = false;
  private sub: Subscription | null = null;

  constructor(
      private wishlistService: WishlistService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.wishlistService.getWishlistCount().subscribe(count => {
      this.wishlistCount = count || 0;
      this.hasItems = count > 0;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  goToWishlist() {
    this.router.navigate(['/v1/wishlist']);
  }
}
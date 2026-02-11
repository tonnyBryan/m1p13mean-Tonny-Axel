import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommandeService } from '../../../../services/commande.service';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-user-cart',
  imports: [
    NgIf
  ],
  templateUrl: './user-cart.component.html',
  styleUrl: './user-cart.component.css',
})
export class UserCartComponent implements OnInit, OnDestroy {
  cartCount = 0;
  private sub: Subscription | null = null;

  constructor(private commandeService: CommandeService) {}

  ngOnInit(): void {
    this.sub = this.commandeService.cartCount$.subscribe(c => this.cartCount = c || 0);
    // refresh on init
    this.commandeService.refreshDraftCount().subscribe();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

}

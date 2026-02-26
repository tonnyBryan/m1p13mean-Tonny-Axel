import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-unfound',
  standalone: true,
  templateUrl: './product-unfound.component.html',
})
export class ProductUnfoundComponent {
  @Input() idStore: string = '';

  constructor(private router: Router) {}

  goToStore(): void {
    this.router.navigate(['/v1/stores', this.idStore]);
  }

  goToStores(): void {
    this.router.navigate(['/v1/stores']);
  }
}
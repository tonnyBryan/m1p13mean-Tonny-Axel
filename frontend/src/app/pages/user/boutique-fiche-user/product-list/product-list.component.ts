import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
    @Input() boutiqueId: string = '';

    ngOnInit(): void {
        console.log('Boutique ID for products:', this.boutiqueId);
        // TODO: Load products based on boutiqueId
    }
}
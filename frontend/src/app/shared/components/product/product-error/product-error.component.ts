import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-product-error',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './product-error.component.html',
    styleUrls: ['./product-error.component.css']
})
export class ProductErrorComponent {
    @Input() message: string = 'Une erreur est survenue';
    @Input() linkForBackButton: string = '/store/products';
    @Input() linkText: string = 'Retour aux produits';
}
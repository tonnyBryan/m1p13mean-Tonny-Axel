import {Component, Input} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-product-unavailable',
  imports: [],
  templateUrl: './product-unavailable.component.html',
  styleUrl: './product-unavailable.component.css',
})
export class ProductUnavailableComponent {
    @Input() idStore : String | undefined;
    constructor(protected router : Router) {
    }
}

import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-skeleton-cart',
    imports: [
        NgForOf,
        NgIf
    ],
  templateUrl: './skeleton-cart.component.html',
  styleUrl: './skeleton-cart.component.css',
})
export class SkeletonCartComponent {

}

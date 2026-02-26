import { Component, Input } from '@angular/core';
import {NgClass, NgForOf} from "@angular/common";

@Component({
  selector: 'app-rating-star',
  templateUrl: './rating-star.component.html',
  imports: [
    NgClass,
    NgForOf
  ]
})
export class RatingStarComponent {
  @Input() count: number = 0; // nombre d'étoiles remplies
  @Input() max: number = 5;   // nombre total d'étoiles

  get stars(): number[] {
    return Array(this.max).fill(0).map((_, i) => i + 1);
  }
}

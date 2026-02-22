import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-boutique-ratings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-ratings.component.html',
})
export class BoutiqueRatingsComponent {

  @Input() ratings: any[] | null = null;
  @Input() isLoading = true;

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  truncate(text: string, max: number = 80): string {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short',
    }).format(new Date(date));
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
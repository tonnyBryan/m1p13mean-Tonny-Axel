import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms 200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PaymentSuccessComponent implements OnInit {
  @Input() order: any; // L'objet res.data du paiement

  constructor(public router: Router) {}

  ngOnInit(): void {
    // Confetti effect (optionnel)
    this.triggerConfetti();
  }

  /**
   * Formate le prix
   */
  formatPrice(price: number): string {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0 });
  }

  /**
   * Formate la date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retourne le nombre total d'articles
   */
  getTotalItems(): number {
    return this.order?.products?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  }

  /**
   * Effet confetti (optionnel - nécessite canvas-confetti)
   */
  triggerConfetti(): void {
    // Si vous voulez ajouter des confettis :
    // npm install canvas-confetti
    // import confetti from 'canvas-confetti';
    // confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }

  /**
   * Navigation vers les commandes
   */
  goToOrders(): void {
    this.router.navigate(['/v1/orders']);
  }

  /**
   * Navigation vers les boutiques
   */
  continueShopping(): void {
    this.router.navigate(['/v1/stores']);
  }
}
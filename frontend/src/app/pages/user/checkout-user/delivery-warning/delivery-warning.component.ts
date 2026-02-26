import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-warning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-warning.component.html',
  styleUrls: ['./delivery-warning.component.css']
})
export class DeliveryWarningComponent implements OnInit {
  @Input() boutique: any; // La boutique avec livraisonConfig

  constructor() {}

  ngOnInit(): void {}

  /**
   * Vérifie si la livraison est activée pour cette boutique
   */
  isDeliveryEnabled(): boolean {
    return !!(this.boutique?.livraisonConfig?.isDeliveryAvailable);
  }

  /**
   * Vérifie si la livraison est disponible aujourd'hui
   */
  isDeliveryAvailableToday(): boolean {
    if (!this.boutique?.livraisonConfig?.deliveryDays) return false;

    const jsDay = new Date().getDay();
    const apiDay = jsDay === 0 ? 7 : jsDay;
    const todayDelivery = this.boutique.livraisonConfig.deliveryDays.find((d: any) => d.day === apiDay);

    return todayDelivery?.isActive || false;
  }

  /**
   * Vérifie si l'heure limite de commande pour la livraison aujourd'hui est dépassée
   */
  isDeliveryAvailableNow(): boolean {
    if (!this.boutique?.livraisonConfig?.orderCutoffTime) return false;

    const cutoffTime = this.boutique.livraisonConfig.orderCutoffTime; // ex: "18:00"
    const now = new Date();

    // Parser l'heure limite (format "HH:MM")
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);

    // Créer une date pour l'heure limite aujourd'hui
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffHour, cutoffMinute, 0, 0);

    // Retourne true si on est avant l'heure limite
    return now < cutoffDate;
  }

  /**
   * Retourne l'heure limite de commande formatée (ex: "18:00")
   */
  getOrderCutoffTime(): string {
    return this.boutique?.livraisonConfig?.orderCutoffTime || '';
  }

  /**
   * Retourne le prochain jour de livraison disponible
   */
  getNextDeliveryDay(): string {
    if (!this.boutique?.livraisonConfig?.deliveryDays) return '';

    const deliveryDays = this.boutique.livraisonConfig.deliveryDays;
    const today = new Date();
    let currentDay = today.getDay(); // 0 = dimanche, 1 = lundi, etc.

    // Convertir en format API (1 = lundi, 7 = dimanche)
    let apiDay = currentDay === 0 ? 7 : currentDay;

    // Chercher le prochain jour actif (maximum 7 jours)
    for (let i = 1; i <= 7; i++) {
      apiDay = apiDay + 1;
      if (apiDay > 7) apiDay = 1; // Boucler sur la semaine

      const dayConfig = deliveryDays.find((d: any) => d.day === apiDay);
      if (dayConfig?.isActive) {
        return this.getDayName(apiDay);
      }
    }

    return '';
  }

  /**
   * Retourne le nom du jour en anglais selon le numéro API
   */
  getDayName(apiDay: number): string {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[apiDay] || '';
  }

  /**
   * Vérifie s'il faut afficher un avertissement de livraison
   */
  shouldShowWarning(): boolean {
    // Cas 1: Livraison complètement désactivée
    if (!this.isDeliveryEnabled()) return true;

    // Cas 2: Livraison non disponible aujourd'hui
    if (!this.isDeliveryAvailableToday()) return true;

    // Cas 3: Heure limite dépassée
    if (this.isDeliveryAvailableToday() && !this.isDeliveryAvailableNow()) return true;

    return false;
  }
}
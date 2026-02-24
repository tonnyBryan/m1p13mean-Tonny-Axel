import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plan-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-detail-modal.component.html',
})
export class PlanDetailModalComponent {
  @Input() plan: 'A' | 'B' | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() selectPlan = new EventEmitter<'A' | 'B'>();

  planAFeatures = [
    {
      icon: 'map', color: 'amber',
      title: 'Visible on the platform map',
      description: 'Your store appears on our interactive map. Nearby customers discover you instantly, even without knowing your name.',
    },
    {
      icon: 'box', color: 'blue',
      title: 'Full product management',
      description: 'Add, edit and organize your products with photos, descriptions, prices and categories — all from your dashboard.',
    },
    {
      icon: 'stock', color: 'indigo',
      title: 'Stock & inventory management',
      description: 'Track your stock levels in real time. Get automatic alerts before a product runs out so you never miss a sale.',
    },
    {
      icon: 'orders', color: 'purple',
      title: 'Orders & direct sales',
      description: 'Receive and manage orders directly through the platform. Accept, prepare and confirm every order in one click.',
    },
    {
      icon: 'delivery', color: 'green',
      title: 'Real-time delivery tracking',
      description: 'You and your customers track every delivery live. Automatic status updates, notifications and full order history.',
    },
    {
      icon: 'analytics', color: 'brand',
      title: 'Analytics & real-time data',
      description: 'Visualize your sales, top products, daily revenue and trends. Make smarter decisions powered by your own data.',
    },
    {
      icon: 'reviews', color: 'yellow',
      title: 'Customer reviews on your products',
      description: 'Customers leave ratings and reviews on your products. Build credibility and attract new buyers through social proof.',
    },
    {
      icon: 'promo', color: 'red',
      title: 'Promotions & discount codes',
      description: 'Create promo codes, flash sales and special offers. Boost your sales during events or clear stock faster.',
    },
  ];

  planBFeatures = [
    {
      icon: 'key', color: 'purple',
      title: 'Turnkey ready-to-use box',
      description: 'Your box is fully set up and ready on day one. No renovation, no logistics — just move in and start selling.',
    },
    {
      icon: 'location', color: 'pink',
      title: 'Prime location inside the center',
      description: 'Benefit from the center\'s existing foot traffic. Maximum visibility with customers already walking past your box every day.',
    },
    {
      icon: 'discount', color: 'green',
      title: 'Reduced hosting fee',
      description: 'Because your box is inside our center, your monthly hosting fee is lower than the External Store plan. More value, less cost.',
    },
    {
      icon: 'orders', color: 'blue',
      title: 'Orders & direct sales',
      description: 'Receive and manage all your orders directly from the platform dashboard, whether in-store or online.',
    },
    {
      icon: 'box', color: 'indigo',
      title: 'Full product management',
      description: 'Add, edit and organize your products with photos, descriptions, prices and categories — all from your dashboard.',
    },
    {
      icon: 'analytics', color: 'brand',
      title: 'Analytics & real-time data',
      description: 'Track your sales performance, best-selling products and revenue trends in real time from your dashboard.',
    },
    {
      icon: 'reviews', color: 'yellow',
      title: 'Customer reviews on your products',
      description: 'Customers leave ratings and reviews directly on your products. Build trust and attract more buyers with social proof.',
    },
    {
      icon: 'support', color: 'teal',
      title: 'Dedicated on-site support',
      description: 'Our team is physically present in the center to help you with any issue, setup question or operational need.',
    },
  ];

  choose(): void {
    this.selectPlan.emit(this.plan!);
    this.close.emit();
  }
}
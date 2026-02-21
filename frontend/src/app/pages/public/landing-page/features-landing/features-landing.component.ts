import {AfterViewInit, Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import {AnimationObserverService} from "../../../../shared/services/animation-observer.service";

@Component({
  selector: 'app-features-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-landing.component.html',
})
export class FeaturesLandingComponent implements AfterViewInit {

  activeTab: 'client' | 'store' = 'client';

  constructor(private animObs: AnimationObserverService) {}

  ngAfterViewInit(): void {
    this.animObs.observe(document.querySelectorAll('.features-reveal'));
  }

  onTabChange(tab: 'client' | 'store'): void {
    this.activeTab = tab;
    // Re-observer les nouvelles cards après changement de tab
    setTimeout(() => {
      this.animObs.observe(document.querySelectorAll('.features-card-reveal:not(.animate-in)'));
    }, 50);
  }

  clientFeatures = [
    {
      title: 'Browse All Stores',
      description: 'Explore hundreds of stores and thousands of products from one unified platform.',
      path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      icon: 'text-brand-600 dark:text-brand-400',
    },
    {
      title: 'Easy Ordering',
      description: 'Add to cart, choose delivery or pickup, and checkout in just a few taps.',
      path: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Track Your Orders',
      description: 'Follow your orders in real time from confirmation to delivery at your door.',
      path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Wishlist & Favorites',
      description: 'Save your favorite products and get notified when prices drop or stock is low.',
      path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-500 dark:text-red-400',
    },
    {
      title: 'Ratings & Reviews',
      description: 'Read honest reviews from other shoppers and share your own experience.',
      path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    {
      title: 'Share with Friends',
      description: 'Found something great? Share products directly with friends in one click.',
      path: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  ];

  storeFeatures = [
    {
      title: 'Manage Your Catalog',
      description: 'Add, edit, and organize your products with images, variants, stock and pricing.',
      path: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      icon: 'text-brand-600 dark:text-brand-400',
    },
    {
      title: 'Order Management',
      description: 'Receive, process and track all your orders from a single clean dashboard.',
      path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Delivery Configuration',
      description: 'Set your own delivery zones, pricing rules, available days and cutoff times.',
      path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Customer Insights',
      description: 'See who buys from you, what they love, and how your store is performing.',
      path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    {
      title: 'Promotions & Sales',
      description: 'Create discounts and sale prices to attract more customers and boost revenue.',
      path: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-500 dark:text-red-400',
    },
    {
      title: 'Notifications',
      description: 'Stay informed with instant alerts for new orders, reviews and store activity.',
      path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  ];
}
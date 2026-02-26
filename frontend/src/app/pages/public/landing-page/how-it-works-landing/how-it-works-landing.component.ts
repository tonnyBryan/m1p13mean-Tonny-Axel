import {AfterViewInit, Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {AnimationObserverService} from "../../../../shared/services/animation-observer.service";

@Component({
  selector: 'app-how-it-works-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './how-it-works-landing.component.html',
})
export class HowItWorksLandingComponent implements OnInit, AfterViewInit {


  activeTab: 'customer' | 'store' = 'customer';

  constructor(
      private animObs: AnimationObserverService,
  ) {}

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.animObs.observe(document.querySelectorAll('.hiw-reveal'));
  }

  onTabChange(tab: 'customer' | 'store'): void {
    this.activeTab = tab;
    setTimeout(() => {
      this.animObs.observe(document.querySelectorAll('.hiw-reveal:not(.animate-in)'));
    }, 50);
  }

  customerSteps = [
    {
      title: 'Create your account',
      description: 'Sign up for free in under a minute. Just your name, email, and a password — no credit card required.',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      tag: 'Takes 1 minute',
    },
    {
      title: 'Browse & discover stores',
      description: 'Explore hundreds of local stores and thousands of products. Filter by category, price, or rating.',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      tag: 'Hundreds of stores',
    },
    {
      title: 'Order & track delivery',
      description: 'Add to cart, choose delivery or pickup, and checkout in seconds. Track your order in real time.',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      tag: 'Real-time tracking',
    },
  ];

  storeSteps = [
    {
      title: 'Register your store',
      description: 'Create an account and set up your store profile with name, logo, and description.',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      tag: 'Quick setup',
    },
    {
      title: 'Add your products',
      description: 'Upload products with images, descriptions, pricing, and stock levels in minutes.',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      tag: 'Unlimited products',
    },
    {
      title: 'Configure delivery',
      description: 'Set your delivery zones, pricing rules, available days, and order cutoff times.',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      tag: 'Fully customizable',
    },
    {
      title: 'Receive & fulfill orders',
      description: 'Get notified instantly for new orders. Manage, confirm, and track everything from your dashboard.',
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      tag: 'Real-time dashboard',
    },
  ];
}
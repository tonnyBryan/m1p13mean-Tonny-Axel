import {AfterViewInit, Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {AnimationObserverService} from "../../../../shared/services/animation-observer.service";
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-testimonials-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './testimonials-landing.component.html',
})
export class TestimonialsLandingComponent implements AfterViewInit{
  appName = environment.plateformeName;

  constructor(private animObs: AnimationObserverService) {}

  ngAfterViewInit(): void {
    this.animObs.observe(document.querySelectorAll('.testi-reveal'));
  }

  testimonials = [
    {
      name: 'Sophie Martin',
      initials: 'SM',
      avatarColor: 'bg-gradient-to-br from-pink-400 to-rose-500',
      role: 'Customer',
      rating: 5,
      text: 'I discovered so many local stores I never knew existed. The ordering process is super smooth and I love being able to track my delivery in real time.',
      store: 'Ordered from La Maison du Style',
    },
    {
      name: 'Rakoto Jean',
      initials: 'RJ',
      avatarColor: 'bg-gradient-to-br from-brand-400 to-brand-600',
      role: 'Store Owner',
      rating: 5,
      text: 'Setting up my store took less than 30 minutes. Since joining ' + this.appName + ', my orders have doubled. The dashboard is clean and easy to manage even for non-tech people.',
      store: null,
    },
    {
      name: 'Camille Dupont',
      initials: 'CD',
      avatarColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
      role: 'Customer',
      rating: 5,
      text: 'Having all my favorite local stores in one app is a game changer. I use ' + this.appName + ' every week and the wishlist feature is perfect for keeping track of things I want to buy.',
      store: 'Ordered from BioNature & Co.',
    },
    {
      name: 'Hasina Rakoton',
      initials: 'HR',
      avatarColor: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      role: 'Store Owner',
      rating: 5,
      text: 'The delivery configuration is incredibly flexible. I can set my own zones, cutoff times, and pricing. My customers always know exactly what to expect.',
      store: null,
    },
    {
      name: 'Lucas Bernard',
      initials: 'LB',
      avatarColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
      role: 'Customer',
      rating: 5,
      text: 'What I love most is the transparency — I can see stock levels, delivery days, and pricing all before placing my order. No surprises at checkout.',
      store: 'Ordered from Atelier Malagasy',
    },
    {
      name: 'Fara Andria',
      initials: 'FA',
      avatarColor: 'bg-gradient-to-br from-cyan-400 to-blue-500',
      role: 'Store Owner',
      rating: 5,
      text: 'Customer reviews on ' + this.appName + ' have helped me improve my products and build trust. My store rating went from 3.8 to 4.9 in just two months.',
      store: null,
    },
  ];

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
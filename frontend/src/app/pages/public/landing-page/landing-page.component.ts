import {Component, OnInit} from '@angular/core';
import {HeroLandingComponent} from "./hero-landing/hero-landing.component";
import {FeaturesLandingComponent} from "./features-landing/features-landing.component";
import {CtaLandingComponent} from "./cta-landing/cta-landing.component";
import {HowItWorksLandingComponent} from "./how-it-works-landing/how-it-works-landing.component";
import {TestimonialsLandingComponent} from "./testimonials-landing/testimonials-landing.component";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-landing-page',
  imports: [
    HeroLandingComponent,
    FeaturesLandingComponent,
    CtaLandingComponent,
    HowItWorksLandingComponent,
    TestimonialsLandingComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent implements OnInit{
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (!fragment) return;
      setTimeout(() => {
        document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
  }
}

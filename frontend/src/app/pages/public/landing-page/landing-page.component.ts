import { Component } from '@angular/core';
import {HeroLandingComponent} from "./hero-landing/hero-landing.component";
import {FeaturesLandingComponent} from "./features-landing/features-landing.component";
import {CtaLandingComponent} from "./cta-landing/cta-landing.component";
import {HowItWorksLandingComponent} from "./how-it-works-landing/how-it-works-landing.component";
import {TestimonialsLandingComponent} from "./testimonials-landing/testimonials-landing.component";

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
export class LandingPageComponent {

}

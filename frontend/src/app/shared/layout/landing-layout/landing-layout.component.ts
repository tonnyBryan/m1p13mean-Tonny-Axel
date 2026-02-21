import { Component } from '@angular/core';
import {CtaLandingComponent} from "../../../pages/public/landing-page/cta-landing/cta-landing.component";
import {FeaturesLandingComponent} from "../../../pages/public/landing-page/features-landing/features-landing.component";
import {FooterLandingComponent} from "../../../pages/public/landing-page/footer-landing/footer-landing.component";
import {HeaderLandingComponent} from "../../../pages/public/landing-page/header-landing/header-landing.component";
import {HeroLandingComponent} from "../../../pages/public/landing-page/hero-landing/hero-landing.component";
import {
  HowItWorksLandingComponent
} from "../../../pages/public/landing-page/how-it-works-landing/how-it-works-landing.component";
import {
  TestimonialsLandingComponent
} from "../../../pages/public/landing-page/testimonials-landing/testimonials-landing.component";
import {ThemeToggleTwoComponent} from "../../components/common/theme-toggle-two/theme-toggle-two.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-landing-layout',
  imports: [
    CtaLandingComponent,
    FeaturesLandingComponent,
    FooterLandingComponent,
    HeaderLandingComponent,
    HeroLandingComponent,
    HowItWorksLandingComponent,
    TestimonialsLandingComponent,
    ThemeToggleTwoComponent,
    RouterOutlet
  ],
  templateUrl: './landing-layout.component.html',
  styleUrl: './landing-layout.component.css',
})
export class LandingLayoutComponent {

}

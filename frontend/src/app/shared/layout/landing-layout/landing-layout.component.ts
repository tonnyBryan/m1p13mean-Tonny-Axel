import { Component } from '@angular/core';
import {FooterLandingComponent} from "../../../pages/public/landing-page/footer-landing/footer-landing.component";
import {HeaderLandingComponent} from "../../../pages/public/landing-page/header-landing/header-landing.component";
import {ThemeToggleTwoComponent} from "../../components/common/theme-toggle-two/theme-toggle-two.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-landing-layout',
  imports: [
    FooterLandingComponent,
    HeaderLandingComponent,
    ThemeToggleTwoComponent,
    RouterOutlet
  ],
  templateUrl: './landing-layout.component.html',
  styleUrl: './landing-layout.component.css',
})
export class LandingLayoutComponent {

}

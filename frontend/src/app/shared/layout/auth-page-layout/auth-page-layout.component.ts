import {Component} from '@angular/core';
import { GridShapeComponent } from '../../components/common/grid-shape/grid-shape.component';
import {Router, RouterModule} from '@angular/router';
import { ThemeToggleTwoComponent } from '../../components/common/theme-toggle-two/theme-toggle-two.component';
import { environment } from '../../../../environments/environment';
import {NgForOf} from "@angular/common";


@Component({
  selector: 'app-auth-page-layout',
  imports: [
    GridShapeComponent,
    RouterModule,
    ThemeToggleTwoComponent,
    NgForOf,
  ],
  templateUrl: './auth-page-layout.component.html',
  styles: ``
})
export class AuthPageLayoutComponent {
  appName = environment.plateformeName;

}

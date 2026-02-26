import {Component} from '@angular/core';
import { RouterModule} from '@angular/router';
import { ThemeToggleTwoComponent } from '../../components/common/theme-toggle-two/theme-toggle-two.component';
import { environment } from '../../../../environments/environment';
import {NgForOf} from "@angular/common";


@Component({
  selector: 'app-auth-page-layout',
  imports: [
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

import {Component, OnInit} from '@angular/core';
import { GridShapeComponent } from '../../components/common/grid-shape/grid-shape.component';
import {Router, RouterModule} from '@angular/router';
import { ThemeToggleTwoComponent } from '../../components/common/theme-toggle-two/theme-toggle-two.component';
import {Observable} from "rxjs";
import {User} from "../../../core/models/user.model";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-auth-page-layout',
  imports: [
    GridShapeComponent,
    RouterModule,
    ThemeToggleTwoComponent,
  ],
  templateUrl: './auth-page-layout.component.html',
  styles: ``
})
export class AuthPageLayoutComponent {

}

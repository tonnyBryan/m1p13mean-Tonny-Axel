
import { Component } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import { FormsModule } from '@angular/forms';
import {AuthService} from "../../../services/auth.service";
import {CommonModule} from "@angular/common";
import { environment } from '../../../../../environments/environment';
import { ERROR_MESSAGES } from '../../../../core/constants/error-messages';


@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule, // ← ici pour *ngIf et autres directives
    FormsModule,  // pour [(ngModel)]
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  constructor(private router: Router, private authService: AuthService) { }

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';
  errorMessage: string = '';

  isLoading = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.isLoading = true;
    this.authService.login(this.email, this.password, environment.userRole).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/v1/stores']);
        } else {
          this.errorMessage = res.message || ERROR_MESSAGES.UNKNOWN;
        }
      },
      error: err => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = ERROR_MESSAGES.AUTH.IMPOSSIBLE_CONNECTION;
        }
      }
    });
  }

  onGoogleSignIn(): void {
    window.location.href = `${environment.apiBaseUrl}/auth/google`;
  }
}

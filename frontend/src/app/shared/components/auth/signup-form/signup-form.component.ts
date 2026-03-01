
import { Component } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import { FormsModule } from '@angular/forms';
import {environment} from "../../../../../environments/environment";
import {ERROR_MESSAGES} from "../../../../core/constants/error-messages";
import {AuthService} from "../../../services/auth.service";
import {NgIf} from "@angular/common";


@Component({
  selector: 'app-signup-form',
  imports: [
    RouterModule,
    FormsModule,
    NgIf,
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  constructor(private router: Router, private authService: AuthService) { }

  showPassword = false;
  isChecked = false;

  fname = '';
  email = '';
  password = '';

  isLoading = false;
  errorMessage: string = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignUp() {
    this.isLoading = true;
    this.authService.signup(this.fname, this.email, this.password, environment.userRole).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/v1/verify-email']);
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

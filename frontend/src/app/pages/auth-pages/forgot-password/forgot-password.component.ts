import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

type Step = 'email-input' | 'email-sent';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  currentStep: Step = 'email-input';
  email = '';
  isSending = false;

  constructor(
      private authService: AuthService,
      private toast: ToastService,
      private router: Router
  ) {}

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  submit(): void {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.toast.warning('Invalid Email', 'Please enter a valid email address');
      return;
    }

    this.isSending = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isSending = false;
        this.currentStep = 'email-sent';
      },
      error: () => {
        this.isSending = false;
        // On affiche quand même le success pour ne pas leak
        this.currentStep = 'email-sent';
      }
    });
  }

  goToSignIn(): void {
    this.router.navigate(['/signin']);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

type Step = 'verifying' | 'invalid-token' | 'form' | 'success';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  currentStep: Step = 'verifying';

  role = '';
  token = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;

  constructor(
      private route: ActivatedRoute,
      private authService: AuthService,
      private toast: ToastService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.currentStep = 'invalid-token';
      return;
    }

    this.authService.verifyResetToken(this.token).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.email = res.data?.email || '';
          this.currentStep = 'form';
        } else {
          this.currentStep = 'invalid-token';
        }
      },
      error: () => {
        this.currentStep = 'invalid-token';
      }
    });
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  get passwordStrong(): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(this.password);
  }

  submit(): void {
    if (!this.password || !this.confirmPassword) {
      this.toast.warning('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (!this.passwordStrong) {
      this.toast.warning('Weak Password', 'Password must contain uppercase, lowercase, number and special character');
      return;
    }

    if (!this.passwordsMatch) {
      this.toast.error('Mismatch', 'Passwords do not match');
      return;
    }

    this.isSubmitting = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.success) {
          this.role = res.data?.role || 'user';
          this.currentStep = 'success';
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'An error occurred. Please try again.';
        this.toast.error('Error', msg);
      }
    });
  }

  goToSignIn(): void {
    if (this.role === 'boutique') {
      this.router.navigate(['/store/signin']);
    } else {
      this.router.navigate(['/signin']);
    }
  }
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  isLoading = false;
  isOpen = false;
  revokeOtherSessions = false;

  constructor(
      private toast: ToastService,
      private auth: AuthService
  ) {}

  get passwordStrong(): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(this.newPassword);
  }

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  reset(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrent = false;
    this.showNew = false;
    this.showConfirm = false;
    this.isOpen = false;
  }

  submit(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
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

    this.isLoading = true;
    this.auth.changePassword(this.currentPassword, this.newPassword, this.revokeOtherSessions).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.toast.success('Success', 'Password changed successfully');
          this.reset();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'An error occurred. Please try again.';
        this.toast.error('Error', msg);
      }
    });
  }
}
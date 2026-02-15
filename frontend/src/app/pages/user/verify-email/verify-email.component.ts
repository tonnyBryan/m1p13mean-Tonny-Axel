import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from "../../../shared/services/toast.service";
import { UserProfileService } from "../../../shared/services/user-profile.service";
import { EmailService } from "../../../shared/services/email.service";
import {SkeletonVerifyEmailComponent} from "./skeleton-verify-email/skeleton-verify-email.component";
import {UserService} from "../../../shared/services/user.service";
import {User} from "../../../core/models/user.model";

type VerificationStep = 'email-input' | 'code-input' | 'verified' | 'blocked';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkeletonVerifyEmailComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  currentStep: VerificationStep = 'email-input';
  isInitialLoading = true;


  email: string = '';
  verificationCode: string[] = ['', '', '', '', '', ''];

  isSendingCode = false;
  isVerifying = false;
  canResend = false;
  resendCountdown = 0;

  // Blocage
  isBlocked = false;
  blockCountdown = 0;
  blockExpiresAt: Date | null = null;

  // Tentatives
  attempts = 0;
  maxAttempts = 5;

  private resendInterval: any;
  private blockInterval: any;

  user: User | null = null;

  constructor(
      private profileService: UserProfileService,
      private toast: ToastService,
      private router: Router,
      private emailService: EmailService,
      private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUserAndCheckVerification();
  }

  ngOnDestroy(): void {
    if (this.resendInterval) clearInterval(this.resendInterval);
    if (this.blockInterval) clearInterval(this.blockInterval);
  }


  loadUserAndCheckVerification(): void {
    this.isInitialLoading = true;

    this.userService.getUser(null).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const user = res.data;
          this.email = user.email || '';

          if (user.isEmailVerified) {
            this.currentStep = 'verified';
            this.isInitialLoading = false;
            this.profileService.setIsEmailVerified(true);
          } else {
            this.checkActiveVerification();
          }
        } else {
          this.isInitialLoading = false;
          this.toast.error('Error', 'Unable to load user information', 3000);
        }
      },
      error: (err) => {
        this.isInitialLoading = false;
        console.error('Error fetching user', err);

        const message = err.error?.message || 'An error occurred while fetching user';
        this.toast.error('Error', message, 5000);
      }
    });
  }

  checkActiveVerification(): void {
    this.emailService.getActiveVerification().subscribe({
      next: (res: any) => {
        this.isInitialLoading = false;

        if (res?.success && res?.data) {
          const activeCode = res.data;
          this.email = activeCode.email;
          this.attempts = activeCode.attempts || 0;

          if (activeCode.authorizedAt) {
            const authorizedAt = new Date(activeCode.authorizedAt);
            const now = new Date();

            if (now < authorizedAt) {
              this.isBlocked = true;
              this.blockExpiresAt = authorizedAt;
              this.currentStep = 'blocked';
              this.startBlockCountdown();
              return;
            }
          }

          // Il y a un code actif, passer à la saisie du code
          this.currentStep = 'code-input';
          this.startResendCountdown();
        }
      },
      error: (err: any) => {
        this.isInitialLoading = false;
        console.error('Error checking active verification:', err);
      }
    });
  }

  sendVerificationCode(): void {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.toast.warning('Invalid Email', 'Please enter a valid email address', 3000);
      return;
    }

    this.isSendingCode = true;

    this.emailService.sendVerification(this.email).subscribe({
      next: (res: any) => {
        this.isSendingCode = false;
        if (res?.success) {
          this.currentStep = 'code-input';
          this.attempts = res.data?.attempts || 0;
          this.startResendCountdown();
          this.toast.success(
              'Code Sent!',
              `A verification code has been sent to ${this.email}`,
              5000
          );
        }
      },
      error: (err: any) => {
        this.isSendingCode = false;
        console.error('Send verification error:', err);

        const errorCode = err.status;
        const message = err.error?.message || 'Failed to send code';

        if (errorCode === 439) {
          // Trop tôt pour renvoyer
          this.toast.warning('Please Wait', message, 5000);
        } else if (errorCode === 429) {
          // Max attempts atteint - bloqué 15 min
          this.toast.error('Too Many Attempts', message, 5000);
          // Recharger pour obtenir le authorizedAt
          this.checkActiveVerification();
        } else {
          this.toast.error('Error', message, 5000);
        }
      }
    });
  }

  verifyCode(): void {
    const code = this.verificationCode.join('');

    if (code.length !== 6) {
      this.toast.warning('Incomplete Code', 'Please enter all 6 digits', 3000);
      return;
    }

    this.isVerifying = true;

    this.emailService.verifyEmail({ email: this.email, code }).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        if (res?.success) {
          this.currentStep = 'verified';
          this.profileService.setIsEmailVerified(true);
          this.toast.success(
              'Email Verified! 🎉',
              'Your email has been successfully verified',
              5000
          );
        }
      },
      error: (err: any) => {
        this.isVerifying = false;
        console.error('Verification error:', err);

        const errorCode = err.status;
        const message = err.error?.message || 'Invalid code';

        if (errorCode === 429) {
          // Max attempts atteint
          this.toast.error('Maximum Attempts Reached', message, 5000);
          this.isBlocked = true;
          this.currentStep = 'blocked';
          // Recharger pour obtenir le authorizedAt
          this.checkActiveVerification();
        } else if (errorCode === 400) {
          // Code invalide
          this.toast.error('Invalid Code', message, 5000);
          // Incrémenter attempts localement
          const match = message.match(/(\d+) of (\d+)/);
          if (match) {
            this.attempts = parseInt(match[1], 10);
            this.maxAttempts = parseInt(match[2], 10);
          }
          // Clear code inputs
          this.verificationCode = ['', '', '', '', '', ''];
          document.getElementById('code-0')?.focus();
        } else {
          this.toast.error('Verification Failed', message, 5000);
        }
      }
    });
  }

  /**
   * ✅ Renvoyer le code
   */
  resendCode(): void {
    if (!this.canResend) return;

    this.isSendingCode = true;

    this.emailService.sendVerification(this.email).subscribe({
      next: (res: any) => {
        this.isSendingCode = false;
        if (res?.success) {
          this.attempts = res.data?.attempts || 0;
          this.startResendCountdown();
          this.toast.success('Code Resent!', `A new code has been sent to ${this.email}`, 5000);
          // Clear code inputs
          this.verificationCode = ['', '', '', '', '', ''];
          document.getElementById('code-0')?.focus();
        }
      },
      error: (err: any) => {
        this.isSendingCode = false;
        const errorCode = err.status;
        const message = err.error?.message || 'Failed to resend code';

        if (errorCode === 439) {
          this.toast.warning('Please Wait', message, 5000);
        } else if (errorCode === 429) {
          this.toast.error('Too Many Attempts', message, 5000);
          this.checkActiveVerification();
        } else {
          this.toast.error('Error', message, 5000);
        }
      }
    });
  }

  /**
   * Changer l'email
   */
  changeEmail(): void {
    this.currentStep = 'email-input';
    this.verificationCode = ['', '', '', '', '', ''];
    this.attempts = 0;
    this.canResend = false;
    if (this.resendInterval) clearInterval(this.resendInterval);
    if (this.blockInterval) clearInterval(this.blockInterval);
  }

  /**
   * Naviguer vers les stores
   */
  goToStores(): void {
    this.router.navigate(['/v1/stores']);
  }

  /**
   * ✅ Démarrer le compte à rebours de blocage (15 min)
   */
  private startBlockCountdown(): void {
    if (!this.blockExpiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = this.blockExpiresAt!.getTime() - now.getTime();

      if (diff <= 0) {
        this.isBlocked = false;
        this.blockCountdown = 0;
        if (this.blockInterval) clearInterval(this.blockInterval);
        // Retourner à l'écran d'email
        this.currentStep = 'email-input';
        this.toast.info('Block Lifted', 'You can now request a new code', 5000);
        return;
      }

      this.blockCountdown = Math.ceil(diff / 1000); // en secondes
    };

    updateCountdown();
    this.blockInterval = setInterval(updateCountdown, 1000);
  }

  /**
   * Démarrer le compte à rebours pour renvoyer (60s)
   */
  private startResendCountdown(): void {
    this.canResend = false;
    this.resendCountdown = 60;

    if (this.resendInterval) clearInterval(this.resendInterval);

    this.resendInterval = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        this.canResend = true;
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  /**
   * Valider le format email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * ✅ Formater le temps restant (MM:SS)
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Gérer l'input du code
   */
  onCodeInput(index: number, event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (value && !/^\d$/.test(value.slice(-1))) {
      input.value = this.verificationCode[index] || '';
      return;
    }

    value = value.slice(-1);
    this.verificationCode[index] = value;
    input.value = value;

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    if (index === 5 && value) {
      this.checkAndVerify();
    }
  }

  onCodeKeydown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        this.verificationCode[index - 1] = '';
        const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.value = '';
        }
      } else {
        this.verificationCode[index] = '';
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  }

  private checkAndVerify(): void {
    const code = this.verificationCode.join('');
    if (code.length === 6) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text')?.trim() || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((digit, i) => {
      this.verificationCode[i] = digit;
      const input = document.getElementById(`code-${i}`) as HTMLInputElement;
      if (input) input.value = digit;
    });

    const nextIndex = digits.length < 6 ? digits.length : 5;
    (document.getElementById(`code-${nextIndex}`) as HTMLInputElement)?.focus();

    if (this.verificationCode.every(d => d !== '')) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }
}
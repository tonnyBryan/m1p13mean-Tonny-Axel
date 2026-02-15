import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from "../../../shared/services/auth.service";
import { ToastService } from "../../../shared/services/toast.service";
import { UserProfileService } from "../../../shared/services/user-profile.service";

type VerificationStep = 'email-input' | 'code-input' | 'verified';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  currentStep: VerificationStep = 'email-input';

  email: string = '';
  verificationCode: string[] = ['', '', '', '', '', ''];

  isSendingCode = false;
  isVerifying = false;
  canResend = false;
  resendCountdown = 0;

  private resendInterval: any;

  constructor(
      private profileService: UserProfileService,
      private authService: AuthService,
      private toast: ToastService,
      private router: Router
  ) {}

  ngOnInit(): void {
    // Récupérer l'email de l'utilisateur
    this.email = this.authService.userHash?.email || '';

    // Vérifier si l'email est déjà vérifié
    if (this.profileService.isEmailVerified) {
      this.currentStep = 'verified';
    }
  }

  ngOnDestroy(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  /**
   * Envoyer le code de vérification
   */
  async sendVerificationCode(): Promise<void> {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.toast.warning('Invalid Email', 'Please enter a valid email address', 3000);
      return;
    }

    this.isSendingCode = true;

    // ✅ Simulation d'appel API (2 secondes)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TODO: Remplacer par l'appel API réel
    // this.authService.sendVerificationCode(this.email).subscribe({...});

    this.isSendingCode = false;
    this.currentStep = 'code-input';
    this.startResendCountdown();

    this.toast.success(
        'Code Sent!',
        `A verification code has been sent to ${this.email}`,
        5000
    );
  }

  /**
   * Vérifier le code
   */
  async verifyCode(): Promise<void> {
    const code = this.verificationCode.join('');

    if (code.length !== 6) {
      this.toast.warning('Incomplete Code', 'Please enter all 6 digits', 3000);
      return;
    }

    this.isVerifying = true;

    // ✅ Simulation d'appel API (2 secondes)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TODO: Remplacer par l'appel API réel
    // this.authService.verifyEmail(code).subscribe({
    //   next: (res) => {
    //     if (res.success) {
    //       this.currentStep = 'verified';
    //       this.profileService.setEmailVerified(true);
    //       this.toast.success('Email Verified!', 'Your email has been successfully verified', 5000);
    //     }
    //   },
    //   error: (err) => {
    //     this.toast.error('Verification Failed', err.error?.message || 'Invalid code', 5000);
    //   }
    // });

    // Simulation de succès
    this.isVerifying = false;
    this.currentStep = 'verified';
    // this.profileService.setIsEmailVerified(true);

    this.toast.success(
        'Email Verified! 🎉',
        'Your email has been successfully verified',
        5000
    );
  }

  /**
   * Renvoyer le code
   */
  async resendCode(): Promise<void> {
    if (!this.canResend) return;

    this.isSendingCode = true;

    // ✅ Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.isSendingCode = false;
    this.startResendCountdown();

    this.toast.success('Code Resent!', `A new code has been sent to ${this.email}`, 5000);
  }

  /**
   * Changer l'email
   */
  changeEmail(): void {
    this.currentStep = 'email-input';
    this.verificationCode = ['', '', '', '', '', ''];
    this.canResend = false;
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  /**
   * Naviguer vers les stores
   */
  goToStores(): void {
    this.router.navigate(['/v1/stores']);
  }

  /**
   * Démarrer le compte à rebours pour renvoyer
   */
  private startResendCountdown(): void {
    this.canResend = false;
    this.resendCountdown = 60; // 60 secondes

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
   * Gérer l'input du code (auto-focus suivant)
   */
  onCodeInput(index: number, event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Si on a tapé un caractère non numérique, on nettoie
    if (value && !/^\d$/.test(value.slice(-1))) {
      input.value = this.verificationCode[index] || '';
      return;
    }

    // On ne garde que le dernier caractère saisi
    value = value.slice(-1);
    this.verificationCode[index] = value;
    input.value = value; // Force la valeur propre dans l'input

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Vérification automatique
    if (index === 5 && value) {
      this.checkAndVerify();
    }
  }

  onCodeKeydown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      // Si la case actuelle est vide, on recule d'abord, puis on efface la précédente
      if (!input.value && index > 0) {
        event.preventDefault(); // Empêche le comportement par défaut
        this.verificationCode[index - 1] = '';
        const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.value = ''; // On vide visuellement aussi
        }
      } else {
        // Si la case n'est pas vide, on laisse le comportement naturel
        // mais on synchronise notre tableau
        this.verificationCode[index] = '';
      }
    }

    // Navigation avec les flèches (optionnel mais propre)
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
      this.verifyCode();
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text')?.trim() || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((digit, i) => {
      this.verificationCode[i] = digit;
    });

    // Focus sur le prochain champ vide
    const nextIndex = digits.length < 6 ? digits.length : 5;
    (document.getElementById(`code-${nextIndex}`) as HTMLInputElement)?.focus();

    if (this.verificationCode.every(d => d !== '')) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

}
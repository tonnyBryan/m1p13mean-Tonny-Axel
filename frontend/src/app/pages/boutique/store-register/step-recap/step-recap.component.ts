import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreRegisterData } from '../store-register.component';
import {StoreRegisterService} from "../../../../shared/services/store-register.service";

@Component({
  selector: 'app-step-recap',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-recap.component.html',
})
export class StepRecapComponent implements OnInit {
  @Input() formData!: StoreRegisterData;
  @Output() goToStep = new EventEmitter<number>();
  @Output() prev = new EventEmitter<void>();

  // OTP state
  otpSent = false;
  isSending = false;
  digits = ['', '', '', ''];
  isVerifying = false;
  otpError = '';
  resendCooldown = 0;
  private cooldownInterval: any;

  // Submit state
  isSubmitted = false;
  generatedPassword = '';
  copied = false;
  submitError = '';

  // Email edit state
  isEditingEmail = false;
  isCheckingEmail = false;
  emailError = '';

  readonly PLAN_A_PRICE = 15000;
  readonly PLAN_B_HOSTING = 8000;

  constructor(private storeRegisterService: StoreRegisterService) {}

  ngOnInit(): void {
    this.generatedPassword = this.generatePassword();
  }

  // ─────────────────────────────────────────
  // Email edit
  // ─────────────────────────────────────────
  toggleEmailEdit(): void {
    if (this.isEditingEmail) {
      // Sauvegarde — vérifier la dispo de l'email
      this.isCheckingEmail = true;
      this.emailError = '';

      this.storeRegisterService.checkEmail(this.formData.manager.email).subscribe({
        next: () => {
          this.isCheckingEmail = false;
          this.isEditingEmail = false;
          // Reset OTP si email changé
          this.otpSent = false;
          this.digits = ['', '', '', ''];
          this.otpError = '';
          this.resendCooldown = 0;
          clearInterval(this.cooldownInterval);
        },
        error: (err) => {
          this.isCheckingEmail = false;
          const status = err?.status || err?.error?.status;
          if (status === 409) {
            this.emailError = 'This email is already associated with a registered store.';
          } else {
            this.emailError = 'Unable to verify email availability. Please try again.';
          }
        }
      });
    } else {
      // Ouvrir l'édition
      this.isEditingEmail = true;
      this.emailError = '';
      setTimeout(() => {
        const emailInput = document.getElementById('manager-email-input') as HTMLInputElement;
        emailInput?.focus();
        emailInput?.select();
      }, 0);
    }
  }

  // ─────────────────────────────────────────
  // OTP
  // ─────────────────────────────────────────
  sendCode(): void {
    this.isSending = true;
    this.otpError = '';

    const name = `${this.formData.manager.firstName} ${this.formData.manager.lastName}`;

    this.storeRegisterService.sendOtp(this.formData.manager.email, name).subscribe({
      next: () => {
        this.isSending = false;
        this.otpSent = true;
        this.digits = ['', '', '', ''];
        this.startCooldown();
        setTimeout(() => document.getElementById('otp-r-0')?.focus(), 100);
      },
      error: (err) => {
        this.isSending = false;
        const status = err?.status || err?.error?.status;
        const message = err?.error?.message;

        if (status === 439) {
          this.otpError = message || 'Please wait before requesting a new code.';
        } else {
          this.otpError = 'Failed to send verification code. Please try again.';
        }
      }
    });
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;
    this.otpSent = false;
    this.sendCode();
  }

  verifyAndSubmit(): void {
    if (!this.isOtpComplete) return;
    this.isVerifying = true;
    this.otpError = '';
    this.submitError = '';
    this.formData.manager.password = this.generatedPassword;

    this.storeRegisterService.submitRegisterWithLogo(this.formData, this.otpCode).subscribe({
      next: () => {
        this.isVerifying = false;
        this.isSubmitted = true;
      },
      error: (err) => {
        this.isVerifying = false;
        const status = err?.status || err?.error?.status;
        const message = err?.error?.message;

        if (status === 400) {
          this.otpError = message || 'Invalid code. Please try again.';
          this.digits = ['', '', '', ''];
          setTimeout(() => document.getElementById('otp-r-0')?.focus(), 50);
        } else if (status === 404) {
          this.otpError = 'Code expired or not found. Please request a new one.';
          this.otpSent = false;
          this.digits = ['', '', '', ''];
        } else if (status === 429) {
          this.otpError = 'Too many failed attempts. Please request a new code.';
          this.otpSent = false;
          this.digits = ['', '', '', ''];
          this.resendCooldown = 0;
          clearInterval(this.cooldownInterval);
        } else {
          this.submitError = 'An unexpected error occurred. Please try again.';
        }
      }
    });
  }

  // ─────────────────────────────────────────
  // OTP input handlers
  // ─────────────────────────────────────────
  get otpCode(): string {
    return this.digits.join('');
  }

  get isOtpComplete(): boolean {
    return this.otpCode.length === 4;
  }

  onDigitInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (value && !/^\d$/.test(value.slice(-1))) {
      input.value = this.digits[index] || '';
      return;
    }

    value = value.slice(-1);
    this.digits[index] = value;
    input.value = value;
    this.otpError = '';

    if (value && index < 3) {
      const next = document.getElementById(`otp-r-${index + 1}`) as HTMLInputElement;
      next?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        this.digits[index - 1] = '';
        const prev = document.getElementById(`otp-r-${index - 1}`) as HTMLInputElement;
        if (prev) { prev.focus(); prev.value = ''; }
      } else {
        this.digits[index] = '';
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) document.getElementById(`otp-r-${index - 1}`)?.focus();
    if (event.key === 'ArrowRight' && index < 3) document.getElementById(`otp-r-${index + 1}`)?.focus();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 4) || '';
    if (pasted) {
      pasted.split('').forEach((char, i) => {
        this.digits[i] = char;
        const input = document.getElementById(`otp-r-${i}`) as HTMLInputElement;
        if (input) input.value = char;
      });
      document.getElementById(`otp-r-${Math.min(pasted.length, 3)}`)?.focus();
    }
  }

  // ─────────────────────────────────────────
  // Getters / Helpers
  // ─────────────────────────────────────────
  get selectedBox() {
    const boxes: any[] = [
      { id: 'BOX-01', label: 'Box 01', price: 20000 },
      { id: 'BOX-02', label: 'Box 02', price: 20000 },
      { id: 'BOX-03', label: 'Box 03', price: 25000 },
      { id: 'BOX-04', label: 'Box 04', price: 25000 },
      { id: 'BOX-05', label: 'Box 05', price: 30000 },
      { id: 'BOX-06', label: 'Box 06', price: 30000 },
      { id: 'BOX-07', label: 'Box 07', price: 35000 },
      { id: 'BOX-08', label: 'Box 08', price: 35000 },
      { id: 'BOX-09', label: 'Box 09', price: 40000 },
      { id: 'BOX-10', label: 'Box 10', price: 40000 },
    ];
    return boxes.find(b => b.id === this.formData.plan.box) || null;
  }

  get totalMonthly(): number {
    if (this.formData.plan.type === 'A') return this.PLAN_A_PRICE;
    if (this.formData.plan.type === 'B') return this.PLAN_B_HOSTING + (this.selectedBox?.price || 0);
    return 0;
  }

  get activeDays(): string {
    return this.formData.livraison.deliveryDays
        .filter(d => d.isActive)
        .map(d => d.label.slice(0, 3))
        .join(', ');
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-MG') + ' Ar';
  }

  copyCredentials(): void {
    const text = `Email: ${this.formData.manager.email}\nPassword: ${this.generatedPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }
}
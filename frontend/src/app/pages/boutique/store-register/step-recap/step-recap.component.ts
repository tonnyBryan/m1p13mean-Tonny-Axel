import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreRegisterData } from '../store-register.component';
import { StoreRegisterService } from "../../../../shared/services/store-register.service";
import { BoxService } from '../../../../shared/services/box.service';
import { CentreService } from '../../../../shared/services/centre.service';
import { Box } from '../../../../core/models/box.model';

@Component({
  selector: 'app-step-recap',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './step-recap.component.html',
})
export class StepRecapComponent implements OnInit, OnDestroy {
  @Input() formData!: StoreRegisterData;
  @Input() forceSuccess = false;
  @Output() goToStep = new EventEmitter<number>();
  @Output() prev = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  // ── Données dynamiques ────────────────────────────────────────────────
  planAPrice = 0;
  planBHostingPrice = 0;
  selectedBox: Box | null = null;
  isDataLoading = false;

  // ── OTP state ─────────────────────────────────────────────────────────
  otpSent = false;
  isSending = false;
  digits = ['', '', '', ''];
  isVerifying = false;
  otpError = '';
  resendCooldown = 0;
  private cooldownInterval: any;

  // ── Submit state ──────────────────────────────────────────────────────
  isSubmitted = false;
  generatedPassword = '';
  copied = false;
  submitError = '';

  // ── Email edit state ──────────────────────────────────────────────────
  isEditingEmail = false;
  isCheckingEmail = false;
  emailError = '';

  constructor(
      private storeRegisterService: StoreRegisterService,
      private boxService: BoxService,
      private centreService: CentreService
  ) {}

  ngOnInit(): void {
    if (this.forceSuccess) {
      this.generatedPassword = this.formData?.manager?.password || '';
      this.isSubmitted = true;
      return;
    }
    this.generatedPassword = this.generatePassword();
    this.loadDynamicData();
  }

  // ── Loaders ───────────────────────────────────────────────────────────

  private loadDynamicData(): void {
    this.isDataLoading = true;

    // Charge le centre pour les prix
    this.centreService.getCentreCommercial().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.planAPrice = res.data.planAPrice ?? 0;
          this.planBHostingPrice = res.data.planBPrice ?? 0;
        }
        // Charge ensuite la box sélectionnée si Plan B
        this.loadSelectedBox();
      },
      error: () => this.loadSelectedBox()
    });
  }

  private loadSelectedBox(): void {
    const boxId = this.formData.plan.box;
    if (this.formData.plan.type === 'B' && boxId) {
      this.boxService.getBoxes('all').subscribe({
        next: (res: any) => {
          this.isDataLoading = false;
          const boxes: Box[] = res?.success ? (res.data ?? []) : [];
          this.selectedBox = boxes.find(b => b._id === boxId) ?? null;
        },
        error: () => { this.isDataLoading = false; }
      });
    } else {
      this.isDataLoading = false;
    }
  }

  // ── Getters ───────────────────────────────────────────────────────────

  get totalMonthly(): number {
    if (this.formData.plan.type === 'A') return this.planAPrice;
    if (this.formData.plan.type === 'B') return this.planBHostingPrice + (this.selectedBox?.pricePerMonth || 0);
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

  // ── Email edit ────────────────────────────────────────────────────────

  toggleEmailEdit(): void {
    if (this.isEditingEmail) {
      this.isCheckingEmail = true;
      this.emailError = '';

      this.storeRegisterService.checkEmail(this.formData.manager.email).subscribe({
        next: () => {
          this.isCheckingEmail = false;
          this.isEditingEmail = false;
          this.otpSent = false;
          this.digits = ['', '', '', ''];
          this.otpError = '';
          this.resendCooldown = 0;
          clearInterval(this.cooldownInterval);
        },
        error: (err) => {
          this.isCheckingEmail = false;
          const status = err?.status || err?.error?.status;
          this.emailError = status === 409
              ? 'This email is already associated with a registered store.'
              : 'Unable to verify email availability. Please try again.';
        }
      });
    } else {
      this.isEditingEmail = true;
      this.emailError = '';
      setTimeout(() => {
        const el = document.getElementById('manager-email-input') as HTMLInputElement;
        el?.focus(); el?.select();
      }, 0);
    }
  }

  // ── OTP ───────────────────────────────────────────────────────────────

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
        this.otpError = status === 439
            ? (err?.error?.message || 'Please wait before requesting a new code.')
            : 'Failed to send verification code. Please try again.';
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
        this.submitted.emit();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── OTP input handlers ────────────────────────────────────────────────

  get otpCode(): string { return this.digits.join(''); }
  get isOtpComplete(): boolean { return this.otpCode.length === 4; }

  onDigitInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    if (value && !/^\d$/.test(value.slice(-1))) { input.value = this.digits[index] || ''; return; }
    value = value.slice(-1);
    this.digits[index] = value;
    input.value = value;
    this.otpError = '';
    if (value && index < 3) (document.getElementById(`otp-r-${index + 1}`) as HTMLInputElement)?.focus();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        this.digits[index - 1] = '';
        const prev = document.getElementById(`otp-r-${index - 1}`) as HTMLInputElement;
        if (prev) { prev.focus(); prev.value = ''; }
      } else { this.digits[index] = ''; }
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

  copyCredentials(): void {
    const text = `Email: ${this.formData.manager.email}\nPassword: ${this.generatedPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }

  private generatePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#!';
    const chars: string[] = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    const all = upper + lower + digits + special;
    while (chars.length < 9) chars.push(all[Math.floor(Math.random() * all.length)]);
    return chars.sort(() => Math.random() - 0.5).join('');
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    this.cooldownInterval = setInterval(() => {
      if (--this.resendCooldown <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }
}

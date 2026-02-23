import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {StoreRegisterData} from "../store-register.component";

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

  readonly PLAN_A_PRICE = 15000;
  readonly PLAN_B_HOSTING = 8000;

  ngOnInit(): void {
    this.generatedPassword = this.generatePassword();
  }

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

  get otpCode(): string {
    return this.digits.join('');
  }

  get isOtpComplete(): boolean {
    return this.otpCode.length === 4;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-MG') + ' Ar';
  }

  sendCode(): void {
    this.isSending = true;
    // Statique pour l'instant
    setTimeout(() => {
      this.isSending = false;
      this.otpSent = true;
      this.otpError = '';
      this.digits = ['', '', '', ''];
      this.startCooldown();
      setTimeout(() => document.getElementById('otp-r-0')?.focus(), 100);
    }, 1000);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    this.otpError = '';
    if (value && index < 3) {
      document.getElementById(`otp-r-${index + 1}`)?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      document.getElementById(`otp-r-${index - 1}`)?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 4) || '';
    pasted.split('').forEach((char, i) => { if (i < 4) this.digits[i] = char; });
    const lastIndex = Math.min(pasted.length - 1, 3);
    document.getElementById(`otp-r-${lastIndex}`)?.focus();
  }

  verifyAndSubmit(): void {
    if (!this.isOtpComplete) return;
    this.isVerifying = true;
    this.otpError = '';

    // Statique pour l'instant — code 1234
    setTimeout(() => {
      this.isVerifying = false;
      if (this.otpCode === '1234') {
        this.isSubmitted = true;
      } else {
        this.otpError = 'Invalid code. Please try again.';
        this.digits = ['', '', '', ''];
        document.getElementById('otp-r-0')?.focus();
      }
    }, 1000);
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;
    this.sendCode();
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
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

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }
}
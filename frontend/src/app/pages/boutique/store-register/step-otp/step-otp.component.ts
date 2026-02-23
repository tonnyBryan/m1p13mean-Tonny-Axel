import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-otp.component.html',
})
export class StepOtpComponent implements OnInit {
  @Input() email = '';
  @Output() verified = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  digits = ['', '', '', ''];
  isVerifying = false;
  isResending = false;
  error = '';
  resendCooldown = 0;
  private cooldownInterval: any;

  ngOnInit(): void {
    this.startCooldown();
  }

  get code(): string {
    return this.digits.join('');
  }

  get isValid(): boolean {
    return this.code.length === 4;
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    this.error = '';

    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 4) || '';
    pasted.split('').forEach((char, i) => {
      if (i < 4) this.digits[i] = char;
    });
    const lastIndex = Math.min(pasted.length - 1, 3);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  }

  verify(): void {
    if (!this.isValid) return;
    this.isVerifying = true;
    this.error = '';

    // Statique pour l'instant — code 1234 toujours valide
    setTimeout(() => {
      this.isVerifying = false;
      if (this.code === '1234') {
        this.verified.emit();
      } else {
        this.error = 'Invalid code. Please try again.';
        this.digits = ['', '', '', ''];
        document.getElementById('otp-0')?.focus();
      }
    }, 1000);
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;
    this.isResending = true;
    this.error = '';
    this.digits = ['', '', '', ''];

    // Statique pour l'instant
    setTimeout(() => {
      this.isResending = false;
      this.startCooldown();
    }, 1000);
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }
}
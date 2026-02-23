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

  isEditingEmail = false;
  toggleEmailEdit(): void {
    this.isEditingEmail = !this.isEditingEmail;

    if (this.isEditingEmail) {
      // On attend un cycle de rendu pour que l'input existe dans le DOM
      setTimeout(() => {
        const emailInput = document.getElementById('manager-email-input') as HTMLInputElement;
        emailInput?.focus();
        emailInput?.select(); // Optionnel : sélectionne le texte pour effacer plus vite
      }, 0);
    } else {
      console.log('Nouvel email enregistré :', this.formData.manager.email);
    }
  }

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

  onDigitInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // 1. Sécurité : Si ce n'est pas un chiffre, on remet la valeur précédente et on arrête
    if (value && !/^\d$/.test(value.slice(-1))) {
      input.value = this.digits[index] || '';
      return;
    }

    // 2. On ne garde que le dernier caractère
    value = value.slice(-1);
    this.digits[index] = value;
    input.value = value;
    this.otpError = ''; // On reset l'erreur dès qu'on tape

    // 3. Navigation vers l'avant (pour 4 cases, l'index max est 3)
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-r-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        this.digits[index - 1] = '';
        const prevInput = document.getElementById(`otp-r-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.value = '';
        }
      } else {
        this.digits[index] = '';
      }
    }

    // Flèches de navigation
    if (event.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-r-${index - 1}`)?.focus();
    }
    if (event.key === 'ArrowRight' && index < 3) {
      document.getElementById(`otp-r-${index + 1}`)?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 4) || '';

    if (pasted) {
      // On transforme la chaîne en tableau
      const pastedArray = pasted.split('');

      // On remplit le tableau global
      pastedArray.forEach((char, i) => {
        this.digits[i] = char;
        // On met à jour l'input physiquement pour éviter tout décalage visuel
        const input = document.getElementById(`otp-r-${i}`) as HTMLInputElement;
        if (input) input.value = char;
      });

      // Focus sur le dernier chiffre collé ou le dernier champ
      const targetIndex = Math.min(pastedArray.length, 3);
      document.getElementById(`otp-r-${targetIndex}`)?.focus();
    }
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
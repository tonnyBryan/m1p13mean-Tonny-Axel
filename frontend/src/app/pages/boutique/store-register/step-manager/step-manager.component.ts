import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {StoreRegisterService} from "../../../../shared/services/store-register.service";

@Component({
  selector: 'app-step-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-manager.component.html',
})
export class StepManagerComponent {
  @Input() data: { firstName: string; lastName: string; email: string } = {
    firstName: '', lastName: '', email: ''
  };
  @Output() dataChange = new EventEmitter<{ firstName: string; lastName: string; email: string }>();
  @Output() next = new EventEmitter<void>();

  isChecking = false;
  emailError = '';

  constructor(private storeRegisterService: StoreRegisterService) {}

  get isValid(): boolean {
    return this.data.firstName.trim().length >= 2
        && this.data.lastName.trim().length >= 2
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.email.trim());
  }

  onEmailChange(): void {
    // Reset l'erreur dès que l'user retape
    this.emailError = '';
  }

  submit(): void {
    if (!this.isValid) return;
    this.isChecking = true;
    this.emailError = '';

    this.storeRegisterService.checkEmail(this.data.email.trim()).subscribe({
      next: () => {
        this.isChecking = false;
        this.dataChange.emit(this.data);
        this.next.emit();
      },
      error: (err) => {
        this.isChecking = false;
        const status = err?.status || err?.error?.status;

        if (status === 409) {
          this.emailError = 'This email is already associated with a registered store.';
        } else {
          this.emailError = 'Unable to verify email availability. Please try again.';
        }
      }
    });
  }
}
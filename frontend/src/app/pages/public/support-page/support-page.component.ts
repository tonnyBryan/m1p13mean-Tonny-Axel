import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from "../../../../environments/environment";
import { SupportRequestService } from "../../../shared/services/support-request.service";

@Component({
  selector: 'app-support-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-page.component.html',
})
export class SupportPageComponent {
  appName: string = environment.plateformeName;
  appMail: string = environment.plateformeEmail;

  isSubmitting = false;
  submitted = false;
  submitError = '';
  sendingPhase = false;


  formErrors = {
    name: '',
    email: '',
    message: '',
  };

  form = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };

  constructor(private supportService: SupportRequestService) {}

  onSubmit(): void {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) return;

    if (this.form.name.trim().length < 2) {
      this.formErrors.name = 'Name must be at least 2 characters.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.form.email)) {
      this.formErrors.email = 'Please enter a valid email address.';
      return;
    }
    if (this.form.message.trim().length < 10) {
      this.formErrors.message = 'Message must be at least 10 characters.';
      return;
    }

    this.isSubmitting = true;
    this.sendingPhase = true;
    this.submitError = '';

    this.supportService.submit({
      fullName: this.form.name,
      email: this.form.email,
      subject: this.form.subject,
      message: this.form.message,
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          // Laisser l'overlay sending visible 800ms puis afficher succès
          setTimeout(() => {
            this.sendingPhase = false;
            this.submitted = true;
          }, 800);
        } else {
          this.sendingPhase = false;
          this.submitError = res.message ?? 'Something went wrong. Please try again.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.sendingPhase = false;
        this.submitError = err?.error?.message ?? 'Something went wrong. Please try again.';
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.sendingPhase = false;
    this.submitError = '';
    this.formErrors = { name: '', email: '', message: '' };
    this.form = { name: '', email: '', subject: '', message: '' };
  }
}
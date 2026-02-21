import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support-page',
  standalone: true,
    imports: [CommonModule, FormsModule],
  templateUrl: './support-page.component.html',
})
export class SupportPageComponent {

  isSubmitting = false;
  submitted = false;

  form = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };

  onSubmit(): void {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) return;

    this.isSubmitting = true;

    // Simule un appel API — à remplacer par votre service
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitted = true;
    }, 1500);
  }

  resetForm(): void {
    this.submitted = false;
    this.form = { name: '', email: '', subject: '', message: '' };
  }
}
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-boutique.component.html',
})
export class StepBoutiqueComponent {
  @Input() data: { name: string; description: string; logo: File | null; logoPreview: string | null } = {
    name: '', description: '', logo: null, logoPreview: null
  };
  @Output() dataChange = new EventEmitter<any>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  get isValid(): boolean {
    return this.data.name.trim().length >= 2
        && this.data.description.trim().length >= 10
        && this.data.logo !== null;
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.data.logo = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.data.logoPreview = reader.result as string;
      this.dataChange.emit(this.data);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.data.logo = null;
    this.data.logoPreview = null;
    this.dataChange.emit(this.data);
  }

  submit(): void {
    if (!this.isValid) return;
    this.dataChange.emit(this.data);
    this.next.emit();
  }
}
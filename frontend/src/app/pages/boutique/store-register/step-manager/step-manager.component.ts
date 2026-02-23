import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  get isValid(): boolean {
    return this.data.firstName.trim().length >= 2
        && this.data.lastName.trim().length >= 2
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.email.trim());
  }

  submit(): void {
    if (!this.isValid) return;
    this.dataChange.emit(this.data);
    this.next.emit();
  }
}
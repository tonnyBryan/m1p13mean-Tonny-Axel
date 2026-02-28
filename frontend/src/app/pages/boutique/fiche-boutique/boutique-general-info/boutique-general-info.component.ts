import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boutique-general-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boutique-general-info.component.html',
})
export class BoutiqueGeneralInfoComponent {
  @Input() boutique: any = null;
  @Output() editRequested = new EventEmitter<void>();

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
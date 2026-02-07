import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';

import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-user-meta-card',
  imports: [
    FormsModule
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {

  @Input() profile: any | null = null; // receives UserProfile or null

  constructor(public modal: ModalService) {}

  isOpen = false;
  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  handleSave() {
    // Will be implemented: close modal after parent handles save
    console.log('Saving changes in meta...');
    this.modal.closeModal();
  }
}

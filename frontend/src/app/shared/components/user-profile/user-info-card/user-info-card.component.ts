import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { FormsModule } from '@angular/forms';

import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { UserService } from '../../../services/user.service';
import {ERROR_MESSAGES} from "../../../../core/constants/error-messages";

@Component({
  selector: 'app-user-info-card',
  imports: [
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent,
    FormsModule
  ],
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent implements OnChanges {

  @Input() profile: any | null = null;
  @Output() profileSaved = new EventEmitter<any>();

  constructor(public modal: ModalService, private userService: UserService) {}

  isOpen = false;
  isLoading = false;
  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  // local form model
  form: any = {};

  ngOnChanges(changes: SimpleChanges) {
    // copy profile to form
    this.form = {
      firstName: this.profile?.firstName || '',
      lastName: this.profile?.lastName || '',
      phoneNumber: this.profile?.phoneNumber || '',
      description: this.profile?.description || '',
      photo: this.profile?.photo || ''
    };
  }

  handleSave() {
    // call API to upsert profile
    const payload = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      phoneNumber: this.form.phoneNumber,
      description: this.form.description,
      photo: this.form.photo
    };

    this.isLoading = true;
    this.userService.updateMyProfile(payload).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.profileSaved.emit(res.data || null);
          console.log('Profile updated successfully', res);
        } else {
          console.warn('Profile update response indicates failure', res);
        }
        this.isLoading = false;
        this.modal.closeModal();
      },
      error: (err) => {
        console.error('Error updating profile', err);
        this.isLoading = false;
        if (err.error && err.error.message) {
          alert(err.error.message);
        }
      }
    });
  }
}

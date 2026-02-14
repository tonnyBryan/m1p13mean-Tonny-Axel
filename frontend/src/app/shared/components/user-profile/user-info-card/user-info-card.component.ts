import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { FormsModule } from '@angular/forms';

import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { UserService } from '../../../services/user.service';
import {ToastService} from "../../../services/toast.service";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-user-info-card',
  imports: [
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent,
    FormsModule,
    NgIf
  ],
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent implements OnChanges {

  @Input() profile: any | null = null;
  @Output() profileSaved = new EventEmitter<any>();

  constructor(public modal: ModalService, private userService: UserService, private toast : ToastService) {}

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

  // Regex for validating dangerous characters (SQL injection, XSS, etc.)
  private readonly DANGEROUS_CHARS_REGEX = /[<>\"'`%;()\\=\-\*]/g;
  private readonly VALID_NAME_REGEX = /^[a-zA-Z\s\-'.éèêëàâäùûüîïôöœçñ]+$/;
  // International phone format: +country_code followed by digits (example: +212612345678)
  private readonly VALID_PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

  // Function to check if input contains dangerous characters
  isInputSafe(input: string): boolean {
    if (!input) return true;
    return !this.DANGEROUS_CHARS_REGEX.test(input);
  }

  // Function to check if name format is valid
  isValidNameFormat(input: string): boolean {
    if (!input) return false;
    return this.VALID_NAME_REGEX.test(input.trim());
  }

  // Function to check if phone number is valid international format
  isValidPhoneFormat(input: string): boolean {
    if (!input) return true; // Optional field
    return this.VALID_PHONE_REGEX.test(input.trim());
  }

  // Function to check if bio is valid (no useless content)
  isValidBio(input: string): boolean {
    if (!input) return true; // Optional field
    const trimmed = input.trim();
    if (trimmed.length === 0) return true;
    // Check minimum length and no repetitive characters
    if (trimmed.length < 3) return false;
    // Check for excessive repetition (e.g., "aaaaaaa")
    return !/(.)\1{4,}/.test(trimmed);
  }

  isFormInvalid(): boolean {
    if (!this.form) return true;

    // Required fields
    if (!this.form.firstName || this.form.firstName.trim() === '') return true;
    if (!this.form.lastName || this.form.lastName.trim() === '') return true;

    // Security checks
    if (!this.isInputSafe(this.form.firstName)) return true;
    if (!this.isInputSafe(this.form.lastName)) return true;

    // Name format
    if (!this.isValidNameFormat(this.form.firstName)) return true;
    if (!this.isValidNameFormat(this.form.lastName)) return true;

    // Optional phone
    if (this.form.phoneNumber && !this.isValidPhoneFormat(this.form.phoneNumber)) {
      return true;
    }

    // Optional bio
    if (this.form.description && !this.isValidBio(this.form.description)) {
      return true;
    }

    return false;
  }


  handleSave() {
    // Validation
    if (!this.form.firstName || this.form.firstName.trim() === '') {
      this.closeModal();
      this.toast.error('Error','First name cannot be empty');
      return;
    }
    if (!this.form.lastName || this.form.lastName.trim() === '') {
      this.closeModal();
      this.toast.error('Error','Last name cannot be empty');
      return;
    }

    // Validate firstName safety
    if (!this.isInputSafe(this.form.firstName)) {
      this.closeModal();
      this.toast.error('Error','First name contains invalid characters');
      return;
    }

    // Validate lastName safety
    if (!this.isInputSafe(this.form.lastName)) {
      this.closeModal();
      this.toast.error('Error','Last name contains invalid characters');
      return;
    }

    // Validate firstName format
    if (!this.isValidNameFormat(this.form.firstName)) {
      this.closeModal();
      this.toast.error('Error','First name can only contain letters, spaces, hyphens and apostrophes');
      return;
    }

    // Validate lastName format
    if (!this.isValidNameFormat(this.form.lastName)) {
      this.closeModal();
      this.toast.error('Error','Last name can only contain letters, spaces, hyphens and apostrophes');
      return;
    }

    // Validate phone number if provided
    if (this.form.phoneNumber && !this.isInputSafe(this.form.phoneNumber)) {
      this.closeModal();
      this.toast.error('Error','Phone number contains invalid characters');
      return;
    }

    if (this.isFormInvalid()) {
      this.closeModal();
      this.toast.error('Error','Please correct the errors in the form before saving');
      return;
    }

    // call API to upsert profile
    const payload = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      phoneNumber: this.form.phoneNumber || '',
      description: this.form.description || '',
      photo: this.form.photo || ''
    };

    this.isLoading = true;
    this.userService.updateMyProfile(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.profileSaved.emit(res.data || null);
          this.toast.success('Success','Profile updated successfully');
          this.closeModal();
        } else {
          console.warn('Profile update response indicates failure', res);
          this.toast.error('Error','Failed to update profile');
        }
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        console.error('Error updating profile', err);
        if (err.error && err.error.message) {
          this.toast.error('Error',err.error.message);
        } else {
          this.toast.error('Error','An error occurred while updating profile');
        }
      }
    });
  }
}

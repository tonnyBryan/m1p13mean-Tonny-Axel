import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';

import { FormsModule } from "@angular/forms";
import { SessionService } from "../../../services/session.service";
import { NgIf, NgClass } from "@angular/common";
import { UserService } from "../../../services/user.service";
import { ToastService } from "../../../services/toast.service";
import { UserProfileService } from "../../../services/user-profile.service";
import { ButtonComponent } from "../../ui/button/button.component";
import { InputFieldComponent } from "../../form/input/input-field.component";
import { LabelComponent } from "../../form/label/label.component";
import { ModalComponent } from "../../ui/modal/modal.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-user-meta-card',
  imports: [
    FormsModule,
    NgIf,
    NgClass,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
    RouterModule
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {

  @Input() profile: any | null = null; // receives UserProfile or null

  constructor(
    public modal: ModalService,
    private session: SessionService,
    private userService: UserService,
    private toast: ToastService,
    private profileService: UserProfileService
  ) {
  }

  get isEmailVerified(): boolean {
    return this.session.currentUser?.isEmailVerified === true;
  }

  isOpen = false;
  isLoading = false;
  editPhotoUrl = '';
  selectedFile: File | null = null;

  openModal() {
    this.editPhotoUrl = this.profile?.photo || '';
    this.selectedFile = null;
    this.isOpen = true;
  }

  closeModal() { this.isOpen = false; }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('Error', "Image is too large (max 5MB).");
        input.value = '';
        return;
      }
      this.selectedFile = file;

      // preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.editPhotoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  handleSave() {
    this.isLoading = true;
    let payload: any;

    if (this.selectedFile) {
      payload = new FormData();
      payload.append('photo', this.editPhotoUrl); // will be overwriten by file in backend, but keep old if needed
      payload.append('file', this.selectedFile);
    } else {
      payload = { photo: this.editPhotoUrl };
    }

    this.userService.updateMyProfile(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.success) {
          this.toast.success('Success', 'Profile photo updated successfully');
          if (this.profile) {
            this.profile.photo = res.data.photo;
          }
          this.session.updateAvatar(res.data.photo);
          this.closeModal();
        } else {
          this.toast.error('Error', 'Failed to update photo');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.toast.error('Error', 'An error occurred while updating photo');
      }
    });
  }
}

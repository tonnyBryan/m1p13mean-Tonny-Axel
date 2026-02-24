import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangePasswordComponent } from '../../../shared/components/common/change-password/change-password.component';
import { LoginHistoryComponent } from '../../../shared/components/common/login-history/login-history.component';

@Component({
  selector: 'app-security-boutique',
  standalone: true,
  imports: [CommonModule, ChangePasswordComponent, LoginHistoryComponent],
  templateUrl: './security-boutique.component.html',
})
export class SecurityBoutiqueComponent {
  activeSection: 'password' | 'history' = 'password';

  setSection(section: 'password' | 'history'): void {
    this.activeSection = section;
  }
}
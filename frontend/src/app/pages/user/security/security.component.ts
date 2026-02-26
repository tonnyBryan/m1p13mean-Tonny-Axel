import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../../shared/services/session.service';
import { ChangePasswordComponent } from '../../../shared/components/common/change-password/change-password.component';
import { LoginHistoryComponent } from '../../../shared/components/common/login-history/login-history.component';
import { DeviceAlertComponent } from '../../../shared/components/common/device-alert/device-alert.component';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, RouterModule, ChangePasswordComponent, LoginHistoryComponent, DeviceAlertComponent],
  templateUrl: './security.component.html',
})
export class SecurityComponent implements OnInit {
  isEmailVerified = false;
  isLoading = true;
  activeSection: 'password' | 'history' | 'device' | '2fa' = 'password';
  isAlertNewDevice = false;

  constructor(private session: SessionService) {}

  ngOnInit(): void {
    this.session.user$.subscribe(user => {
      if (user !== null) {
        this.isLoading = false;
        this.isEmailVerified = user?.isEmailVerified || false;
        this.isAlertNewDevice = user?.isAlertedToNewDevice || false;
      }
    });
  }

  setSection(section: 'password' | 'history' | 'device' | '2fa'): void {
    if ((section === 'device' || section === '2fa') && !this.isEmailVerified) return;
    this.activeSection = section;
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../shared/services/session.service';
import { ChangePasswordComponent } from '../../../shared/components/common/change-password/change-password.component';
import { LoginHistoryComponent } from '../../../shared/components/common/login-history/login-history.component';
import { DeviceAlertComponent } from '../../../shared/components/common/device-alert/device-alert.component';

@Component({
  selector: 'app-security-boutique',
  standalone: true,
  imports: [CommonModule, ChangePasswordComponent, LoginHistoryComponent, DeviceAlertComponent],
  templateUrl: './security-boutique.component.html',
})
export class SecurityBoutiqueComponent implements OnInit {
  activeSection: 'password' | 'history' | 'device' = 'password';
  isAlertNewDevice = false;

  constructor(private session: SessionService) {}

  ngOnInit(): void {
    this.session.user$.subscribe(user => {
      if (user !== null) {
        this.isAlertNewDevice = user?.isAlertedToNewDevice || false;
      }
    });
  }

  setSection(section: 'password' | 'history' | 'device'): void {
    this.activeSection = section;
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../../shared/services/session.service';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, RouterModule, ChangePasswordComponent],
  templateUrl: './security.component.html',
})
export class SecurityComponent implements OnInit {
  isEmailVerified = false;
  activeSection: 'password' | 'history' | 'device' | '2fa' = 'password';

  constructor(private session: SessionService) {}

  ngOnInit(): void {
    this.session.user$.subscribe(user => {
      this.isEmailVerified = user?.isEmailVerified || false;
    });
  }

  setSection(section: 'password' | 'history' | 'device' | '2fa'): void {
    if ((section === 'device' || section === '2fa') && !this.isEmailVerified) return;
    this.activeSection = section;
  }
}
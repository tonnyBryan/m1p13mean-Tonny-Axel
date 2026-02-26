import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-history.component.html',
})
export class LoginHistoryComponent implements OnInit {
  sessions: any[] = [];
  loading = true;
  revokingId: string | null = null;

  constructor(
      private authService: AuthService,
      private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.authService.getLoginHistory({ limit: 10, sort: '-createdAt' }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.sessions = res.data.items;
        }
      },
      error: () => {
        this.loading = false;
        this.toast.error('Error', 'Failed to load login history');
      }
    });
  }

  revokeSession(sessionId: string): void {
    this.toast.confirm(
        'Revoke Session',
        'Are you sure you want to revoke this session? The device will be logged out immediately.',
        () => {
          this.revokingId = sessionId;
          this.authService.revokeSession(sessionId).subscribe({
            next: (res: any) => {
              this.revokingId = null;
              if (res.success) {
                this.sessions = this.sessions.map(s =>
                    s._id === sessionId ? { ...s, isRevoked: true } : s
                );
                this.toast.success('Success', 'Session revoked successfully');
              }
            },
            error: () => {
              this.revokingId = null;
              this.toast.error('Error', 'Failed to revoke session');
            }
          });
        },
        () => {},
        {
          confirmLabel: 'Revoke',
          cancelLabel: 'Cancel',
          variant: 'danger',
          position: 'top-center',
          backdrop: true,
        }
    );
  }

  getDeviceIcon(device: string): 'mobile' | 'tablet' | 'desktop' {
    if (!device) return 'desktop';
    const d = device.toLowerCase();
    if (d === 'mobile') return 'mobile';
    if (d === 'tablet') return 'tablet';
    return 'desktop';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
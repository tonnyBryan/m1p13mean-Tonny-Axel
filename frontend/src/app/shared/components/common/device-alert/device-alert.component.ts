import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-device-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-alert.component.html',
})
export class DeviceAlertComponent implements OnChanges {
  /** Current state passed from parent (user.isAlertedToNewDevice) */
  @Input() enabled = false;

  /** Emitted when user clicks "Login History" link in footer */
  @Output() goToHistory = new EventEmitter<void>();

  isAlertEnabled = false;
  isLoading = false;

  constructor(
      private auth: AuthService,
      private toast: ToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enabled']) {
      this.isAlertEnabled = this.enabled;
    }
  }

  toggle(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.auth.toggleAlertDevice().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success) {
          this.isAlertEnabled = !this.isAlertEnabled;
          if (this.isAlertEnabled) {
            this.toast.success('Alerts enabled', 'You will be notified when a new device logs into your account.');
          } else {
            this.toast.info('Alerts disabled', 'You will no longer receive new device login alerts.');
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Failed to update alert settings. Please try again.';
        this.toast.error('Error', msg);
      }
    });
  }
}